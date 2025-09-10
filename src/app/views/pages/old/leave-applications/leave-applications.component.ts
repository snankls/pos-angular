import { Component, ViewChild, TemplateRef, inject, OnInit } from '@angular/core';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { NgbCalendar, NgbDate, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../environments/environment';
import { BreadcrumbComponent } from '../../layout/breadcrumb/breadcrumb.component';

interface LeaveApplication {
  id: number | null;
  employee_id: string | null;
  leave_type_id: string | null;
  from_date: string | null;
  to_date: string | null;
  reason: string;
  proof: string;
  image_url?: string;
  created_by_id?: number;
  created_at?: string;
  updated_by_id?: number;
  updated_at?: string;
}

@Component({
  selector: 'app-leave-applications',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    NgxDatatableModule,
    FormsModule,
    BreadcrumbComponent,
    MyNgSelectComponent,
    NgbDatepickerModule,
  ],
  templateUrl: './leave-applications.component.html'
})
export class LeaveApplicationsComponent implements OnInit {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;

  currentRecord: LeaveApplication = {
    id: null,
    employee_id: null,
    leave_type_id: null,
    from_date: '',
    to_date: '',
    reason: '',
    proof: '',
  };

  isEditMode = false;
  errorMessage: string | null = null;
  selected: any[] = [];
  formErrors: any = {};
  isLoading: boolean = false;
  employees: any[] = [];
  leave_types: any[] = [];
  hoveredDate: NgbDate | null = null;
  calendar = inject(NgbCalendar);
  formatter = inject(NgbDateParserFormatter);
  fromDate: NgbDate | null = null;
  toDate: NgbDate | null = null;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  rows: LeaveApplication[] = [];
  temp: LeaveApplication[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  @ViewChild('table') table!: DatatableComponent;
  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  activeModal: NgbModalRef | null = null;

  constructor(private http: HttpClient, private modalService: NgbModal) {}

  ngOnInit(): void {
    this.fetchEmployees();
    this.fetchLeaveTypes();
    this.fetchLeaveApplications();
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLocaleLowerCase();
    
    // filter our data
    const temp = this.temp.filter(function(d: any) {
      return d.employee_name.toLocaleLowerCase().indexOf(val) !== -1 || !val;
    })

    // update the rows
    this.rows = temp;

    // whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }

  // Date Range
  isRange(date: NgbDate) {
    return date.equals(this.fromDate) || (this.toDate && date.equals(this.toDate)) || this.isInside(date) || this.isHovered(date);
  }

  onDateSelection(date: NgbDate): void {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
      this.clearError('from_date');
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
      this.clearError('to_date');
    } else {
      this.toDate = null;
      this.fromDate = date;
      this.clearError('from_date');
    }
  }  

  isHovered(date: NgbDate) {
    return this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate);
  }
  
  isInside(date: NgbDate) {
    return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }

  validateInput(currentValue: NgbDate | null, input: string): NgbDate | null {
    const parsed = this.formatter.parse(input);
    return parsed && this.calendar.isValid(NgbDate.from(parsed)) ? NgbDate.from(parsed) : currentValue;
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

  clearError(field: string): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  fetchEmployees(): void {
    this.http.get<any[]>(`${this.API_URL}/active/employees`).subscribe({
      next: (response) => {
        // Map each employee to add a custom label
        this.employees = response.map((employee) => ({
          ...employee,
          employee_label: `${employee.full_name} (${employee.code})`,
        }));
      },
      error: (error) => console.error('Failed to fetch employees:', error)
    });
  }

  fetchLeaveTypes(): void {
    this.http.get<any>(`${this.API_URL}/active/leave-types`).subscribe({
      next: (response) => {
        this.leave_types = response;
      },
      error: (error) => console.error('Failed to fetch leave types:', error)
    });
  }

  fetchLeaveApplications(): void {
    this.http.get<LeaveApplication[]>(`${this.API_URL}/leave-applications`).subscribe({
      next: (response) => {
        this.rows = response.map(item => ({
          ...item,
          proof: item.image_url
            ? `${this.IMAGE_URL}/uploads/leave-applications/${item.image_url}`
            : 'images/placeholder.jpg'
        }));
        this.temp = [...this.rows];
        this.loadingIndicator = false;
      },
      error: (error) => {
        console.error('Error fetching leave-applications:', error);
        this.loadingIndicator = false;
      }
    });
  }  

  // Update your editRecord method to parse dates
  editRecord(row: any): void {
    this.isEditMode = true;
    this.errorMessage = null;
    this.formErrors = {};
    
    this.currentRecord = { 
      ...row,
    };

    // Parse dates if they exist
    if (row.from_date) {
      const fromParts = row.from_date.split('-');
      this.fromDate = new NgbDate(parseInt(fromParts[0]), parseInt(fromParts[1]), parseInt(fromParts[2]));
    }
    if (row.to_date) {
      const toParts = row.to_date.split('-');
      this.toDate = new NgbDate(parseInt(toParts[0]), parseInt(toParts[1]), parseInt(toParts[2]));
    }
    
    this.activeModal = this.modalService.open(this.modalTemplate);
  }

  openModal(): void {
    this.isEditMode = false;
    this.errorMessage = null;
    this.currentRecord = {
      id: null,
      employee_id: null,
      leave_type_id: null,
      from_date: null,
      to_date: null,
      reason: '',
      proof: '',
    };
    this.activeModal = this.modalService.open(this.modalTemplate, { ariaLabelledBy: 'exampleModalLabel' });
  }

  // Add these methods to your component class
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
  
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;
  
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Update your onSubmit and updateRecord methods
  onSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
  
    const formData = new FormData();
  
    // Prepare payload with formatted dates
    const payload = {
      ...this.currentRecord,
      from_date: this.fromDate ? this.formatDateForBackend(this.fromDate) : '',
      to_date: this.toDate ? this.formatDateForBackend(this.toDate) : ''
    };
  
    // Append form fields to FormData
    for (const key in payload) {
      if (payload[key as keyof typeof payload] !== null && payload[key as keyof typeof payload] !== undefined) {
        formData.append(key, payload[key as keyof typeof payload] as any);
      }
    }
  
    // Append image if selected
    if (this.selectedFile) {
      formData.append('proof', this.selectedFile); // Use the correct field name used in Laravel
    }
  
    // Submit using FormData
    this.http.post(`${this.API_URL}/leave-applications`, formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.fetchLeaveApplications();
        this.activeModal?.close();
        this.resetForm();
      },
      error: (error) => {
        this.isLoading = false;
        this.handleError(error);
      }
    });
  }

  updateRecord(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
  
    const formData = new FormData();
  
    // Prepare payload with formatted dates
    const payload = {
      ...this.currentRecord,
      from_date: this.fromDate ? this.formatDateForBackend(this.fromDate) : '',
      to_date: this.toDate ? this.formatDateForBackend(this.toDate) : ''
    };
  
    // Append form fields to FormData
    for (const key in payload) {
      if (payload[key as keyof typeof payload] !== null && payload[key as keyof typeof payload] !== undefined) {
        formData.append(key, payload[key as keyof typeof payload] as any);
      }
    }
  
    // Append image if selected
    if (this.selectedFile) {
      formData.append('proof', this.selectedFile); // Use the correct field name used in Laravel
    }
  
    // Laravel-style update using POST with _method=PUT
    this.http.post(`${this.API_URL}/leave-applications/${this.currentRecord.id}?_method=PUT`, formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.fetchLeaveApplications();
        this.activeModal?.close();
        this.resetForm();
      },
      error: (error) => {
        this.isLoading = false;
        this.handleError(error);
      }
    });
  }  
  
  // Add this helper method to format dates
  private formatDateForBackend(date: NgbDate): string {
    return `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
  }

  private handleError(error: any): void {
    if (error.error?.errors) {
      this.formErrors = error.error.errors;
    } else {
      this.errorMessage = error.error?.message || 'An error occurred';
    }
  }

  private resetForm(): void {
    this.currentRecord = {
      id: null,
      employee_id: '',
      leave_type_id: '',
      from_date: '',
      to_date: '',
      reason: '',
      proof: '',
    };
    this.formErrors = {};
    this.errorMessage = null;
  }

  deleteSelectedRecords(): void {
    if (confirm('Are you sure you want to permanent delete the selected record(s)?')) {
      const ids = this.selected.map(row => row.id);
      const deleteRequests = ids.map(id => this.http.delete(`${this.API_URL}/leave-applications/${id}`).toPromise());

      Promise.all(deleteRequests)
        .then(() => {
          this.rows = this.rows.filter(row => !ids.includes(row.id));
          this.temp = this.temp.filter(row => !ids.includes(row.id));
          this.selected = [];
        })
        .catch((error) => {
          console.error('Error deleting selected records:', error);
          alert('An error occurred while deleting records.');
        });
    }
  }

}
