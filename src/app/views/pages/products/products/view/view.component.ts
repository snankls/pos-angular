import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDropdownModule, NgbNavContent, NgbNavModule, NgbTooltip, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { BreadcrumbComponent } from '../../../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../../../environments/environment';

interface Product {
  id?: number;
  sku: string;
  name: string;
  category_name: number | null;
  brand_name: number | null;
  unit_name: number | null;
  cost_price: number | null;
  sale_price: number | null;
  stock: number | null;
  status: string | null;
  description?: string;
  images?: {
    image_name: string;
    image_path?: string;
  } | null;
}

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    NgbNavModule,
    NgbNavContent,
    NgbNavOutlet,
    NgbDropdownModule,
    NgbTooltip
  ],
  templateUrl: './view.component.html'
})
export class ProductsViewComponent {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;

  currentRecord: Product = {
    sku: '',
    name: '',
    category_name: null,
    brand_name: null,
    unit_name: null,
    cost_price: null,
    sale_price: null,
    stock: null,
    status: 'Active',
    description: '',
    images: null
  };

  isLoading: boolean = false;
  errorMessage: string = '';
  defaultNavActiveId = 1;
  rows: any[] = [];
  loadingIndicator = false;
  employee_status: string = '';
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
        this.fetchProducts(+id);
      }
    });
  }

  fetchProducts(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.get<Product>(`${this.API_URL}/products/${id}`).subscribe({
      next: (employee) => {
        this.currentRecord = {
          ...this.currentRecord,
          ...employee,
        };
    
        if (employee.images && employee.images.image_name) {
          this.imagePreview = `${this.IMAGE_URL}/products/${employee.images.image_name}`;
        }
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        
        if (error.status === 403 || error.status === 404) {
          // Unauthorized access or not found - redirect to dashboard
          this.router.navigate(['/dashboard']);
        } else {
          // Handle other errors
          this.errorMessage = 'Failed to load employee details. Please try again.';
          console.error('Error fetching employee:', error);
        }
      }
    });
  }

}
