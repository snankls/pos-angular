import { Component } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ColumnMode, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../layout/breadcrumb/breadcrumb.component';

interface Invoice {
  id?: number | null;
  invoice_numbers?: number | null;
  customer_id?: string | null;
  customer_name?: string | null;
  return_date?: NgbDateStruct | string | null;
  status?: string | null;
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
    SweetAlert2Module
  ],
  templateUrl: './setup.component.html'
})
export class ReturnsSetupComponent {
  private API_URL = environment.API_URL;

  currentRecord: Invoice = {
    customer_id: null,
    customer_name: null,
    invoice_numbers: null,
    return_date: '',
    status: 'Active',
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
  invoice_numbers: any[] = [];
  products: any[] = [];
  status: { id: string; name: string }[] = [];
  discount: string[] = ['Fixed', 'Percentage'];
  currencySign: string = '';

  // default values
  selectedDiscount: string = '';
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
    discountType: '',
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
    this.fetchInvoiceNumber();
    this.fetchProducts();
    this.fetchCurrencySign();
    this.fetchStatus();
    this.setDefaultIssueDate();

    this.discount = ['Fixed', 'Percentage'];

    // handle edit route
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadReturns(+id);
      }
    });
  }

  setDefaultIssueDate(): void {
    const today = new Date();
    this.currentRecord.return_date = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
  }

  fetchInvoiceNumber(): void {
    this.http.get<any[]>(`${this.API_URL}/active/invoice-numbers`).subscribe({
      next: (response) => {
        this.invoice_numbers = response.map((invoice_numbers) => ({
          ...invoice_numbers,
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

  fetchCurrencySign(): void {
    this.http.get<any>(`${this.API_URL}/settings`).subscribe({
      next: (response) => {
        console.log(response)
        this.currencySign = response.currency_sign.data_value || '';
      },
      error: (err) => console.error('Failed to fetch currency sign:', err)
    });
  }

  fetchStatus(): void {
    this.http.get<any>(`${this.API_URL}/status`).subscribe({
      next: (response) => {
        this.status = Object.entries(response)
          .filter(([key]) => key !== '')
          .map(([key, value]) => ({ id: String(key), name: value as string }));
      },
      error: (error) => console.error('Failed to fetch status:', error)
    });
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

  onInvoiceSelect(event: any) {
    // if event is an object, extract id
    const invoiceId = typeof event === 'object' ? event.id : event;

    if (invoiceId) {
      this.loadReturns(invoiceId);
    }
  }

  loadReturns(id: number) {
    this.isLoading = true;
    this.http.get<any>(`${this.API_URL}/invoices/${id}`).subscribe({
      next: (response) => {
        this.currentRecord = {
          ...this.currentRecord,
          ...response,

          // return_date: this.parseDateFromBackend(
          //   typeof response.return_date === 'string' ? response.return_date : undefined
          // ),
        } as Invoice;

        this.itemsList = (response.details || []).map((item: any) => ({
          id: item.id ?? null,
          product_id: item.product_id ?? null,
          quantity: item.quantity ?? 0,
          unit_id: item.unit_id ?? null,
          unit_name: item.unit_name ?? '',
          price: item.sale_price ?? 0,
          discountType: item.discount_type ?? '',
          discountValue: item.discount_value ?? 0,
          total_amount: item.total ?? 0
        }));

        // recalc totals
        this.itemsList.forEach((_, i) => this.updateRowTotal(i));
        this.updateTotals();

        // fill footer summary
        this.totalQuantity = response.total_quantity ?? 0;
        this.totalPrice = response.total_price ?? 0;
        this.totalDiscount = response.total_discount ?? 0;
        this.grandTotal = response.grand_total ?? 0;

        this.isEditMode = true;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Failed to load invoice:', error);
      }
    });
  }

  resetForm(): void {
    const returnDate = this.currentRecord?.return_date || '';
    
    this.currentRecord = {
      customer_id: null,
      invoice_numbers: null,
      return_date: returnDate,
      status: 'Active',
    };

    this.itemsList = [{
      id: null,
      product_id: null,
      quantity: 0,
      unit: '',
      price: 0,
      discountType: '',
      discountValue: 0,
      total_amount: 0,
    }];

    // Reset summary values
    this.selectedDiscount = '';
    this.discountValue = 0;
    this.totalQuantity = 0;
    this.totalPrice = 0;
    this.totalDiscount = 0;
    this.grandTotal = 0;

    this.isEditMode = false;
  }

  updateRowTotal(index: number) {
    const item = this.itemsList[index];
    if (!item) return;

    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const discountValueRaw = Number(item.discountValue) || 0;
    let discountAmount = 0;

    if (item.discountType === 'Percentage') {
      discountAmount = (price * qty * discountValueRaw) / 100;
    } else {
      // Fixed
      discountAmount = discountValueRaw;
    }

    const total = (price * qty) - discountAmount;
    item.total_amount = Math.max(0, Math.round((total + Number.EPSILON) * 100) / 100);

    // recalc summary after updating row
    this.updateTotals();
  }

  updateAvailableProducts() {
    this.itemsList.forEach((item, index) => {
      item.availableProducts = this.getAvailableProducts(index);
    });
  }

  // Add this method to check if a product is available
  // isProductAvailable(productId: any, currentIndex: number): boolean {
  //   if (!productId) return true;
    
  //   return !this.itemsList.some((item, i) => 
  //     i !== currentIndex && item.product_id != null && item.product_id == productId
  //   );
  // }

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
    // Sum quantity and gross total before discount
    this.totalQuantity = this.itemsList.reduce((sum, item) => sum + (+item.quantity || 0), 0);
    this.totalPrice = this.itemsList.reduce((sum, item) => sum + (+item.total_amount || 0), 0);

    let rowDiscountTotal = 0;

    // Calculate row discounts
    this.itemsList.forEach(item => {
      if (item.discountType === 'Fixed') {
        rowDiscountTotal += +item.discountValue || 0;
      } else if (item.discountType === 'Percentage') {
        const rowTotal = (+item.quantity || 0) * (+item.price || 0);
        rowDiscountTotal += (rowTotal * (+item.discountValue || 0)) / 100;
      }
    });

    // Apply footer discount
    let footerDiscount = 0;
    if (this.selectedDiscount === 'Fixed') {
      footerDiscount = +this.discountValue || 0;
    } else if (this.selectedDiscount === 'Percentage') {
      footerDiscount = (this.totalPrice * (+this.discountValue || 0)) / 100;
    }

    // Sum up all discounts
    this.totalDiscount = rowDiscountTotal + footerDiscount;

    // Final grand total
    this.grandTotal = this.totalPrice - this.totalDiscount;
    if (this.grandTotal < 0) this.grandTotal = 0;
  }

  // format return_date yyyy-mm-dd
  formatDate(return_date: any): string {
    if (!return_date) return '';
    if (typeof return_date === 'string') return return_date;
    return `${return_date.year}-${String(return_date.month).padStart(2, '0')}-${String(return_date.day).padStart(2, '0')}`;
  }

  // Combined add / update submit (single method)
  onSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;

    // final validation (optional) -> ensure items exist etc.
    if (this.itemsList.length === 0) {
      this.globalErrorMessage = 'At least one item is required.';
      this.isLoading = false;
      return;
    }

    // Ensure latest totals are calculated
    this.itemsList.forEach((_, i) => this.updateRowTotal(i));

    if (!this.isAmountValid) {
      this.globalErrorMessage = 'Total amount must exactly match the loan amount.';
      this.isLoading = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const payload = {
      customer_id: this.currentRecord.customer_id,
      return_date: this.formatDate(this.currentRecord.return_date),
      status: this.currentRecord.status,

      // Add missing summary fields
      total_quantity: this.totalQuantity,
      total_price: this.totalPrice,
      total_discount: this.totalDiscount,
      grand_total: this.grandTotal,

      // Map items
      items: this.itemsList.map(item => ({
        id: item.id ?? null,
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

    const request$ = this.isEditMode && (this.currentRecord as any).id
      ? this.http.put(`${this.API_URL}/invoice-returns/${(this.currentRecord as any).id}`, payload)
      : this.http.post(`${this.API_URL}/invoice-returns`, payload);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        //this.router.navigate(['/invoices/returns']);
      },
      error: (error) => {
        this.isLoading = false;
        this.formErrors = error.error?.errors || {};

        // If Laravel returned a custom error message (like stock issue), show it
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
  deleteItemRow(index: number): void {
    const item = this.itemsList[index];
    if (!item) return;

    if (!confirm('Are you sure you want to delete this item?')) return;

    // If the item exists in the backend (has an ID)
    if (item.id) {
      this.http.delete(`${this.API_URL}/invoice-returns/items/${item.id}`).subscribe({
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
