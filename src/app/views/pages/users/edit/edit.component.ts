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
import { AuthService } from '../../../../auth/auth.service';

interface User {
  company_id: number | null;
  company_name: string | null;
  id?: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone_number: string;
  gender: string | null;
  date_of_birth?: NgbDateStruct | string | null;
  city_id: number | null;
  address: string;
  image?: File | string | null;
  image_url?: string;
  images?: {
    image_name: string;
  };
}

@Component({
  selector: 'app-edit',
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
  templateUrl: './edit.component.html'
})
export class UsersEditComponent {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;

  currentRecord: User = {
    company_id: null,
    company_name: null,
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone_number: '',
    gender: null,
    date_of_birth: '',
    city_id: null,
    address: '',
    image: ''
  };

  successMessage: string = '';
  globalError: string = '';
  globalErrorMessage: string = '';
  isEditMode = false;
  isLoading = false;
  errorMessage: any;
  selected: any[] = [];
  formErrors: any = {};
  cities: any[] = [];
  gender: { id: string; name: string }[] = [];
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  companies: any[] = [];
  user: any = null;
  
  rows = [];
  temp = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchCompanies();
    this.fetchCities();

    this.gender = [
      { id: 'Male', name: 'Male' },
      { id: 'Female', name: 'Female' },
      { id: 'Other', name: 'Other' },
    ];

    // Get Current User
    this.authService.currentUser$.subscribe((user: User) => {
      if (user) {
        this.user = user;
      }
    });

    // Handle id-based route
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadUser(+id);
      }
    });
  }

  clearError(field: string): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  fetchCompanies(): void {
    this.http.get<any[]>(`${this.API_URL}/active/companies`).subscribe({
      next: (response) => {
        // Map each asset type to add a custom label
        this.companies = response.map((companies) => ({
          ...companies
        }));
      },
      error: (error) => console.error('Failed to fetch employees:', error)
    });
  }

  fetchCities(): void {
    this.http.get<any>(`${this.API_URL}/active/cities`).subscribe({
      next: (response) => {
        this.cities = response;
      },
      error: (error) => console.error('Failed to fetch cities:', error)
    });
  }

  loadUser(id: number) {
    this.isLoading = true;
    this.http.get<User>(`${this.API_URL}/user/${id}`).subscribe({
      next: (user) => {
        this.currentRecord = {
          ...this.currentRecord,
          ...user,
          date_of_birth: this.parseDateFromBackend(
            typeof user.date_of_birth === 'string' ? user.date_of_birth : undefined
          ),
        };

        if (user.images?.image_name) {
          this.imagePreview = `${this.IMAGE_URL}/uploads/users/${user.images.image_name}`;
        }

        this.isEditMode = true;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        
        if (error.status === 403 && error.error?.redirect) {
          // Unauthorized access - redirect to dashboard
          this.router.navigate(['/dashboard']);
        } else if (error.status === 404) {
        } else {
          console.error('Error isLoading user:', error);
        }
      }
    });
  }
  // loadUsers(id: number) {
  //   this.http.get<User>(`${this.API_URL}/user/${id}`).subscribe(user => {
  //     this.currentRecord = {
  //       ...this.currentRecord,
  //       ...user,
        
  //       date_of_birth: this.parseDateFromBackend(
  //         typeof user.date_of_birth === 'string' ? user.date_of_birth : undefined
  //       ),
  //     };
  
  //     if (user.images && user.images.image_name) {
  //       this.imagePreview = `${this.IMAGE_URL}/uploads/users/${user.images.image_name}`;
  //     }
  
  //     this.isEditMode = true;
  //   });
  // }

  // Add these methods to your component class
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
  
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;
  
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  formatDate(date: NgbDateStruct | string | undefined): string {
    if (typeof date === 'string') return date;
    if (!date) return '';
    return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  }
  
  // updateRecord(event: Event): void {
  //   event.preventDefault();
  //   this.isLoading = true;
  //   this.globalError = '';
  
  //   const formData = new FormData();
  
  //   // Add the form data
  //   const entries = Object.entries(this.currentRecord) as [keyof User, any][];
  //   for (const [key, value] of entries) {
  //     if (value !== null && value !== undefined && value !== '') {
  //       if (key === 'date_of_birth') {
  //         formData.append(key, this.formatDate(value));
  //       } else {
  //         formData.append(key, value);
  //       }
  //     }
  //   }
  
  //   // Check if the file is selected and append it
  //   if (this.selectedFile) {
  //     formData.append('user_image', this.selectedFile);
  //   }
  
  //   // Proceed with the API request to update employee data
  //   this.http.post(`${this.API_URL}/users`, formData).subscribe({
  //     next: (response) => {
  //       this.isLoading = false;
  //       this.router.navigate(['/users']);
  //     },
  //     error: (error) => {
  //       this.isLoading = false;
  //       // Check if the error is related to a duplicate value like code, email, etc.
  //       if (error?.error?.errors) {
  //         this.formErrors = error.error.errors;
  //       }
  //     }
  //   });
  // }

  updateRecord(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
  
    const formData = new FormData();
    const entries = Object.entries(this.currentRecord) as [keyof User, any][];
  
    for (const [key, value] of entries) {
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'date_of_birth') {
          formData.append(key, this.formatDate(value));
        } else {
          formData.append(key, value);
        }
      }
    }
  
    if (this.selectedFile) {
      formData.append('user_image', this.selectedFile);
    }
  
    // Proceed with the API request to update user data
    this.http.post(`${this.API_URL}/users/${this.currentRecord.id}?_method=PUT`, formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Record updated successfully!';
      },
      error: (error) => {
        this.isLoading = false;
        // Check if the error is related to a duplicate value like email, etc.
        if (error?.error?.errors) {
          this.formErrors = error.error.errors;
        }
      }
    });
  }

  // Add this error handling method
  // private handleError(error: any): void {
  //   if (error.error?.errors) {
  //     // Format errors to match what the template expects
  //     this.formErrors = error.error.errors;
  //   } else if (error.error?.message) {
  //     this.errorMessage = error.error.message;
  //   } else {
  //     this.errorMessage = 'An unknown error occurred';
  //   }
    
  //   // Scroll to the first error
  //   setTimeout(() => {
  //     const firstErrorElement = document.querySelector('.text-danger');
  //     if (firstErrorElement) {
  //       firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  //     }
  //   }, 100);
  // }

  // Convert to yyyy-mm-dd string for backend
  // private formatDateForBackend(date: NgbDateStruct | string | undefined): string | null {
  //   if (!date) return null;
    
  //   // If already a string, return it directly
  //   if (typeof date === 'string') return date;
    
  //   // If NgbDateStruct, format it
  //   return `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
  // }

  // Convert from backend string to NgbDateStruct
  private parseDateFromBackend(dateString: string | undefined): NgbDateStruct | null {
    if (!dateString) return null;
    
    // If already in NgbDateStruct format, return it
    if (typeof dateString === 'object' && 'year' in dateString) {
      return dateString;
    }
    
    // Parse string date
    const parts = dateString.split('-');
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parseInt(parts[2], 10)
    };
  }

}
