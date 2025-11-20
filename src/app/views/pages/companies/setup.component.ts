import { Component } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../../auth/auth.service';

interface Company {
  id?: number;
  name: string | null;
  description: string;
  image?: File | string | null;
  image_url?: string;
  images?: {
    image_name: string;
  };
}

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    RouterLink,
    CommonModule,
    FormsModule,
  ],
  templateUrl: './setup.component.html'
})
export class CompaniesSetupComponent {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;

  currentRecord: any = {};
  userId: number | null = null;
  successMessage: string = '';
  globalError: string = '';
  globalErrorMessage: string = '';
  isEditMode = false;
  isLoading = false;
  errorMessage: any;
  formErrors: any = {};
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      const companyId = Number(user?.company?.id);
      if (companyId) {
        this.userId = companyId;
        this.loadCompany(this.userId);
      }
    });
  }

  clearError(field: string): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  loadCompany(userId: number | null): void {
    if (!userId) {
      console.error('User ID is null');
      return;
    }
    
    this.http.get<any>(`${this.API_URL}/user/companies/${userId}`).subscribe({
      next: (user) => {
        this.currentRecord = { ...user };
        if (user.images?.image_name) {
          this.imagePreview = `${this.IMAGE_URL}/companies/${user.images.image_name}`;
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading company:', error);
      }
    });
  }

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

  updateRecord(event: Event): void {
    event.preventDefault();
    this.isLoading = true;

    const formData = new FormData();

    // Append standard fields
    formData.append('name', this.currentRecord.name || '');
    formData.append('description', this.currentRecord.description || '');

    // Append image file if selected
    if (this.selectedFile) {
      formData.append('company_image', this.selectedFile);
    }

    // Submit with method spoofing
    this.http.post(`${this.API_URL}/companies/${this.currentRecord.id}?_method=PUT`, formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Record updated successfully!';
        this.formErrors = {};
      },
      error: (error) => {
        this.isLoading = false;
        if (error?.error?.errors) {
          this.formErrors = error.error.errors;
        } else {
          this.globalErrorMessage = 'An error occurred. Please try again.';
        }
      }
    });
  }

}
