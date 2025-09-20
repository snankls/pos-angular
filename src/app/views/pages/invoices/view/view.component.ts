import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDropdownModule, NgbNavContent, NgbNavModule, NgbTooltip, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';

interface InvoiceDetail {
  id: number;
  product_id: number | null;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  unit_name: string;
  sale_price: number;
  discount_type?: string | null;
  discount_value?: number;
  total: number;
}

interface InvoiceResponse {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_address?: string;
  invoice_number: string;
  invoice_date: string;
  description?: string;
  total_quantity: number;
  total_price: number;
  discount_type?: string | null;
  discount_value?: number;
  total_discount: number;
  grand_total: number;
  status: string;
  details: InvoiceDetail[];
}

@Component({
  selector: 'app-invoice-view',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    NgbNavModule,
    NgbNavContent,
    NgbNavOutlet,
    NgbDropdownModule,
    NgbTooltip
  ],
  templateUrl: './view.component.html'
})
export class InvoicesViewComponent {
  private API_URL = environment.API_URL;

  currentRecord: InvoiceResponse | null = null;
  itemsList: InvoiceDetail[] = [];

  isLoading = false;
  errorMessage = '';
  currencySign: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchCurrencySign();
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadInvoice(+id);
      }
    });
  }

  fetchCurrencySign(): void {
    this.http.get<any>(`${this.API_URL}/settings`).subscribe({
      next: (response) => {
        console.log(response)
        this.currencySign = response.currency_sign.data_value || '';
      },
      error: (err) => console.error('Failed to fetch currency sign:', err)
    });
  }

  loadInvoice(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.itemsList = [];

    this.http.get<InvoiceResponse>(`${this.API_URL}/invoices/${id}`).subscribe({
      next: (response) => {
        this.currentRecord = response;
        this.itemsList = response.details || [];
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;

        if (error.status === 403) {
          this.router.navigate(['/dashboard']);
        } else if (error.status === 404) {
          this.errorMessage = 'Invoice not found';
        } else {
          this.errorMessage = 'Failed to load invoice';
          console.error('Error loading invoice:', error);
        }
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

}
