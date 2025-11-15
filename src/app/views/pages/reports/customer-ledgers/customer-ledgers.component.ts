import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ColumnMode, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbCalendar, NgbDateParserFormatter, NgbDateStruct, NgbDate, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';

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
  
  customers: any[] = [];
  rows: any[] = [];
  loadingIndicator = false;
  loading = false;
  customerError = false;
  ColumnMode = ColumnMode;
  calendar = inject(NgbCalendar);
  formatter = inject(NgbDateParserFormatter);
  fromDate: NgbDate | null = null;
  toDate: NgbDate | null = null;
  totalDebit = 0;
  totalCredit = 0;
  balance = 0;
  customerInfo: any = {};
  creditBalance: number = 0;
  formErrors: any = {};
  hoveredDate: NgbDate | null = null;

  searchModel = {
    customer_id: null,
    from_date: null,
    to_date: null,
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchCustomers();
    this.onAdvancedSearch();
  }

  fetchCustomers(): void {
    this.http.get<any[]>(`${this.API_URL}/active/customers`).subscribe({
      next: (response) => {
        this.customers = response.map(emp => ({
          ...emp,
        }));
      },
      error: (error) => console.error('Failed to fetch records:', error)
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

  // Date Range
  isRange(date: NgbDate) {
    return date.equals(this.fromDate) || (this.toDate && date.equals(this.toDate)) || this.isInside(date) || this.isHovered(date);
  }

  onDateSelection(date: NgbDate): void {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
      this.clearError('from_date');
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
      this.clearError('to_date');
    } else {
      this.toDate = null;
      this.fromDate = date;
      this.clearError('from_date');
    }
  }

  isHovered(date: NgbDate) {
    return this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate);
  }
  
  isInside(date: NgbDate) {
    return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }

  validateInput(currentValue: NgbDate | null, input: string): NgbDate | null {
    const parsed = this.formatter.parse(input);
    return parsed && this.calendar.isValid(NgbDate.from(parsed)) ? NgbDate.from(parsed) : currentValue;
  }

  clearError(field: string): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
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

    this.loading = true;
    const params: any = {};

    if (this.searchModel.customer_id) params.customer_id = this.searchModel.customer_id;

    const from = this.formatDate(this.fromDate);
    const to = this.formatDate(this.toDate);

    if (from) params.from_date = from;
    if (to) params.to_date = to;

    this.http.get<any>(`${this.API_URL}/customer/ledgers`, { params }).subscribe({
      next: res => {
        this.rows = res.ledgers || [];
        this.customerInfo = res.customer || {};
        this.creditBalance = res.credit_balance ?? 0;

        // Add running balance
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

  downloadFile(type: 'csv' | 'pdf'): void {
    const params: any = {};

    if (this.searchModel.customer_id) params.product_id = this.searchModel.customer_id;

    const from = this.formatDate(this.fromDate);
    const to = this.formatDate(this.toDate);
    
    if (from) params.from_date = from;
    if (to) params.to_date = to;

    this.http.get(`${this.API_URL}/customer/ledger/download/${type}`, { 
      params,
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customer-ledgers-${new Date().toISOString().split('T')[0]}.${type === 'csv' ? 'csv' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
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
