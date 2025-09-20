import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDropdownModule, NgbNavContent, NgbNavModule, NgbTooltip, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';

interface Customer {
  id?: number;
  code: string;
  name: string;
  cnic: string;
  email_address: string;
  phone_number: string;
  mobile_number: string;
  city_name: string | null;
  credit_balance: string;
  credit_limit: string;
  address: string;
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
export class CustomersViewComponent {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;

  currentRecord: Customer = {
    code: '',
    name: '',
    cnic: '',
    email_address: '',
    phone_number: '',
    mobile_number: '',
    city_name: null,
    credit_balance: '',
    credit_limit: '',
    address: '',
    status: 'Active',
    description: '',
    images: null
  };

  isLoading: boolean = false;
  errorMessage: string = '';
  defaultNavActiveId = 1;
  rows: any[] = [];
  loadingIndicator = false;
  //customer_status: string = '';
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
        this.fetchCustomers(+id);
      }
    });
  }

  fetchCustomers(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.get<Customer>(`${this.API_URL}/customers/${id}`).subscribe({
      next: (customer) => {
        this.currentRecord = {
          ...this.currentRecord,
          ...customer,
        };
    
        if (customer.images && customer.images.image_name) {
          this.imagePreview = `${this.IMAGE_URL}/uploads/customers/${customer.images.image_name}`;
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
          this.errorMessage = 'Failed to load customer details. Please try again.';
          console.error('Error fetching customer:', error);
        }
      }
    });
  }

}
