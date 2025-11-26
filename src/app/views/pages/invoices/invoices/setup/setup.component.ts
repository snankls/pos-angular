import { Component } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ColumnMode, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../layout/breadcrumb/breadcrumb.component';

interface Invoice {
  id?: number | null;
  invoice_number?: string;
  customer_id?: string | null;
  invoice_date?: NgbDateStruct | string | null;
  status?: string | null;
  description?: string | null;
}

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    RouterLink,
    NgxDatatableModule,
    CommonModule,
    FormsModule,
    NgbDatepickerModule,
    MyNgSelectComponent,
    SweetAlert2Module,
    NgbAlertModule
  ],
  templateUrl: './setup.component.html'
})
export class InvoicesSetupComponent {
  private API_URL = environment.API_URL;

  currentRecord: Invoice = {
    customer_id: null,
    invoice_date: '',
    status: 'Active',
    description: '',
  };
  
  selected: number[] = []; 
  selectedRows: number[] = [];
  globalError: string = '';
  globalErrorMessage: string = '';
  isEditMode = false;
  isLoading = false;
  errorMessage: any;
  formErrors: any = {};
  isAmountValid: boolean = true;
  customers: any[] = [];
  products: any[] = [];
  status: { id: string; name: string }[] = [];
  discount: string[] = ['Fixed', 'Percentage'];
  currencySign: string = '';
  stockErrors: string[] = [];

  // default values
  selectedDiscount: string = 'Fixed';
  discountValue: number = 0;
  totalQuantity: number = 0;
  totalPrice: number = 0;
  totalDiscount: number = 0;
  grandTotal: number = 0;

  // itemsList structure (use these fields in template)
  itemsList: any[] = [{
    id: null,
    product_id: null,
    quantity: 0,
    unit: '',
    price: 0,
    discountType: 'Fixed',
    discountValue: 0,
    total_amount: 0,
  }];

  rows = [];
  temp = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchCustomers();
    this.fetchProducts();
    this.fetchCurrency();
    this.fetchStatus();
    this.setDefaultIssueDate();

    this.discount = ['Fixed', 'Percentage'];

    // handle edit route
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadInvoices(+id);
      }
    });
  }

  setDefaultIssueDate(): void {
    const today = new Date();
    this.currentRecord.invoice_date = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
  }

  fetchCustomers(): void {
    this.http.get<any[]>(`${this.API_URL}/active/customers`).subscribe({
      next: (response) => {
        this.customers = response.map((customer) => ({
          ...customer,
          customer_label: `${customer.name} (${customer.code})`,
        }));
      },
      error: (error) => console.error('Failed to fetch customers:', error)
    });
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

  fetchCurrency(): void {
    this.http.get<any>(`${this.API_URL}/settings`).subscribe({
      next: (response) => {
        this.currencySign = response.currency.data_value || '';
      },
      error: (err) => console.error('Failed to fetch currency sign:', err)
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

  // TAB on last total field -> add new row
  onTabKey(event: KeyboardEvent, index: number) {
    // Do nothing if status is 'Posted'
    if (this.currentRecord.status === 'Posted') return;

    // Modern way to detect Tab key
    if (event.key === 'Tab' && index === this.itemsList.length - 1) {
      this.addItemRow();
    }
  }

  addItemRow() {
    const newItem = {
      id: null,
      product_id: null,
      quantity: 0,
      unit: '',
      price: 0,
      discountType: 'Fixed',
      discountValue: 0,
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

  loadInvoices(id: number) {
    this.isLoading = true;
    this.http.get<any>(`${this.API_URL}/invoices/${id}`).subscribe({
      next: (response) => {
        console.log(response);
        this.currentRecord = {
          ...this.currentRecord,
          ...response,

            invoice_date: this.parseDateFromBackend(
              typeof response.invoice_date === 'string' ? response.invoice_date : undefined
            ),
        } as Invoice;

        // map invoice details -> itemsList
        this.itemsList = (response.details || []).map((item: any) => ({
          id: item.id ?? null,
          product_id: item.product_id ?? null,
          quantity: item.quantity ?? 0,
          unit_id: item.unit_id ?? null,
          unit_name: item.unit_name ?? '',
          price: item.price ?? 0,
          discountType: item.discount_type ?? 'Fixed',
          discountValue: item.discount_value ?? 0,
          total_amount: item.total_amount ?? 0
        }));

        // recalc row totals and summary
        this.itemsList.forEach((_, i) => this.updateRowTotal(i));
        this.updateTotals();

        // invoice-level summary fields
        this.totalQuantity = response.total_quantity ?? 0;
        this.totalPrice = response.total_price ?? 0;
        this.totalDiscount = response.total_discount ?? 0;
        this.grandTotal = response.grand_total ?? 0;

        this.isEditMode = true;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 403) this.router.navigate(['/dashboard']);
        else if (error.status === 404) this.errorMessage = 'Invoice record not found';
        else {
          this.errorMessage = 'Failed to load invoice details';
          console.error('Error loading invoice:', error);
        }
      },
    });
  }

  // compute a row total and update item.total_amount
  updateRowTotal(index: number) {
    const item = this.itemsList[index];
    if (!item) return;

    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    let discountAmount = 0;

    if (item.discountType === 'Percentage') {
      discountAmount = (price * qty * (Number(item.discountValue) || 0)) / 100;
    } else {
      discountAmount = Number(item.discountValue) || 0;
    }

    item.total_amount = Math.max(0, price * qty - discountAmount);

    this.updateTotals(); // always update summary after row change
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
    // Sum of quantities
    this.totalQuantity = this.itemsList.reduce((sum, item) => sum + (+item.quantity || 0), 0);

    // Sum of total amounts (price * qty - row discount)
    this.totalPrice = this.itemsList.reduce((sum, item) => sum + (+item.price * +item.quantity || 0), 0);

    let rowDiscountTotal = 0;

    // Calculate row discounts
    this.itemsList.forEach(item => {
      const qty = +item.quantity || 0;
      const price = +item.price || 0;
      const discountValue = +item.discountValue || 0;

      if (item.discountType === 'Fixed') {
        rowDiscountTotal += discountValue;
      } else if (item.discountType === 'Percentage') {
        rowDiscountTotal += (price * qty * discountValue) / 100;
      }
    });

    // Apply footer discount
    let footerDiscount = 0;
    if (this.selectedDiscount === 'Fixed') {
      footerDiscount = +this.discountValue || 0;
    } else if (this.selectedDiscount === 'Percentage') {
      footerDiscount = ((this.totalPrice - rowDiscountTotal) * (+this.discountValue || 0)) / 100;
    }

    // Total discount = row discount + footer discount
    this.totalDiscount = rowDiscountTotal + footerDiscount;

    // Grand total = total price - total discount
    this.grandTotal = this.totalPrice - this.totalDiscount;
    if (this.grandTotal < 0) this.grandTotal = 0;
  }

  // format invoice_date yyyy-mm-dd
  formatDate(invoice_date: any): string {
    if (!invoice_date) return '';
    if (typeof invoice_date === 'string') return invoice_date;
    return `${invoice_date.year}-${String(invoice_date.month).padStart(2, '0')}-${String(invoice_date.day).padStart(2, '0')}`;
  }

  // Combined add / update submit (single method)
  onSubmit(event: Event, isPost: boolean = false): void {
    event.preventDefault();

    // Confirm before posting
    if (isPost) {
      const confirmPost = confirm('Are you sure you want to post this invoice? Once posted, it cannot be edited.');
      if (!confirmPost) return;
    }

    this.isLoading = true;
    this.globalErrorMessage = '';

    if (this.itemsList.length === 0) {
      this.globalErrorMessage = 'At least one item is required.';
      this.isLoading = false;
      return;
    }

    this.itemsList.forEach((_, i) => this.updateRowTotal(i));

    if (!this.isAmountValid) {
      this.isLoading = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const payload = {
      id: this.currentRecord.id,
      invoice_number: this.currentRecord.invoice_number,
      customer_id: this.currentRecord.customer_id,
      invoice_date: this.formatDate(this.currentRecord.invoice_date),
      status: isPost ? 'Posted' : this.currentRecord.status,
      description: this.currentRecord.description,
      total_quantity: this.totalQuantity,
      total_price: this.totalPrice,
      total_discount: this.totalDiscount,
      grand_total: this.grandTotal,
      items: this.itemsList.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_id: item.unit_id,
        unit_name: item.unit_name,
        price: item.price,
        discount_type: item.discountType,
        discount_value: item.discountValue,
        total_amount: item.total_amount,
      }))
    };

    const request = this.isEditMode && (this.currentRecord as any).id
      ? this.http.put(`${this.API_URL}/invoices/${(this.currentRecord as any).id}`, payload)
      : this.http.post(`${this.API_URL}/invoices`, payload);

    request.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (isPost) {
          this.currentRecord.status = 'Posted';
        }
        this.router.navigate(['/invoices']);
      },
      error: (error) => {
        this.isLoading = false;

        this.formErrors = {};
        this.stockErrors = [];

        if (error.status === 422) {
          const err = error.error;

          // Stock errors
          if (err.stock_errors && Array.isArray(err.stock_errors)) {
            this.stockErrors = err.stock_errors; // array of messages
          } 
          // Regular form validation errors
          else if (err.errors) {
            this.formErrors = err.errors;
          } 
          else if (err.message) {
            this.globalErrorMessage = err.message;
          }
        } else {
          this.globalErrorMessage = 'An unexpected error occurred. Please try again.';
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Delete a single row by index (if saved on server, call API)
  deleteItemRow(index: number): void {
    const item = this.itemsList[index];
    if (!item) return;

    if (!confirm('Are you sure you want to delete this item?')) return;

    // If the item exists in the backend (has an ID)
    if (item.id) {
      this.http.delete(`${this.API_URL}/invoices/items/${item.id}`).subscribe({
        next: (response: any) => {
          this.itemsList.splice(index, 1);
        },
        error: (error) => {
          console.error('Error deleting item:', error);
          alert('Failed to delete item. Please try again.');
        }
      });
    } else {
      // Just remove from UI if it's a new unsaved item
      this.itemsList.splice(index, 1);
    }
  }

}
