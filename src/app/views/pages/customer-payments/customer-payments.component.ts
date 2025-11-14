import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgbCalendar, NgbDateStruct, NgbModal, NgbModalRef, NgbDate, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BreadcrumbComponent } from '../../layout/breadcrumb/breadcrumb.component';

interface Payment {
  id: number | null;
  customer_id: number | null;
  payment_date?: NgbDateStruct | string | null;
  payment_method: string | null;
  amount: number | null;
  description?: string | null;
  status: string | null;
  created_by_id?: number;
  created_by?: string;
  created_at?: string;
  updated_by_id?: number;
  updated_at?: string;
  image?: File | string | null;
  image_url?: string;
}

@Component({
  selector: 'app-customer-payments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxDatatableModule,
    NgSelectModule,
    NgbDatepickerModule,
    BreadcrumbComponent,
  ],
  templateUrl: './customer-payments.component.html'
})
export class CustomersPaymentsComponent implements OnInit {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;

  // model / lists
  currentRecord: Payment = {
    id: null,
    customer_id: null,
    payment_method: null,
    amount: null,
    payment_date: '',
    description: '',
    status: 'Active',
    image: '',
  };

  customers: any[] = [];
  status: { id: string, name: string }[] = [];
  payment_method: { id: string, name: string }[] = [];
  payment_date: NgbDate | null = null;

  // table state
  rows: Payment[] = [];
  temp: Payment[] = [];
  selected: any[] = [];
  loadingIndicator = false;
  selectedFile: File | null = null;
  isImageDeleted = false;

  // UI state
  formErrors: any = {};
  imagePreview: any = null;
  isEditMode = false;
  errorMessage: string | null = null;
  ColumnMode = ColumnMode;

  @ViewChild('table') table!: DatatableComponent;
  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  activeModal: NgbModalRef | null = null;

  constructor(
    private http: HttpClient,
    private modalService: NgbModal,
    private calendar: NgbCalendar
  ) {}

  ngOnInit(): void {
    this.fetchCustomers();
    this.fetchPaymentMethod();
    this.fetchStatus();
    this.fetchRecords();
  }

  // ------------------------
  // Helpers
  // ------------------------
  formatDate(invoice_date: any): string {
    if (!invoice_date) return '';
    if (typeof invoice_date === 'string') return invoice_date;
    return `${invoice_date.year}-${String(invoice_date.month).padStart(2, '0')}-${String(invoice_date.day).padStart(2, '0')}`;
  }

  // ------------------------
  // Filters / selection
  // ------------------------
  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    const temp = this.temp.filter(d =>
      (d.description ?? '').toLowerCase().includes(val)
    );

    this.rows = temp;
    this.table.offset = 0;
  }

  selectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selected = checked ? [...this.rows] : [];
  }

  isSelected(row: any): boolean {
    return this.selected.some(selectedRow => selectedRow.id === row.id);
  }

  toggleSelection(row: any): void {
    if (this.isSelected(row)) {
      this.selected = this.selected.filter(selectedRow => selectedRow.id !== row.id);
    } else {
      this.selected.push(row);
    }
  }

  clearError(field: string) {
    this.formErrors[field] = null;
  }

  // ------------------------
  // File handling
  // ------------------------
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);

      this.clearError('image');
    }
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.currentRecord.image = '';
    this.isImageDeleted = true;
  }

  // ------------------------
  // Fetch data
  // ------------------------
  fetchCustomers(): void {
    this.http.get<any[]>(`${this.API_URL}/active/customers`).subscribe({
      next: (response) => {
        this.customers = response || [];
      },
      error: (error) => console.error('Failed to fetch customers:', error)
    });
  }

  fetchStatus(): void {
    this.http.get<any>(`${this.API_URL}/status`).subscribe({
      next: (response) => {
        if (response && response.data && typeof response.data === 'object') {
          this.status = Object.entries(response.data)
            .map(([key, value]) => ({ id: String(key), name: String(value) }));
        } else {
          // fallback common statuses
          this.status = [{ id: 'Active', name: 'Active' }, { id: 'Inactive', name: 'Inactive' }];
        }
      },
      error: (error) => {
        console.error('Failed to fetch status:', error);
        this.status = [{ id: 'Active', name: 'Active' }, { id: 'Inactive', name: 'Inactive' }];
      }
    });
  }

  fetchPaymentMethod(): void {
    this.http.get<any>(`${this.API_URL}/payment-method`).subscribe({
      next: (response) => {
        if (response && response.data && typeof response.data === 'object') {
          this.payment_method = Object.entries(response.data).map(([key, value]) => ({
            id: String(key),
            name: String(value)
          }));
        } else {
          console.error('Invalid response format for payment_method:', response);
          this.payment_method = [];
        }
      },
      error: (error) => {
        console.error('Failed to fetch payment_method:', error);
        this.payment_method = [];
      }
    });
  }

  fetchRecords(): void {
    this.loadingIndicator = true;

    this.http.get<Payment[]>(`${this.API_URL}/customer-payments`).subscribe({
      next: (response) => {
        console.log(response);
        this.rows = response;
        this.temp = [...response];
        this.loadingIndicator = false;

        this.rows.forEach((payment) => {
          payment.image_url = payment.image_url
            ? `${this.IMAGE_URL}/customer-payments/${payment.image_url}`
            : 'images/placeholder.jpg';
        });
      },
      error: (error) => {
        console.error('Error fetching records:', error);
        this.loadingIndicator = false;
      }
    });
  }

  // ------------------------
  // Modal / edit / add
  // ------------------------
  editRecord(row: Payment): void {
    this.isEditMode = true;
    this.formErrors = {};
    this.errorMessage = null;

    // Ensure the date is in NgbDateStruct format for ngbDatepicker
    let paymentDate: NgbDateStruct | null = null;
    if (row.payment_date) {
      if (typeof row.payment_date === 'string') {
        const parts = row.payment_date.split('-'); // assuming yyyy-mm-dd
        if (parts.length === 3) {
          paymentDate = {
            year: +parts[0],
            month: +parts[1],
            day: +parts[2]
          };
        }
      } else {
        paymentDate = row.payment_date as NgbDateStruct;
      }
    }

    this.currentRecord = {
      ...row,
      payment_date: paymentDate
    };

    // Set image preview if exists
    if (row.image_url && !row.image_url.includes('placeholder.jpg')) {
      this.imagePreview = row.image_url;
    } else {
      this.imagePreview = null;
    }

    this.activeModal = this.modalService.open(this.modalTemplate, { ariaLabelledBy: 'exampleModalLabel' });
  }

  openModal(): void {
    this.isEditMode = false;
    this.errorMessage = null;
    this.formErrors = {};

    this.currentRecord = {
      id: null,
      customer_id: null,
      payment_method: null,
      amount: null,
      payment_date: this.calendar.getToday(),
      description: '',
      status: 'Active',
      image: null
    };

    this.imagePreview = null;
    this.activeModal = this.modalService.open(this.modalTemplate, { ariaLabelledBy: 'exampleModalLabel' });
  }

  // ------------------------
  // Submit
  // ------------------------
  onSubmit(event: Event) {
    event.preventDefault();
    this.formErrors = {};

    const formData = new FormData();

    formData.append('id', String(this.currentRecord.id || ''));
    formData.append('customer_id', String(this.currentRecord.customer_id || ''));
    formData.append('payment_method', String(this.currentRecord.payment_method || ''));
    formData.append('amount', String(this.currentRecord.amount || ''));
    formData.append('payment_date', String(this.formatDate(this.currentRecord.payment_date) || ''));
    formData.append('description', String(this.currentRecord.description || ''));
    formData.append('status', String(this.currentRecord.status || ''));

    // append image
    if (this.selectedFile) {
      formData.append('image', this.selectedFile, this.selectedFile.name);
    }

    // 👇 send deletion flag if user removed image
    if (this.isImageDeleted) {
    formData.append('isImageDeleted', '1');
  }

    this.http.post(`${this.API_URL}/customer-payments`, formData).subscribe({
      next: (res: any) => {
        this.fetchRecords();
        this.activeModal?.close();
        //this.resetForm();
      },
      error: (err) => {
        if (err.status === 422 && err.error?.errors) {
          this.formErrors = err.error.errors;
        } else {
          console.error(err);
          alert('Something went wrong.');
        }
      }
    });
  }


  // ------------------------
  // Delete
  // ------------------------
  deleteSelectedRecords(): void {
    if (!confirm('Are you sure you want to permanently delete the selected record(s)?')) return;
    const ids = this.selected.map(row => row.id).filter(Boolean);
    if (!ids.length) return;

    const calls = ids.map(id => this.http.delete(`${this.API_URL}/customer-payments/${id}`));
    forkJoin(calls).subscribe({
      next: () => {
        this.rows = this.rows.filter(r => !ids.includes(r.id));
        this.temp = this.temp.filter(r => !ids.includes(r.id));
        this.selected = [];
      },
      error: (err) => {
        console.error('Error deleting selected records:', err);
        alert('An error occurred while deleting records.');
      }
    });
  }

  deleteRecord(row: any): void {
    if (!confirm(`Are you sure you want to delete this payment?`)) return;

    this.http.delete(`${this.API_URL}/customer-payments/${row.id}`).subscribe({
      next: () => {
        this.rows = this.rows.filter(r => r.id !== row.id);
        this.temp = this.temp.filter(r => r.id !== row.id);
        this.selected = this.selected.filter(r => r.id !== row.id);
      },
      error: (error) => {
        console.error('Error deleting record:', error);
        alert('An error occurred while deleting the record.');
      }
    });
  }
}
