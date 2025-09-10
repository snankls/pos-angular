import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgLabelTemplateDirective, NgOptionTemplateDirective, NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { environment } from '../../../../environments/environment';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';

interface Department {
  id: number | null;
  code: string;
  name: string;
  description: string;
  status: string | null;
  created_by_id?: number;
  created_by?: string;
  created_at?: string;
  updated_by_id?: number;
  updated_at?: string;
}

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    NgxDatatableModule,
    FormsModule,
    BreadcrumbComponent,
    MyNgSelectComponent
  ],
  templateUrl: './departments.component.html'
})
export class DepartmentsComponent implements OnInit {
  private API_URL = environment.API_URL;

  currentRecord: Department = {
    id: null,
    code: '',
    name: '',
    description: '',
    status: ''
  };

  selected: any[] = [];
  formErrors: any = {};
  isLoading: any = {};
  isEditMode = false;
  errorMessage: string | null = null;
  status: { id: string; name: string }[] = [];

  rows: Department[] = [];
  temp: Department[] = [];
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
    this.fetchCities();
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

  fetchCities(): void {
    this.http.get<Department[]>(`${this.API_URL}/departments`).subscribe({
      next: (response) => {
        this.rows = response;
        this.temp = [...response];
        this.loadingIndicator = false;
      },
      error: (error) => {
        console.error('Error fetching departments:', error);
        this.loadingIndicator = false;
      }
    });
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
    
    this.activeModal = this.modalService.open(this.modalTemplate);
  }

  openModal(): void {
    this.isEditMode = false;
    this.errorMessage = null;
    this.currentRecord = {
      id: null,
      code: '',
      name: '',
      description: '',
      status: null
    };
    this.activeModal = this.modalService.open(this.modalTemplate, { ariaLabelledBy: 'exampleModalLabel' });
  }

  // Update your onSubmit and updateRecord methods
  onSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
    
    this.http.post(`${this.API_URL}/departments`, this.currentRecord).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.fetchCities();
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
    
    this.http.put(`${this.API_URL}/departments/${this.currentRecord.id}`, this.currentRecord).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.fetchCities();
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
      code: '',
      name: '',
      description: '',
      status: ''
    };
    this.formErrors = {};
    this.errorMessage = null;
  }

  deleteSelectedRecords(): void {
    if (confirm('Are you sure you want to permanent delete the selected record(s)?')) {
      const ids = this.selected.map(row => row.id);
      const deleteRequests = ids.map(id => this.http.delete(`${this.API_URL}/departments/${id}`).toPromise());

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
