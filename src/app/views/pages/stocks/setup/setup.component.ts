import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ColumnMode, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { environment } from '../../../../environments/environment';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';

interface Stock {
  id?: number | null;
  stock_date?: NgbDateStruct | string | null;
  status?: string | null;
}

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    NgxDatatableModule,
    CommonModule,
    FormsModule,
    NgbDatepickerModule,
    MyNgSelectComponent
  ],
  templateUrl: './setup.component.html'
})
export class StocksSetupComponent {
  private API_URL = environment.API_URL;

  currentRecord: Stock = {
    stock_date: '',
    status: 'Active',
  };
  
  globalErrorMessage: string = '';
  isEditMode = false;
  isLoading = false;
  errorMessage: any;
  formErrors: any = {};
  isAmountValid: boolean = true;
  products: any[] = [];
  currencySign: string = '';
  rows = [];
  temp = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;
  status: { id: string; name: string }[] = [];
  statusDisabled: boolean = false;

  // default values
  totalStock: number = 0;
  totalPrice: number = 0;

  // itemsList structure
  itemsList: any[] = [{
    id: null,
    product_id: null,
    stock: 0,
    unit: '',
    price: 0,
    total_amount: 0,
  }];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchProducts();
    this.fetchCurrencySign();
    this.setDefaultIssueDate();
    this.fetchStatus();

    // handle edit route
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadStocks(+id);
      }
    });
  }

  setDefaultIssueDate(): void {
    const today = new Date();
    this.currentRecord.stock_date = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
  }

  fetchProducts(): void {
    this.http.get<any[]>(`${this.API_URL}/active/products`).subscribe({
      next: (response) => {
        this.products = response.map((product) => ({
          ...product,
          product_label: `${product.name} (${product.sku ?? ''})`,
          unit_price: +product.sale_price || 0,
          unit: product.unit_name || ''
        }));
      },
      error: (error) => console.error('Failed to fetch products:', error)
    });
  }

  fetchStatus(): void {
    this.http.get<any>(`${this.API_URL}/status`).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.status = Object.entries(response.data)
            .filter(([key]) => key !== '')
            .map(([key, value]) => ({
              id: key,
              name: value as string
            }));
        } else {
          console.error('Invalid response format:', response);
        }
      },
      error: (error) => console.error('Failed to fetch record:', error)
    });
  }

  fetchCurrencySign(): void {
    this.http.get<any>(`${this.API_URL}/settings`).subscribe({
      next: (response) => {
        console.log(response)
        this.currencySign = response.currency.data_value || '';
      },
      error: (err) => console.error('Failed to fetch currency sign:', err)
    });
  }

  // TAB on last total field -> add new row
  onTabKey(event: KeyboardEvent, index: number) {
    if ((event.key === 'Tab' || event.keyCode === 9) && index === this.itemsList.length - 1) {
      this.addItemRow();
    }
  }

  addItemRow() {
    const newItem = {
      id: null,
      product_id: null,
      stock: 0,
      unit: '',
      price: 0,
      total_amount: 0,
    };
    this.itemsList = [...this.itemsList, newItem];
  }

  parseDate(dateString: string): NgbDateStruct {
    const [year, month, day] = dateString.split('-').map(Number);
    return { year, month, day };
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

  private parseDateFromBackend(dateString: string | undefined): NgbDateStruct | null {
    if (!dateString) return null;

    // If already NgbDateStruct, return it
    if (typeof dateString === 'object' && 'year' in dateString) return dateString;

    // Parse ISO string
    const date = new Date(dateString);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }

  loadStocks(id: number) {
    this.isLoading = true;

    this.http.get<any>(`${this.API_URL}/stocks/${id}`).subscribe({
      next: (response) => {
        // Merge and parse record
        this.currentRecord = {
          ...this.currentRecord,
          ...response,
          stock_date: this.parseDateFromBackend(
            typeof response.stock_date === 'string' ? response.stock_date : undefined
          ),
        } as Stock;

        // Map stock details -> itemsList
        this.itemsList = (response.details || []).map((item: any) => ({
          id: item.id ?? null,
          product_id: item.product_id ?? null,
          stock: item.stock ?? 0,
          unit_id: item.unit_id ?? null,
          unit_name: item.unit_name ?? '',
          price: item.price ?? 0,
          total_amount: item.total ?? 0
        }));

        // Recalculate totals
        this.itemsList.forEach((_, i) => this.updateRowTotal(i));
        this.updateTotals();

        // Assign summary fields
        this.totalStock = response.total_stock ?? 0;
        this.totalPrice = response.total_price ?? 0;

        // If status = "Posted" and not in dropdown, add it manually
        const postedExists = this.status.some((s) => s.id === 'Posted');
        if (this.currentRecord.status === 'Posted' && !postedExists) {
          this.status.push({ id: 'Posted', name: 'Posted' });
        }

        // Optional: disable dropdown if Posted
        this.statusDisabled = this.currentRecord.status === 'Posted';

        this.isEditMode = true;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 403) {
          this.router.navigate(['/dashboard']);
        } else if (error.status === 404) {
          this.errorMessage = 'Stock record not found';
        } else {
          this.errorMessage = 'Failed to load stock details';
          console.error('Error loading stock:', error);
        }
      },
    });
  }

  // compute a row total and update item.total_amount
  updateRowTotal(index: number) {
    const item = this.itemsList[index];
    if (!item) return;

    const stock = Number(item.stock) || 0;
    const price = Number(item.price) || 0;
    
    item.total_amount = stock * price;

    // recalc summary after updating row
    this.updateTotals();
  }

  updateAvailableProducts() {
    this.itemsList.forEach((item, index) => {
      item.availableProducts = this.getAvailableProducts(index);
    });
  }

  // Add this method to check if a product is available
  isProductAvailable(productId: any, currentIndex: number): boolean {
    if (!productId) return true;
    
    return !this.itemsList.some((item, i) => 
      i !== currentIndex && item.product_id != null && item.product_id == productId
    );
  }

  getAvailableProducts(index: number): any[] {
    if (!this.products || this.products.length === 0) {
      return [];
    }

    const currentProductId = this.itemsList[index]?.product_id ?? null;

    const selectedProductIds = this.itemsList
      .filter((item, i) => i !== index && item.product_id != null)
      .map(item => item.product_id);

    // if current row hasn’t selected yet, just block duplicates
    if (!currentProductId) {
      return this.products.filter(product => !selectedProductIds.includes(product.id));
    }

    // otherwise keep its own product + block others
    return this.products.filter(product =>
      product.id === currentProductId || !selectedProductIds.includes(product.id)
    );
  }

  trackByProductId(index: number, item: any): any {
    return item ? item.id : index;
  }

  onProductChange(product: any, index: number): void {
    // check duplicate product
    const duplicateIndex = this.itemsList.findIndex(
      (item, i) => i !== index && item.product_id === product
    );

    if (duplicateIndex !== -1) {
      alert('You cannot choose the duplicate product!');
      this.itemsList[index].product_id = null;
      this.itemsList[index].unit_id = '';
      this.itemsList[index].unit_name = '';
      this.itemsList[index].price = 0;
      this.itemsList[index].total_amount = 0;
      return;
    }
  
    if (product) {
      this.itemsList[index].price = product.unit_price;
      this.itemsList[index].unit_id = product.unit_id;
      this.itemsList[index].unit_name = product.unit_name;
      this.updateRowTotal(index);
    }
  }

  updateTotals(): void {
    // Sum stock and gross total before discount
    this.totalStock = this.itemsList.reduce((sum, item) => sum + (+item.stock || 0), 0);
    this.totalPrice = this.itemsList.reduce((sum, item) => sum + (+item.total_amount || 0), 0);
  }

  // format stock_date yyyy-mm-dd
  formatDate(stock_date: any): string {
    if (!stock_date) return '';
    if (typeof stock_date === 'string') return stock_date;
    return `${stock_date.year}-${String(stock_date.month).padStart(2, '0')}-${String(stock_date.day).padStart(2, '0')}`;
  }

  // Combined add / update submit (single method)
  onSubmit(event: Event, isPost: boolean = false): void {
    event.preventDefault();
    this.isLoading = true;
    this.globalErrorMessage = '';

    if (this.itemsList.length === 0) {
      this.globalErrorMessage = 'At least one item is required.';
      this.isLoading = false;
      return;
    }

    // update totals
    this.itemsList.forEach((_, i) => this.updateRowTotal(i));

    if (!this.isAmountValid) {
      this.isLoading = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const newStatus = isPost ? 'Posted' : this.currentRecord.status;

    const payload = {
      stock_date: this.formatDate(this.currentRecord.stock_date),
      status: newStatus,
      total_stock: this.totalStock,
      total_price: this.totalPrice,
      items: this.itemsList.map(item => ({
        product_id: item.product_id,
        stock: item.stock,
        unit_id: item.unit_id,
        unit_name: item.unit_name,
        price: item.price,
        total_amount: item.total_amount,
      }))
    };

    const request$ = this.isEditMode && (this.currentRecord as any).id
      ? this.http.put(`${this.API_URL}/stocks/${(this.currentRecord as any).id}`, payload)
      : this.http.post(`${this.API_URL}/stocks`, payload);

    request$.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (isPost) {
          this.currentRecord.status = 'Posted';
        }
        this.router.navigate(['/products/stocks']);
      },
      error: (error) => {
        this.isLoading = false;
        this.formErrors = error.error?.errors || {};

        if (error.error?.error) {
          this.globalErrorMessage = error.error.error;
        } else if (error.error?.message) {
          this.globalErrorMessage = error.error.message;
        } else {
          this.globalErrorMessage = 'Please fill all required fields correctly.';
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Delete a single row by index (if saved on server, call API)
  deleteItemRow(index: number) {
    const item = this.itemsList[index];
    if (!item) return;

    if (!confirm('Are you sure do you want to delete this row permanently?')) return;

    try {
      if (item.id) {
        //await lastValueFrom(this.http.delete(`${this.API_URL}/loan-details/${item.id}`));
      }
      this.itemsList.splice(index, 1);
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('An error occurred while deleting the item.');
    }
  }

}
