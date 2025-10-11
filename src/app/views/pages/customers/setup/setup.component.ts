import { Component } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { NgSelectComponent } from '@ng-select/ng-select';
import { environment } from '../../../../environments/environment';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';

interface Customer {
  id?: number;
  code: string;
  name: string;
  cnic: string;
  email_address: string;
  phone_number: string;
  mobile_number: string;
  city_id: number | null;
  credit_balance: string;
  credit_limit: string;
  address: string;
  status: string | null;
  description?: string;
  //image?: File | string | null;
  images?: {
    image_name: string;
    image_path?: string;
  } | null;
}

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink, CommonModule, FormsModule, NgSelectComponent],
  templateUrl: './setup.component.html'
})
export class CustomersSetupComponent {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;

  currentRecord: Customer = {
    code: '',
    name: '',
    cnic: '',
    email_address: '',
    phone_number: '',
    mobile_number: '',
    city_id: null,
    credit_balance: '',
    credit_limit: '',
    address: '',
    status: 'Active',
    description: '',
    images: null
  };

  isEditMode = false;
  isLoading = false;
  formErrors: any = {};
  globalErrorMessage: string = '';
  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  isImageDeleted = false;

  selected: { id: number; [key: string]: any }[] = [];
  rows: { id: number; [key: string]: any }[] = [];
  temp: { id: number; [key: string]: any }[] = [];
  cities: { id: string; name: string }[] = [];
  status: { id: string; name: string }[] = [];

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.fetchCities();
    this.fetchStatus();

    // check if we are editing
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadCustomer(+id);
      }
    });
  }

  clearError(field: string): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  fetchCities(): void {
    this.http.get<any[]>(`${this.API_URL}/active/cities`).subscribe({
      next: (res) => this.cities = res,
      error: (err) => console.error('Failed to fetch cities:', err)
    });
  }

  fetchStatus(): void {
    this.http.get<any>(`${this.API_URL}/status`).subscribe({
      next: (res) => {
        this.status = Object.entries(res).map(([key, value]) => ({ id: key, name: value as string }));
      },
      error: (err) => console.error('Failed to fetch status:', err)
    });
  }

  loadCustomer(id: number): void {
    this.isLoading = true;
    this.http.get<Customer>(`${this.API_URL}/customers/${id}`).subscribe({
      next: (customer: any) => {
        this.currentRecord = { ...this.currentRecord, ...customer };

        // Fix image handling
        if (customer.images && customer.images.image_name) {
          this.imagePreview = `${this.IMAGE_URL}/uploads/customers/${customer.images.image_name}`;
        }

        this.isEditMode = true;
      },
      error: (err: HttpErrorResponse) => {
        this.globalErrorMessage = err.status === 404
          ? 'Customer not found'
          : 'Failed to load customer details';
      },
      complete: () => this.isLoading = false
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result;
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // Remove Image Function
  removeImage(): void {
    this.imagePreview = null;
    this.currentRecord.images = null;
    this.selectedFile = null;
    this.isImageDeleted = true;
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;

    const formData = new FormData();

    // Only append primitive values (string, number, boolean)
    for (const [key, value] of Object.entries(this.currentRecord)) {
      if (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        typeof value !== 'object' // 👈 skip objects like "images"
      ) {
        formData.append(key, value as any);
      }
    }

    // If a new file is selected
    if (this.selectedFile) {
      formData.append('customer_image', this.selectedFile);
    }

    // If image was deleted
    if (this.isImageDeleted) {
      formData.append('isImageDeleted', '1');
    }

    const request$ = this.currentRecord.id
      ? this.http.post(`${this.API_URL}/customers/${this.currentRecord.id}?_method=PUT`, formData)
      : this.http.post(`${this.API_URL}/customers`, formData);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/customers']);
      },
      error: (error) => {
        this.isLoading = false;
        this.formErrors = error.error?.errors || {};
        this.globalErrorMessage = 'Please check the highlighted fields.';
      }
    });
  }

}
