import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDropdownModule, NgbNavContent, NgbNavModule, NgbTooltip, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';

interface CompanyAsset {
  id: number | null;
  full_name: string | null;
  issue_date: string;
  status: number | null;
  description?: string;
  slug?: string;
  employee?: {
    full_name: string;
  };
  details?: CompanyAssetDetail[];
}

interface CompanyAssetDetail {
  id: number;
  company_asset_id: number;
  asset_type_id: number;
  description: string;
  status: number;
  asset_type?: {
    name: string;
  };
}

interface Employee {
  id?: number | null;
  full_name: string | null;
  issue_date: string;
  status: number | null;
  description?: string;
  slug?: string;
  employee?: {
    full_name: string;
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
export class CompanyAssetsViewComponent {
  private API_URL = environment.API_URL;

  currentRecord: CompanyAsset = {
    id: null,
    full_name: null,
    issue_date: '',
    status: null,
    description: '',
    employee: {
      full_name: '',
    },
    details: []
  };

  itemsList: {
    id: number;
    company_asset_id: number;
    asset_type_id: number;
    description: string;
    status: number;
    asset_type?: {
      name: string;
    };
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
        this.loadCompanyAssets(+id);
      }
    });
  }

  loadCompanyAssets(id: number) {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<CompanyAsset>(`${this.API_URL}/company-assets/${id}`).subscribe({
      next: (response) => {
        this.currentRecord = response;
        this.itemsList = response.details || [];
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        
        if (error.status === 403 && error.error?.redirect) {
          // Unauthorized access - redirect to dashboard
          this.router.navigate(['/dashboard']);
        } else if (error.status === 404) {
          this.errorMessage = 'Company asset not found';
        } else {
          this.errorMessage = 'Failed to load company asset details';
          console.error('Error isLoading company asset:', error);
        }
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

}
