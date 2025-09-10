import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDropdownModule, NgbNavContent, NgbNavModule, NgbTooltip, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';

interface CompanyAssetReturn {
  id: number;
  issue_date: string;  // Added to match template
  employee_id: number;
  employee?: {
    id: number;
    full_name: string;
  };
  return_date: string;
  status: string;
  description?: string;
  details: CompanyAssetReturnDetail[];
}

interface CompanyAssetReturnDetail {
  id: number;
  company_asset_id: number;
  asset_type_id: number;
  description: string;
  reason?: string;
  status: string;
  asset_type?: {
    id: number;
    name: string;
  };
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
export class CompanyAssetReturnsViewComponent {
  private API_URL = environment.API_URL;

  currentRecord: CompanyAssetReturn = {
    id: 0,
    issue_date: '',  // Added initial value
    employee_id: 0,
    return_date: '',
    status: '',
    details: []
  };

  // Getter for itemsList to access details
  get itemsList() {
    return this.currentRecord.details || [];
  }

  loading = false;
  errorMessage = '';
  company_asset_status: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadCompanyAssetReturn(+id);
      }
    });
  }

  loadCompanyAssetReturn(id: number) {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<CompanyAssetReturn>(`${this.API_URL}/company-asset-returns/${id}`).subscribe({
      next: (response) => {
        this.currentRecord = {
          ...this.currentRecord, // Keep defaults
          ...response // Override with API data
        };
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        if (error.status === 403 && error.error?.redirect) {
          this.router.navigate(['/dashboard']);
        } else if (error.status === 404) {
          this.errorMessage = 'Record not found';
        } else {
          this.errorMessage = 'Failed to load details';
          console.error('Error:', error);
        }
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}