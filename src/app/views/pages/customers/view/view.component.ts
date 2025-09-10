import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDropdownModule, NgbNavContent, NgbNavModule, NgbTooltip, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';

interface Employee {
  id?: number;
  code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  religion: string | null;
  gender: string | null;
  date_of_birth?: string | null;
  joining_date: string | null;
  resign_date?: string | null;
  department_name: number | null;
  designation_name: number | null;
  job_type_name: string | number | null;
  city_name: number | null;
  bank_name: number | null;
  account_number: string | null;
  basic_salary: number;
  house_rent?: number;
  medical_allowances?: number;
  transport_allowances?: number;
  total_salary: number;
  status: number | null;
  address: string;
  description?: string;
  image?: File | string | null;
  image_url?: string;
  slug?: string;
  images?: {
    image_name: string;
  };
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

  currentRecord: Employee = {
    code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    religion: '',
    gender: null,
    date_of_birth: '',
    joining_date: '',
    resign_date: '',
    department_name: null,
    designation_name: null,
    job_type_name: null,
    city_name: null,
    bank_name: null,
    account_number: null,
    basic_salary: 0,
    house_rent: 0,
    medical_allowances: 0,
    transport_allowances: 0,
    total_salary: 0,
    status: null,
    address: '',
    image: ''
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
    
    this.http.get<Employee>(`${this.API_URL}/employee/${id}`).subscribe({
      next: (employee) => {
        this.currentRecord = {
          ...this.currentRecord,
          ...employee,
        };
    
        if (employee.images && employee.images.image_name) {
          this.imagePreview = `${this.IMAGE_URL}/uploads/products/${employee.images.image_name}`;
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
