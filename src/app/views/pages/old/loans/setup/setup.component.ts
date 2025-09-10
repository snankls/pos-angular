import { Component } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ColumnMode, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { environment } from '../../../../environments/environment';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';

interface Employee {
  id?: number | null;
  employee_id?: string | null;
  issue_date?: string | NgbDateStruct | null;
  loan_amount?: string | null;
  status?: string | null;
  description?: string | null;
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
    SweetAlert2Module
  ],
  templateUrl: './setup.component.html'
})
export class LoansSetupComponent {
  private API_URL = environment.API_URL;

  currentRecord: any = {
    employee_id: null,
    issue_date: '',
    loan_amount: '',
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
  isAmountValid: boolean = false;
  employees: any[] = [];
  status: { id: string; name: string }[] = [];
  return_status: { id: string; name: string }[] = [];
  itemsList: any[] = [{
    id: null,
    return_date: null,
    return_amount: '0',
    return_status: 'Unpaid'
  }];

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
    this.fetchStatus();
    this.setDefaultIssueDate();

    this.return_status = [
      { id: 'Unpaid', name: 'Unpaid' },
      { id: 'Paid', name: 'Paid' },
    ];

    this.itemsList = [{
      id: null,
      return_date: null,
      return_amount: '',
      return_status: 'Unpaid'
    }];

    // Handle id-based route
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadLoans(+id);
      }
    });
  }

  clearError(field: string, index?: number) {
    if (index !== undefined) {
      if (this.formErrors[field] && Array.isArray(this.formErrors[field])) {
        this.formErrors[field][index] = null;
      }
    } else {
      this.formErrors[field] = null;
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

  fetchStatus(): void {
    this.http.get<any>(`${this.API_URL}/status`).subscribe({
      next: (response) => {
        this.status = Object.entries(response)
          .filter(([key]) => key !== '')
          .map(([key, value]) => ({ id: String(key), name: value as string }));
      },
      error: (error) => console.error('Failed to fetch status:', error)
    });
  }

  addItemRow() {
    // Create a new empty item
    const newItem = {
      id: null,
      return_date: null,
      return_amount: '',
      return_status: 'Unpaid'
    };
    
    // Add to itemsList without modifying existing data
    this.itemsList = [...this.itemsList, newItem];
  }

  // Update toggleSelection method
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

  deleteSelectedRows() {
    if (confirm('Are you sure you want to permanent delete the selected record(s)?')) {
      // Correctly get IDs from itemsList using selected row indexes
      const idsToDelete = this.selectedRows
        .map(index => this.itemsList[index].id)
        .filter(id => id !== null); // filter out unsaved rows (id is null)
  
      const deleteRequests = idsToDelete.map(id =>
        this.http.delete(`${this.API_URL}/loan-details/${id}`).toPromise()
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

  parseDate(dateString: string): NgbDateStruct {
    const [year, month, day] = dateString.split('-').map(Number);
    return { year, month, day };
  }  

  clearItemError(index: number, key: 'return_date' | 'return_amount' | 'return_status') {
    const errorKey = `items.${index}.${key}`;
    if (this.formErrors[errorKey]) {
      delete this.formErrors[errorKey];
    }
  }

  // formatDate(date: NgbDateStruct | string | null | undefined): string {
  //   if (!date) return '';
  //   if (typeof date === 'string') return date;
  //   return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  // }

  // getTotalReturnAmount(): number {
  //   return this.itemsList.reduce((sum, item) => {
  //     return sum + parseFloat(item.return_amount || '0');
  //   }, 0);
  // }
  
  // onReturnAmountChange(index: number): void {
  //   const totalReturn = this.getTotalReturnAmount();
  //   const loanAmount = parseFloat(this.currentRecord?.loan_amount ?? '0') || 0;
  
  //   if (totalReturn > loanAmount) {
  //     alert("Total return amount cannot exceed loan amount.");
  //     this.itemsList[index].return_amount = '';
  //   }
  // }

  loadLoans(id: number) {
    this.http.get<any>(`${this.API_URL}/loans/${id}`).subscribe({
      next: (response) => {
        this.currentRecord = response;
        
        // Convert issue_date string to NgbDateStruct
        if (typeof this.currentRecord.issue_date === 'string') {
          this.currentRecord.issue_date = this.parseDate(this.currentRecord.issue_date);
        }
        
        // Assign items list with IDs
        this.itemsList = (response.details || []).map((item: any) => ({
          id: item.id, // Make sure this is included
          return_date: typeof item.return_date === 'string' 
            ? this.parseDate(item.return_date) 
            : item.return_date,
          return_amount: item.return_amount || '',
          return_status: item.return_status || 'Unpaid'
        }));
        
        this.checkAmounts();
        this.isEditMode = true;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        
        if (error.status === 403) {
          this.router.navigate(['/dashboard']);
        } else if (error.status === 404) {
          this.errorMessage = 'Loan record not found';
        } else {
          this.errorMessage = 'Failed to load loan details';
          console.error('Error loading loan:', error);
        }
      },
    });
  }

  // Calculate total return amount
  getTotalReturnAmount(): number {
    return this.itemsList.reduce((sum, item) => {
      return sum + (parseFloat(item.return_amount) || 0);
    }, 0);
  }

  // Validate amounts whenever they change
  checkAmounts(): void {
    const loanAmount = parseFloat(this.currentRecord.loan_amount) || 0;
    const totalReturn = this.getTotalReturnAmount();
    this.isAmountValid = Math.abs(totalReturn - loanAmount) < 0.01; // Allow minor floating-point difference
  }

  // Handle return amount changes
  onReturnAmountChange(index: number): void {
    // Ensure the value is a valid number
    if (this.itemsList[index].return_amount) {
      this.itemsList[index].return_amount = parseFloat(this.itemsList[index].return_amount) || 0;
    }
    this.checkAmounts();
  }

  // Format date for API
  formatDate(date: any): string {
    if (!date) return '';
    if (typeof date === 'string') return date;
    return `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
  }

  // Submit form
  onSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
    
    // Final validation check
    this.checkAmounts();
    
    if (!this.isAmountValid) {
      this.globalErrorMessage = 'Total return amount must exactly match the loan amount.';
      this.isLoading = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const formData = {
      employee_id: this.currentRecord.employee_id,
      loan_amount: this.currentRecord.loan_amount,
      issue_date: this.formatDate(this.currentRecord.issue_date),
      status: this.currentRecord.status,
      description: this.currentRecord.description || '',
      items: this.itemsList.map(item => ({
        return_date: this.formatDate(item.return_date),
        return_amount: item.return_amount,
        return_status: item.return_status
      }))
    };

    this.http.post(`${this.API_URL}/loans`, formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/loans']);
      },
      error: (error) => {
        this.isLoading = false;
        this.formErrors = error.error.errors || {};
        this.globalErrorMessage = 'Please fill all required fields correctly.';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
  
  // onSubmit(event: Event): void {
  //   event.preventDefault();
  //   this.isLoading = true;
  
  //   const formData = {
  //     employee_id: this.currentRecord.employee_id,
  //     loan_amount: this.currentRecord.loan_amount,
  //     issue_date: this.formatDate(this.currentRecord.issue_date),
  //     status: this.currentRecord.status,
  //     description: this.currentRecord.description || '',
  //     items: this.itemsList.map(item => ({
  //       return_date: this.formatDate(item.return_date),
  //       return_amount: item.return_amount,
  //       return_status: item.return_status
  //     }))
  //   };


  //   const loanAmount = parseFloat(formData.loan_amount || '0');
  //   const totalReturn = this.getTotalReturnAmount();
  //   const isEqual = Math.abs(totalReturn - loanAmount) < 0.01;

  //   if (!isEqual) {
  //     alert('Total return amount must be equal to the loan amount.');
  //     this.isLoading = false;
  //     return;
  //   }


  //   // const loanAmount = parseFloat(formData.loan_amount || '0');
  //   // const totalReturn = this.getTotalReturnAmount();
  //   // alert(totalReturn);
    
  //   // if (totalReturn !== loanAmount) {
  //   //   alert('Total return amount must be equal to the loan amount.');
  //   //   this.isLoading = false;
  //   //   return;
  //   // }
  
  //   this.http.post(`${this.API_URL}/loans`, formData).subscribe({
  //     next: () => {
  //       this.isLoading = false;
  //       this.router.navigate(['/loans']);
  //     },
  //     error: (error) => {
  //       this.isLoading = false;
  //       this.formErrors = error.error.errors || {};
  //       this.globalErrorMessage = 'Please fill all required fields correctly.';
  //       window.scrollTo({ top: 0, behavior: 'smooth' });
  //     }
  //   });
  // }
  
  updateRecord(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
    this.globalError = '';
  
    const formData = {
      _method: 'PUT',
      id: this.currentRecord.id,
      employee_id: this.currentRecord.employee_id,
      loan_amount: this.currentRecord.loan_amount,
      issue_date: this.formatDate(this.currentRecord.issue_date),
      status: this.currentRecord.status,
      description: this.currentRecord.description || '',
      items: this.itemsList.map(item => ({
        id: item.id, // Include the detail ID
        return_date: this.formatDate(item.return_date),
        return_amount: item.return_amount,
        return_status: item.return_status
      }))
    };
  
    this.http.post(`${this.API_URL}/loans/${this.currentRecord.id}`, formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/loans']);
      },
      error: (error) => {
        this.isLoading = false;
        this.formErrors = error.error.errors || {};
        this.globalErrorMessage = 'Please fix the highlighted errors.';
        console.error('Update error:', error);
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
