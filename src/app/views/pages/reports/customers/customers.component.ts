import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ColumnMode, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxDatatableModule,
    NgSelectModule,
    BreadcrumbComponent
  ],
  templateUrl: './customers.component.html'
})
export class ReportsCustomersComponent {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;
  private LIVE_URL = environment.LIVE_URL;
  
  customers: any[] = [];
  rows: any[] = [];
  loadingIndicator = false;
  ColumnMode = ColumnMode;

  searchModel = {
    customer_id: null,
    name: null,
    code: null,
    phone_number: null,
    city: null
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchCustomers();
  }

  fetchCustomers(): void {
    this.http.get<any[]>(`${this.API_URL}/active/customers`).subscribe({
      next: (response) => {
        this.customers = response.map(emp => ({
          ...emp,
        }));
      },
      error: (error) => console.error('Failed to fetch customers:', error)
    });
  }
  
  onAdvancedSearch(event?: Event): void {
    if (event) event.preventDefault();
    
    this.loadingIndicator = true;
  
    const params: any = {};
    if (this.searchModel.customer_id) params.customer_id = this.searchModel.customer_id;
    if (this.searchModel.name) params.name = this.searchModel.name;
    if (this.searchModel.code) params.code = this.searchModel.code;
    if (this.searchModel.phone_number) params.phone_number = this.searchModel.phone_number;
    if (this.searchModel.city) params.city = this.searchModel.city;
  
    this.http.get<any[]>(`${this.API_URL}/reports/customers`, { params }).subscribe({
      next: (response) => {
        this.rows = response;

        // Optionally, you can process image_url if necessary (e.g., fallback for missing images)
        this.rows.forEach((response) => {
          response.image = response.image_name
            ? `${this.IMAGE_URL}/uploads/customers/${response.image_name}`
            : 'images/placeholder.png';
        });


        this.loadingIndicator = false;
      },
      error: () => {
        this.loadingIndicator = false;
      }
    });
  }
  
  resetSearch(): void {
    this.onAdvancedSearch();

    this.searchModel = {
      customer_id: null,
      name: null,
      code: null,
      phone_number: null,
      city: null
    };
  }

  downloadFile(type: 'excel' | 'pdf'): void {
    const params = new URLSearchParams();
    if (this.searchModel.customer_id) params.append('customer_id', this.searchModel.customer_id);
    if (this.searchModel.name) params.append('name', this.searchModel.name);
    if (this.searchModel.code) params.append('code', this.searchModel.code);
    if (this.searchModel.phone_number) params.append('phone_number', this.searchModel.phone_number);
    if (this.searchModel.city) params.append('city', this.searchModel.city);
  
    window.open(`${this.LIVE_URL}/api/download/customers/${type}?${params.toString()}`, '_blank');
  }
}
