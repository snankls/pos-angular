import { Component } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ColumnMode, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';

interface CompanyAsset {
  id?: number | null;
  employee_id: string | null;
  issue_date: string | NgbDateStruct;
  status: string | null;
  description?: string;
  slug?: string;
}

interface CompanyAssetDetail {
  id: number;
  asset_type_id: number;
  description: string;
  status: string;
}

interface CompanyAssetResponse {
  id: number;
  employee_id: string | null;
  issue_date: string | NgbDateStruct;
  status: string | null;
  description?: string;
  slug?: string;
  details: CompanyAssetDetail[];  // Changed from 'detail' to 'details' to match your API
}

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    RouterLink,
    NgxDatatableModule,
    CommonModule,
    FormsModule,
    NgbDatepickerModule,
    MyNgSelectComponent,
  ],
  templateUrl: './setup.component.html'
})
export class CompanyAssetsSetupComponent {
  private API_URL = environment.API_URL;

  currentRecord: CompanyAsset = {
    employee_id: null,
    issue_date: '',
    status: null,
    description: '',
  };
  
  selected: number[] = [];
  selectedRows: number[] = [];
  globalError: string = '';
  globalErrorMessage: string = '';
  isEditMode = false;
  isLoading = false;
  errorMessage: any;
  formErrors: any = {};
  employees: any[] = [];
  asset_types: any[] = [];
  status: { id: string; name: string }[] = [];
  availableItems: { id: number; name: string }[] = [];
  itemsList: { id: number | null; asset_type_id: number | null; description: string }[] = [
    { id: null, asset_type_id: null, description: '' }
  ];

  rows = [];
  temp = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchEmployees();
    this.fetchAssetTypes();
    this.fetchStatus();
    this.setDefaultIssueDate();

    // Handle id-based route
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadCompanyAssets(+id);
      }
    });
  }

  clearError(field: string): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  setDefaultIssueDate(): void {
    const today = new Date();
    this.currentRecord.issue_date = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
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

  fetchAssetTypes(): void {
    this.http.get<any[]>(`${this.API_URL}/active/asset-types`).subscribe({
      next: (response) => {
        // Map each asset type to add a custom label
        this.asset_types = response.map((asset_type) => ({
          ...asset_type
        }));
      },
      error: (error) => console.error('Failed to fetch employees:', error)
    });
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

  addItemRow() {
    this.itemsList.push({ id: null, asset_type_id: null, description: '' });
  }

  deleteSelectedRows() {
    if (confirm('Are you sure you want to permanent delete the selected record(s)?')) {
      // Correctly get IDs from itemsList using selected row indexes
      const idsToDelete = this.selectedRows
        .map(index => this.itemsList[index].id)
        .filter(id => id !== null); // filter out unsaved rows (id is null)
  
      const deleteRequests = idsToDelete.map(id =>
        this.http.delete(`${this.API_URL}/company-asset-details/${id}`).toPromise()
      );
  
      Promise.all(deleteRequests)
        .then(() => {
          // Remove deleted items from itemsList
          this.itemsList = this.itemsList.filter((_, index) => !this.selectedRows.includes(index));
          this.selectedRows = [];
        })
        .catch((error) => {
          console.error('Error deleting selected records:', error);
          alert('An error occurred while deleting records.');
        });
    }
  }

  toggleSelection(index: number) {
    const idx = this.selectedRows.indexOf(index);
    if (idx > -1) {
      this.selectedRows.splice(idx, 1);
    } else {
      this.selectedRows.push(index);
    }
  }

  isSelected(index: number): boolean {
    return this.selectedRows.includes(index);
  }

  selectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedRows = this.itemsList.map((_, index) => index);
    } else {
      this.selectedRows = [];
    }
  }

  parseDate(dateString: string): NgbDateStruct {
    const [year, month, day] = dateString.split('-').map(Number);
    return { year, month, day };
  }

  clearItemError(index: number, key: 'asset_type_id' | 'description') {
    const errorKey = `items.${index}.${key}`;
    if (this.formErrors[errorKey]) {
      delete this.formErrors[errorKey];
    }
  }

  formatDate(date: NgbDateStruct | string | undefined): string {
    if (typeof date === 'string') return date;
    if (!date) return '';
    return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  }

  loadCompanyAssets(id: number) {
    this.isLoading = true;
    this.errorMessage = '';
    this.itemsList = [];

    this.http.get<CompanyAssetResponse>(`${this.API_URL}/company-assets/${id}`).subscribe({
      next: (response) => {
        this.currentRecord = {
          ...response,
          issue_date: typeof response.issue_date === 'string' 
            ? this.parseDate(response.issue_date) 
            : response.issue_date
        };

        // Initialize itemsList with proper typing
        this.itemsList = (response.details || []).map(detail => ({
          ...detail,
          isSelected: true
        }));

        this.isEditMode = true;
        this.isLoading = false;
        
        // Fetch asset types if employee_id exists
        // if (this.currentRecord.employee_id) {
        //   this.fetchAssetTypes(Number(this.currentRecord.employee_id));
        // }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        
        if (error.status === 403 && error.error?.redirect) {
          this.router.navigate(['/dashboard']);
        } else if (error.status === 404) {
          this.errorMessage = 'Company asset not found';
        } else {
          this.errorMessage = 'Failed to load company asset details';
          console.error('Error loading company asset:', error);
        }
      }
    });
  }

  // loadCompanyAssets(id: number) {
  //   this.http.get<any>(`${this.API_URL}/company-assets/${id}`).subscribe(response => {
  //     this.currentRecord = response;
  
  //     // ✅ Convert issue_date string to NgbDateStruct
  //     if (typeof this.currentRecord.issue_date === 'string') {
  //       this.currentRecord.issue_date = this.parseDate(this.currentRecord.issue_date);
  //     }
  
  //     // ✅ Assign items list
  //     this.itemsList = response.details || [];
  //     this.isEditMode = true;
  //   });
  // }
  
  // Add your onSubmit method
  onSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
  
    const formData = new FormData();
    formData.append('employee_id', String(this.currentRecord.employee_id));
    formData.append('issue_date', this.formatDate(this.currentRecord.issue_date));
    formData.append('status', String(this.currentRecord.status || ''));
    formData.append('description', this.currentRecord.description || '');
  
    let validIndex = 0;
    this.itemsList.forEach((item) => {
      if (item.asset_type_id) {
        formData.append(`items[${validIndex}][asset_type_id]`, String(item.asset_type_id));
        formData.append(`items[${validIndex}][description]`, item.description || '');
        validIndex++;
      }
    });
  
    this.http.post(`${this.API_URL}/company-assets`, formData).subscribe({
      next: () => {
        this.isLoading = false;
        // Optionally navigate
        this.router.navigate(['/company-assets']);
      },
      error: (error) => {
        this.isLoading = false;
        this.formErrors = error.error.errors || {};
        this.globalErrorMessage = 'Please fill all required fields correctly.';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
  
  updateRecord(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
    this.globalError = '';
  
    const formData = new FormData();
    formData.append('_method', 'PUT'); // simulate PUT for Laravel
    formData.append('id', String(this.currentRecord.id));
    formData.append('employee_id', String(this.currentRecord.employee_id));
    formData.append('issue_date', this.formatDate(this.currentRecord.issue_date));
    formData.append('status', String(this.currentRecord.status || ''));
    formData.append('description', this.currentRecord.description || '');
  
    let validIndex = 0;
    this.itemsList.forEach((item) => {
      if (item.asset_type_id && item.description) {
        formData.append(`items[${validIndex}][asset_type_id]`, String(item.asset_type_id));
        formData.append(`items[${validIndex}][description]`, item.description);
        validIndex++;
      }
    });
  
    this.http.post(`${this.API_URL}/company-assets/${String(this.currentRecord.id)}`, formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/company-assets']);
      },
      error: (error) => {
        this.isLoading = false;
        this.formErrors = error.error.errors || {};
        this.globalErrorMessage = 'Please fix the highlighted errors.';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Add this error handling method
  private handleError(error: any): void {
    if (error.error?.errors) {
      // Format errors to match what the template expects
      this.formErrors = error.error.errors;
    } else if (error.error?.message) {
      this.errorMessage = error.error.message;
    } else {
      this.errorMessage = 'An unknown error occurred';
    }
    
    // Scroll to the first error
    setTimeout(() => {
      const firstErrorElement = document.querySelector('.text-danger');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  // Convert to yyyy-mm-dd string for backend
  private formatDateForBackend(date: NgbDateStruct | string | undefined): string | null {
    if (!date) return null;
    
    // If already a string, return it directly
    if (typeof date === 'string') return date;
    
    // If NgbDateStruct, format it
    return `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
  }

}
