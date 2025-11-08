import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbNavContent, NgbNavModule, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';

interface Stock {
  id: number;
  stock_number: string;
  stock_date: string;
  total_stock: number;
  total_price: number;
  status: string;
  details: StockItem[];
}

interface StockItem {
  id: number;
  product_id: number;
  product_name?: string;
  stock: number;
  unit_name: string;
  price: number;
  total_amount: number;
  total: number;
}

@Component({
  selector: 'app-stocks-view',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    NgbNavModule,
    NgbNavContent,
    NgbNavOutlet,
    FormsModule
  ],
  templateUrl: './view.component.html'
})
export class StocksViewComponent implements OnInit {
  private API_URL = environment.API_URL;

  formErrors: any = {};
  currentRecord: Stock | null = null;
  itemsList: StockItem[] = [];
  isLoading = false;
  errorMessage = '';
  currencySign: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.fetchCurrency();
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadStocks(+id);
      }
    });
  }

  clearError(field: string): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  fetchCurrency(): void {
    this.http.get<any>(`${this.API_URL}/settings`).subscribe({
      next: (response) => {
        this.currencySign = response.currency.data_value || '';
      },
      error: (err) => console.error('Failed to fetch currency sign:', err)
    });
  }

  loadStocks(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.itemsList = [];

    this.http.get<Stock>(`${this.API_URL}/stocks/${id}`).subscribe({
      next: (response) => {
        this.currentRecord = response;
        this.itemsList = response.details || [];
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;

        if (error.status === 403) {
          this.router.navigate(['/dashboard']);
        } else if (error.status === 404) {
          this.errorMessage = 'Stocks not found';
        } else {
          this.errorMessage = 'Failed to load stock record';
          console.error('Error loading stock:', error);
        }
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
