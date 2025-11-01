import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { environment } from '../../../../environments/environment';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';

interface Unit {
  id: number | null;
  name: string;
  status: string | null;
  created_by_id?: number;
  created_at?: string;
  updated_by_id?: number;
  updated_at?: string;
}

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    NgxDatatableModule,
    FormsModule,
    BreadcrumbComponent,
    MyNgSelectComponent
  ],
  templateUrl: './units.component.html'
})
export class UnitsComponent implements OnInit {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;

  currentRecord: Unit = {
    id: null,
    name: '',
    status: '',
  };

  selected: any[] = [];
  formErrors: any = {};
  isLoading: any = {};
  isEditMode = false;
  errorMessage: string | null = null;
  status: { id: string; name: string }[] = [];
  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  isImageDeleted = false;

  rows: Unit[] = [];
  temp: Unit[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  @ViewChild('table') table!: DatatableComponent;
  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  activeModal: NgbModalRef | null = null;

  constructor(
    private http: HttpClient,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.fetchUnit();
    this.fetchStatus();
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();
    const temp = this.temp.filter(d => d.name.toLowerCase().includes(val));
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

  clearError(field: string): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  fetchStatus(): void {
    this.http.get<any>(`${this.API_URL}/status`).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.status = Object.entries(response.data)
            .filter(([key]) => key !== '')
            .map(([key, value]) => ({
              id: key,
              name: value as string
            }));
        } else {
          console.error('Invalid response format:', response);
        }
      },
      error: (error) => console.error('Failed to fetch record:', error)
    });
  }

  fetchUnit(): void {
    this.http.get<Unit[]>(`${this.API_URL}/units`).subscribe({
      next: (response) => {
        this.rows = response.map(item => ({
          ...item,
        }));
        this.temp = [...this.rows];
        this.loadingIndicator = false;
      },
      error: (error) => {
        console.error('Error fetching units:', error);
        this.loadingIndicator = false;
      }
    });
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

  openModal(): void {
    this.isEditMode = false;
    this.errorMessage = null;
    this.currentRecord = {
      id: null,
      name: '',
      status: 'Active',
    };
    this.imagePreview = null;   // reset preview
    this.selectedFile = null;   // reset file
    this.isImageDeleted = false;
    this.activeModal = this.modalService.open(this.modalTemplate, { ariaLabelledBy: 'exampleModalLabel' });
  }

  editRecord(row: any): void {
    this.isEditMode = true;
    this.errorMessage = null;
    this.formErrors = {};
    
    // Ensure status is converted to string
    this.currentRecord = { 
      ...row,
      status: String(row.status)
    };

    // Only set preview if actual image exists (not placeholder)
    if (row.image_url && !row.image_url.includes('placeholder.jpg')) {
      this.imagePreview = row.image_url;
    } else {
      this.imagePreview = null;
    }

    this.activeModal = this.modalService.open(this.modalTemplate);
  }

  deleteRecord(row: any): void {
    if (confirm(`Are you sure you want to delete "${row.name}"?`)) {
      this.http.delete(`${this.API_URL}/units/${row.id}`).subscribe({
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

  onSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;

    const formData = new FormData();

    formData.append('name', this.currentRecord.name ?? '');
    formData.append('status', this.currentRecord.status ?? '');

    if (this.selectedFile) {
      formData.append('image', this.selectedFile, this.selectedFile.name);
    }

    // 👇 send deletion flag if user removed image
    if (this.isImageDeleted) {
      formData.append('delete_image', '1');
    }

    const request$ = this.isEditMode
      ? this.http.post(`${this.API_URL}/units/${this.currentRecord.id}?_method=PUT`, formData)
      : this.http.post(`${this.API_URL}/units`, formData);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.fetchUnit();
        this.activeModal?.close();
        this.resetForm();
      },
      error: (error) => {
        this.isLoading = false;
        this.handleError(error);
      }
    });
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
      name: '',
      status: '',
    };
    this.formErrors = {};
    this.errorMessage = null;
  }

  deleteSelectedRecords(): void {
    if (confirm('Are you sure you want to permanent delete the selected record(s)?')) {
      const ids = this.selected.map(row => row.id);
      const deleteRequests = ids.map(id => this.http.delete(`${this.API_URL}/units/${id}`).toPromise());

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
