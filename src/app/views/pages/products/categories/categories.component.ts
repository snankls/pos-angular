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

interface Category {
  id: number | null;
  name: string;
  status: string | null;
  created_by_id?: number;
  created_at?: string;
  updated_by_id?: number;
  updated_at?: string;
  image?: File | string | null;
  image_url?: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    NgxDatatableModule,
    FormsModule,
    BreadcrumbComponent,
    MyNgSelectComponent
  ],
  templateUrl: './categories.component.html'
})
export class CategoriesComponent implements OnInit {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;

  currentRecord: Category = {
    id: null,
    name: '',
    status: '',
    image: '',
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

  rows: Category[] = [];
  temp: Category[] = [];
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
    this.fetchCategory();
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
        this.status = Object.entries(response)
          .filter(([key]) => key !== '')
          .map(([key, value]) => ({ id: key, name: value as string }));
      },
      error: (error) => console.error('Failed to fetch status:', error)
    });
  }

  fetchCategory(): void {
    this.http.get<Category[]>(`${this.API_URL}/categories`).subscribe({
      next: (response) => {
        console.log(response)
        this.rows = response.map(item => ({
          ...item,
          image_url: item.image_url
            ? `${this.IMAGE_URL}/uploads/categories/${item.image_url}`
            : 'images/placeholder.jpg'
        }));
        this.temp = [...this.rows];
        this.loadingIndicator = false;
      },
      error: (error) => {
        console.error('Error fetching categories:', error);
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
      image: null,
    };
    this.imagePreview = null;   // ✅ reset preview
    this.selectedFile = null;   // ✅ reset file
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

    // ✅ Only set preview if actual image exists (not placeholder)
    if (row.image_url && !row.image_url.includes('placeholder.jpg')) {
      this.imagePreview = row.image_url;
    } else {
      this.imagePreview = null;
    }

    this.activeModal = this.modalService.open(this.modalTemplate);
  }

  // Remove Image Function
  removeImage(): void {
    // Only clear preview and mark it deleted
    this.imagePreview = null;
    this.currentRecord.image = '';
    this.isImageDeleted = true;
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
      ? this.http.post(`${this.API_URL}/categories/${this.currentRecord.id}?_method=PUT`, formData)
      : this.http.post(`${this.API_URL}/categories`, formData);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.fetchCategory();
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
      image: '',
    };
    this.formErrors = {};
    this.errorMessage = null;
  }

  deletePreviewImage(): void {
    this.currentRecord.image = '';
    this.isImageDeleted = true;
  }

  deleteSelectedRecords(): void {
    if (confirm('Are you sure you want to permanent delete the selected record(s)?')) {
      const ids = this.selected.map(row => row.id);
      const deleteRequests = ids.map(id => this.http.delete(`${this.API_URL}/categories/${id}`).toPromise());

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

  deleteRecord(row: any): void {
    if (confirm(`Are you sure you want to delete "${row.name}"?`)) {
      this.http.delete(`${this.API_URL}/categories/${row.id}`).subscribe({
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

}
