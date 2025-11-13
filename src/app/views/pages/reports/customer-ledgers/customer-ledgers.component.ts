import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ColumnMode, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';

// interface NgbDateStruct {
//   year: number;
//   month: number;
//   day: number;
// }

@Component({
  selector: 'app-customer-ledgers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxDatatableModule,
    NgSelectModule,
    NgbDatepickerModule,
    BreadcrumbComponent
  ],
  templateUrl: './customer-ledgers.component.html'
})
export class CustomersLedgersComponent {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;
  private LIVE_URL = environment.LIVE_URL;
  
  customers: any[] = [];
  rows: any[] = [];
  loadingIndicator = false;
  loading = false;
  customerError = false;
  ColumnMode = ColumnMode;
  fromDate: NgbDateStruct | null = null;
  toDate: NgbDateStruct | null = null;
  totalDebit = 0;
  totalCredit = 0;
  balance = 0;
  customerInfo: any = {};
  creditBalance: number = 0;

  searchModel = {
    customer_id: null,
    from_date: null,
    to_date: null,
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
  
  resetSearch(): void {
    this.searchModel = {
      customer_id: null,
      from_date: null,
      to_date: null,
    };

    // Reset datepickers
    this.fromDate = null;
    this.toDate = null;
    
    this.rows = [];
    this.customerInfo = {};
    this.creditBalance = 0;
    this.totalDebit = 0;
    this.totalCredit = 0;
    this.balance = 0;
  }

  // format invoice_date yyyy-mm-dd
  private formatDate(date: NgbDateStruct | null): string {
    if (!date) return '';
    return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  }

  private calculateSummary(): void {
    // Ensure numeric calculation
    this.totalDebit = this.rows.reduce((sum, r) => sum + Number(r.debit || 0), 0);
    this.totalCredit = this.rows.reduce((sum, r) => sum + Number(r.credit || 0), 0);
    this.balance = this.totalDebit - this.totalCredit;
  }
  
  onAdvancedSearch(event?: Event): void {
    if (event) event.preventDefault();

    if (!this.searchModel.customer_id) {
      this.customerError = true;
      return;
    } else {
      this.customerError = false;
    }

    this.loading = true;
    const params: any = {
      customer_id: this.searchModel.customer_id
    };

    const from = this.formatDate(this.fromDate);
    const to = this.formatDate(this.toDate);
    if (from) params.from_date = from;
    if (to) params.to_date = to;

    this.http.get<any>(`${this.API_URL}/customer/ledgers`, { params }).subscribe({
      next: res => {
        this.rows = res.ledgers || [];
        this.customerInfo = res.customer || {};
        this.creditBalance = res.credit_balance ?? 0;

        // Add running balance per row
        let runningBalance = 0;
        this.rows = this.rows.map(r => {
          runningBalance += (r.debit || 0) - (r.credit || 0);
          return { ...r, balance: runningBalance };
        });

        this.calculateSummary();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  downloadFile(type: 'excel' | 'pdf'): void {
    const params: any = {
      customer_id: this.searchModel.customer_id
    };

    const from = this.formatDate(this.fromDate);
    const to = this.formatDate(this.toDate);
    
    if (from) params.from_date = from;
    if (to) params.to_date = to;

    // Use HttpClient to download the file
    this.http.get(`${this.API_URL}/customer/ledger/download/${type}`, { 
      params: params,
      responseType: 'blob'  // Important for file downloads
    }).subscribe({
      next: (blob: Blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Set filename based on type
        const extension = type === 'excel' ? 'xlsx' : 'pdf';
        a.download = `customer-ledgers-${new Date().toISOString().split('T')[0]}.${extension}`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (error) => {
        console.error('Download failed:', error);
        alert('Download failed. Please try again.');
      }
    });
  }

}
