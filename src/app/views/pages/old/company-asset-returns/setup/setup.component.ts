import { ChangeDetectorRef, Component } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ColumnMode, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

interface Employee {
  id?: number | null;
  employee_id: number | null;
  return_date: string | NgbDateStruct;
  status: string | null;
  description?: string;
  slug?: string;
}

interface AssetDetail {
  detail_id: number;
  asset_type_id: number;
  description: string;
  reason: string;
}

// interface CompanyAssetReturnResponse {
//   id?: number;
//   employee_id: string | null;
//   return_date: string | NgbDateStruct;
//   status: string | null;
//   description: string;
//   details: AssetDetail[];
// }

interface CompanyAssetReturnDetail {
  id?: number;
  detail_id?: number;
  asset_type_id: number;
  description: string;
  reason: string;
}

interface CompanyAssetReturnResponse {
  id: number;
  employee_id: number;
  return_date: string | NgbDateStruct;
  status: string;
  description?: string;
  details: CompanyAssetReturnDetail[];
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

  currentRecord: Employee = {
    employee_id: null,
    return_date: '',
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
  
  itemsList: any[] = [];

  // itemsList: {
  //   id: number | null;
  //   detail_id: number | null;
  //   asset_type_id: number | null;
  //   composite_id: string | null;
  //   description: string;
  //   reason: string;
  // }[] = [
  //   { 
  //     id: null,
  //     detail_id: null,
  //     asset_type_id: null,
  //     composite_id: null,
  //     description: '',
  //     reason: '',
  //   }
  // ];

  rows = [];
  temp = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchEmployees();
    //this.fetchAssetTypes();
    this.fetchStatus();
    this.setDefaultReturnDate();

    // Handle id-based route
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadCompanyAssetReturns(+id);
        //this.fetchAssetTypes(+id);
      }
    });
  }

  clearError(field: string): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  clearItemError(index: number, key: 'asset_type_id' | 'description' | 'reason') {
    const errorKey = `items.${index}.${key}`;
    if (this.formErrors[errorKey]) {
      delete this.formErrors[errorKey];
    }
  }

  setDefaultReturnDate(): void {
    const today = new Date();
    this.currentRecord.return_date = {
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

  onEmployeeChange(): void {
    const selectedEmployeeId = Number(this.currentRecord.employee_id);
    if (!selectedEmployeeId) {
      this.asset_types = [];
      return;
    }

    this.fetchAssetTypes(selectedEmployeeId);
  }

  async fetchAssetTypes(employeeId: number): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<any[]>(`${this.API_URL}/asset-types/${employeeId}`)
      );
        
      this.asset_types = response.map(asset => ({
        ...asset,
        composite_id: `${asset.asset_type_id}_${asset.detail_id}`,
        name: asset.name || asset.asset_type?.name,
        description: asset.description || asset.asset_type?.description
      }));
    } catch (error) {
      console.error('Failed to fetch asset types:', error);
      this.asset_types = [];
    }
  }

  compareWithFn(a: any, b: any): boolean {
      if (!a || !b) return false;
      
      // Handle cases where either could be the object or just the ID string
      const aId = typeof a === 'object' ? a.composite_id : a;
      const bId = typeof b === 'object' ? b.composite_id : b;
      
      return aId === bId;
  }

  // fetchAssetTypes(employeeId: number): void {
  //   this.asset_types = [];

  //   this.http.get<any[]>(`${this.API_URL}/asset-types/${employeeId}`).subscribe({
  //     next: (response) => {
  //       this.asset_types = response.map((asset_type) => ({
  //         ...asset_type,
  //         // Create a composite value that includes both IDs
  //         composite_id: `${asset_type.asset_type_id}_${asset_type.detail_id}`
  //       }));
  //     },
  //     error: (error) => {
  //       console.error('Failed to fetch asset types:', error);
  //       this.asset_types = [];
  //     }
  //   });
  // }

  onAssetTypeChange(item: any, index: number): void {
    const selectedCompositeId = item.composite_id;
    const selectedAsset = this.asset_types.find(a => a.composite_id === selectedCompositeId);
    
    if (!selectedAsset) return;

    // Check if any other item has the same composite_id
    const isDuplicate = this.itemsList.some((i, idx) => {
      return i.composite_id === selectedCompositeId && idx !== index;
    });

    if (isDuplicate) {
      alert('This specific asset has already been selected.');

      // Reset the current row
      this.itemsList[index] = {
        ...this.itemsList[index],
        composite_id: null,
        asset_type_id: null,
        detail_id: null,
        description: ''
      };
      return;
    }

    // Update all relevant fields
    item.id = selectedAsset.asset_type_id;
    item.asset_type_id = selectedAsset.asset_type_id;
    item.detail_id = selectedAsset.detail_id;
    item.description = selectedAsset.description || '';
  }

  isAssetTypeUsed(compositeId: string, currentIndex: number): boolean {
    if (!compositeId) return false;
    
    return this.itemsList.some((item, index) => {
      // Only check against items that have actually been selected (have a composite_id)
      return index !== currentIndex && 
        item.composite_id && 
        item.composite_id === compositeId;
    });
  }

  trackByAssetType(index: number, item: any): number | undefined {
    return item?.asset_type_id;
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
    this.itemsList.push(
      {
        id: null,
        detail_id: null,
        asset_type_id: null,
        composite_id: null,
        description: '',
        reason: '',
      }
    );
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

  formatDate(date: NgbDateStruct | string | undefined): string {
    if (typeof date === 'string') return date;
    if (!date) return '';
    return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  }

  async loadCompanyAssetReturns(id: number): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await firstValueFrom(
        this.http.get<CompanyAssetReturnResponse>(
          `${this.API_URL}/company-asset-returns/${id}`
        )
      );

      this.currentRecord = {
        ...response,
        return_date: typeof response.return_date === 'string' 
          ? this.parseDate(response.return_date)
          : response.return_date
      };

      // Create itemsList with proper composite_id
      this.itemsList = response.details.map((detail: CompanyAssetReturnDetail) => {
        const detailId = detail.detail_id ?? detail.id;
        if (!detailId) {
          console.warn('Missing detail ID in response', detail);
          throw new Error('Invalid detail data: missing ID');
        }

        return {
          id: detail.asset_type_id,
          detail_id: detailId,
          asset_type_id: detail.asset_type_id,
          composite_id: `${detail.asset_type_id}_${detailId}`,
          description: detail.description,
          reason: detail.reason,
          isSelected: true
        };
      });

      // Fetch asset types if employee exists
      if (this.currentRecord.employee_id) {
        await this.fetchAssetTypes(Number(this.currentRecord.employee_id));
        this.updateSelections();
      }

      this.isEditMode = true;
    } catch (error: unknown) {
      this.isLoading = false;
      
      if (error instanceof HttpErrorResponse) {
        if (error.status === 403) {
          this.router.navigate(['/dashboard']);
        } else if (error.status === 404) {
          this.errorMessage = 'Asset return record not found';
        } else {
          this.errorMessage = 'Failed to load asset return details';
          console.error('API Error:', error);
        }
      } else {
        this.errorMessage = 'An unexpected error occurred';
        console.error('Unexpected Error:', error);
      }
    } finally {
      this.isLoading = false;
    }
  }

  private updateSelections(): void {
    this.selectedRows = this.itemsList
      .map((item, index) => item.isSelected ? index : -1)
      .filter(index => index !== -1);
  }
  // async loadCompanyAssetReturns(id: number) {
  //   try {
  //       const response = await firstValueFrom(
  //         this.http.get<CompanyAssetReturnResponse>(`${this.API_URL}/company-asset-returns/${id}`)
  //       );

  //       this.currentRecord = response;
        
  //       if (typeof this.currentRecord.return_date === 'string') {
  //         this.currentRecord.return_date = this.parseDate(this.currentRecord.return_date);
  //       }

  //       // PROPERLY create itemsList with correct composite_id
  //       this.itemsList = response.details.map((detail: any) => {
  //         // Extract detail_id from either detail.id or detail.detail_id
  //         const detailId = detail.detail_id || detail.id;
  //         return {
  //           id: detail.asset_type_id,
  //           detail_id: detailId,
  //           asset_type_id: detail.asset_type_id,
  //           composite_id: `${detail.asset_type_id}_${detailId}`,
  //           description: detail.description,
  //           reason: detail.reason
  //         };
  //       });

  //       // Then fetch asset types
  //       if (this.currentRecord.employee_id) {
  //         await this.fetchAssetTypes(Number(this.currentRecord.employee_id));
          
  //         // Force update of selections
  //         this.forceSelectionUpdate();
  //       }
        
  //       this.isEditMode = true;
  //   } catch (error) {
  //       console.error('Error loading asset returns:', error);
  //   }
  // }

  forceSelectionUpdate() {
    // Create a new array reference to trigger change detection
    this.itemsList = this.itemsList.map(item => {
        const matchingAsset = this.asset_types.find(a => 
            a.asset_type_id === item.asset_type_id &&
            a.description === item.description
        );
        
        return {
            ...item,
            composite_id: matchingAsset?.composite_id || item.composite_id,
            detail_id: matchingAsset?.detail_id || item.detail_id
        };
    });
    
    // Force Angular to detect changes
    this.cdr.detectChanges();
    
    // Debug output
    console.log('Matching check:', 
        this.itemsList.map(item => ({
            item: item.composite_id,
            match: this.asset_types.some(a => a.composite_id === item.composite_id)
        }))
    );
  }

  // Add this new method
  synchronizeSelections() {
    this.itemsList.forEach(item => {
      // Find matching asset in asset_types
      const matchingAsset = this.asset_types.find(a => 
          a.asset_type_id === item.asset_type_id && 
          a.detail_id === item.detail_id
      );

      console.log('Matching check:', 
          this.itemsList.map(item => ({
              item: item.composite_id,
              match: this.asset_types.some(a => this.compareWithFn(a, item))
          }))
      );
      
      if (matchingAsset) {
          // Update the composite_id to exactly match the one in asset_types
          item.composite_id = matchingAsset.composite_id;
      }
    });
    
    // Force change detection
    this.cdr.detectChanges();
  }

  // loadCompanyAssetReturns(id: number) {
  //   this.http.get<CompanyAssetReturnResponse>(`${this.API_URL}/company-asset-returns/${id}`).subscribe(response => {
  //     this.currentRecord = response;
    
  //     if (typeof this.currentRecord.return_date === 'string') {
  //       this.currentRecord.return_date = this.parseDate(this.currentRecord.return_date);
  //     }
    
  //     this.itemsList = response.details.map((detail: AssetDetail) => ({
  //       id: detail.asset_type_id,
  //       detail_id: detail.detail_id,
  //       asset_type_id: detail.asset_type_id,
  //       composite_id: `${detail.asset_type_id}_${detail.detail_id}`,
  //       description: detail.description,
  //       reason: detail.reason
  //     }));
      
  //     this.isEditMode = true;
  //   });
  // }
  
  // Add your onSubmit method
  onSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
  
    const formData = new FormData();
    formData.append('employee_id', String(this.currentRecord.employee_id));
    formData.append('return_date', this.formatDate(this.currentRecord.return_date));
    formData.append('status', String(this.currentRecord.status || ''));
    formData.append('description', this.currentRecord.description || '');
  
    let validIndex = 0;
    this.itemsList.forEach((item) => {
      if (item.asset_type_id) {
        formData.append(`items[${validIndex}][asset_type_id]`, String(item.asset_type_id));
        formData.append(`items[${validIndex}][description]`, item.description || '');
        formData.append(`items[${validIndex}][reason]`, item.reason || '');
        validIndex++;
      }
    });
  
    this.http.post(`${this.API_URL}/company-asset-returns`, formData).subscribe({
      next: () => {
        this.isLoading = false;
        // Optionally navigate
        this.router.navigate(['/company-asset-returns']);
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
    formData.append('_method', 'PUT');
    formData.append('id', String(this.currentRecord.id));
    formData.append('employee_id', String(this.currentRecord.employee_id));
    formData.append('return_date', this.formatDate(this.currentRecord.return_date));
    formData.append('status', String(this.currentRecord.status || ''));
    formData.append('description', this.currentRecord.description || '');
  
    let validIndex = 0;
    this.itemsList.forEach((item) => {
      if (item.asset_type_id && item.description) {
        formData.append(`items[${validIndex}][asset_type_id]`, String(item.asset_type_id));
        formData.append(`items[${validIndex}][description]`, item.description);
        formData.append(`items[${validIndex}][reason]`, item.reason);
        validIndex++;
      }
    });
  
    this.http.post(`${this.API_URL}/company-asset-returns/${String(this.currentRecord.id)}`, formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/company-asset-returns']);
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

  deleteSelectedRows() {
    if (confirm('Are you sure you want to permanent delete the selected record(s)?')) {
      // Correctly get IDs from itemsList using selected row indexes
      const idsToDelete = this.selectedRows
        .map(index => this.itemsList[index].id)
        .filter(id => id !== null); // filter out unsaved rows (id is null)
  
      const deleteRequests = idsToDelete.map(id =>
        this.http.delete(`${this.API_URL}/company-asset-return-details/${id}`).toPromise()
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

}
