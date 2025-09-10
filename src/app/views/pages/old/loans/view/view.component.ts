import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDropdownModule, NgbNavContent, NgbNavModule, NgbTooltip, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';

// interface Employee {
//   id?: number | null;
//   full_name: string | null;
//   loan_amount: string;
//   issue_date: string;
//   status: number | null;
//   description?: string;
//   slug?: string;
//   employee?: {
//     full_name: string;
//   };
// }

interface LoanDetail {
  id: number;
  return_date: string;
  return_amount: string;
  return_status: string;
  // Optional properties from the response if needed
  loan_id?: number;
  item_id?: number;
  description?: string;
  status?: string;
}

interface LoanResponse {
  id: number;
  employee_id: number;
  loan_date: string;
  return_date?: string;
  status: string;
  description?: string;
  details: LoanDetail[];
}

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    NgbNavModule,
    NgbNavContent,
    NgbNavOutlet,
    NgbDropdownModule,
    NgbTooltip
  ],
  templateUrl: './view.component.html'
})
export class LoansViewComponent {
  private API_URL = environment.API_URL;

  currentRecord: any = {
    full_name: null,
    loan_amount: '',
    issue_date: '',
    status: null,
    description: '',
    employee: {
      full_name: '',
    }
  };

  itemsList: {
    id: number;
    return_date: string;
    return_amount: string;
    return_status: string;
  }[] = [];
  
  isLoading = false;
  errorMessage = '';

  rows: any[] = [];
  loadingIndicator = false;
  company_asset_status: string = '';
  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Handle id-based route
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadLoan(+id);
      }
    });
  }

  loadLoan(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.itemsList = [];

    this.http.get<LoanResponse>(`${this.API_URL}/loans/${id}`).subscribe({
      next: (response) => {
        this.currentRecord = {
          ...response,
          // loan_date: typeof response.loan_date === 'string' 
          //   ? this.parseDate(response.loan_date) 
          //   : response.loan_date,
          // return_date: response.return_date && typeof response.return_date === 'string'
          //   ? this.parseDate(response.return_date)
          //   : response.return_date
        };

        this.itemsList = response.details?.map(detail => ({
          ...detail,
          isSelected: true
        })) || [];

        // If you need to fetch additional related data
        // if (this.currentRecord.employee_id) {
        //   this.fetchEmployeeDetails(this.currentRecord.employee_id);
        // }
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
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  getTotalReturnAmount(): number {
    return this.itemsList.reduce((total, item) => {
      return total + (Number(item.return_amount) || 0);
    }, 0);
  }

}
