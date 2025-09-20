import { Component, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BreadcrumbComponent } from '../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../environments/environment';

interface Invoice {
  invoice_prefix?: string | null;
  invoice_count?: number | null;
  currency_sign?: string | null;
  [key: string]: any;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    RouterLink,
    CommonModule,
    FormsModule,
  ],
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  private API_URL = environment.API_URL;

  currentRecord: Invoice = {
    invoice_prefix: 'INV',
    invoice_count: 6,
    currency_sign: 'Rs.',
  };

  isLoading = false;
  formErrors: any = {};
  loadingIndicator = true;
  successMessage: string = '';
  
  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchSettings();
  }

  fetchSettings(): void {
    this.loadingIndicator = true;
  
    this.http.get<any>(`${this.API_URL}/settings`).subscribe({
      next: (response) => {
        this.loadingIndicator = false;

        // Map each setting into currentRecord
        Object.keys(response).forEach(key => {
          this.currentRecord[key] = response[key]?.data_value ?? null;
        });
      },
      error: (error) => {
        this.loadingIndicator = false;
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

  onSubmit(event: Event) {
    event.preventDefault();
    this.isLoading = true;
    this.successMessage = ''; // reset previous message

    // Convert currentRecord into array for backend
    const payload = Object.entries(this.currentRecord).map(([key, value]) => ({
      data_name: key,
      data_value: value
    }));

    this.http.post(`${this.API_URL}/settings`, payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Settings saved successfully!';
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.formErrors = error.error?.errors || {};
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}
