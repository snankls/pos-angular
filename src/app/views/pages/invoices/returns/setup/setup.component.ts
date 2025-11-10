import { Component } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ColumnMode, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../layout/breadcrumb/breadcrumb.component';

interface Invoice {
  id?: number | null;
  invoice_id?: number | null;
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
    invoice_id: null,
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
  invoice_id: any[] = [];
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
    unit_id: '',
    unit_name: '',
    price: 0,
    discountType: 'Fixed', // ✅ default
    discountValue: 0,      // ✅ default
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
    this.fetchCurrency();
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
    this.currentRecord.return_date = this.getCurrentDateStruct();
  }

  fetchInvoiceNumber(): void {
    this.http.get<any[]>(`${this.API_URL}/active/invoice-numbers`).subscribe({
      next: (response) => {
        this.invoice_id = response.map((invoice_id) => ({
          ...invoice_id,
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

  private calculateTotalQuantity(): number {
    return this.itemsList.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }

  private calculateTotalPrice(): number {
    return this.itemsList.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity) || 0), 0);
  }

  private calculateTotalDiscount(): number {
    return this.itemsList.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const discountVal = Number(item.discountValue) || 0;
      
      if (item.discountType === 'Percentage') {
        return sum + ((price * qty * discountVal) / 100);
      } else {
        return sum + discountVal;
      }
    }, 0);
  }

  private calculateGrandTotal(): number {
    return this.calculateTotalPrice() - this.calculateTotalDiscount();
  }

  getEmptyItem() {
    return {
      id: null,
      product_id: null,
      product_label: '',
      quantity: 0,
      unit_id: null,
      unit_name: '',
      price: 0,
      discountType: 'Fixed',
      discountValue: 0,
      total_amount: 0
    };
  }

  onInvoiceSelect(event: any) {
    const invoiceId = typeof event === 'object' ? event.id : event;
    if (!invoiceId) return;

    // Only prefill customer and items for a new return
    if (!this.isEditMode) {
      this.isLoading = true;
      this.http.get<any>(`${this.API_URL}/invoices/${invoiceId}`).subscribe({
        next: (res) => {
          console.log(res);
          // Prefill customer info
          this.currentRecord.customer_id = res.customer_id;
          this.currentRecord.customer_name = res.customer_name;

          // Prefill itemsList from invoice details
          this.itemsList = (res.details || []).map((item: any) => {
          const product = this.products.find(p => p.id === item.product_id);

          return {
            id: null,
            product_id: item.product_id,
            product_label: product ? `${product.name} (${product.sku ?? ''})` : `${item.product_name ?? ''} (${item.product_sku ?? ''})`,
            quantity: Number(item.quantity) || 0,
            unit_id: item.unit_id ?? (product ? product.unit_id : null),
            unit_name: item.unit_name ?? (product ? product.unit_name : ''),
            price: Number(item.price) || Number(item.sale_price) || (product ? product.unit_price : 0),
            discountType: item.discount_type ?? 'Fixed',
            discountValue: Number(item.discount_value) || 0,
            total_amount: Number(item.total_amount) || ((Number(item.price) || 0) * (Number(item.quantity) || 0)),
          };
        });

          // If no items, add an empty one
          if (this.itemsList.length === 0) {
            this.itemsList = [this.getEmptyItem()];
          }

          // Recalculate totals
          this.itemsList.forEach((_, i) => this.updateRowTotal(i));
          this.updateTotals();

          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to fetch invoice details:', err);
          this.isLoading = false;
        }
      });
    }
  }

  loadReturns(returnId: number) {
    this.isLoading = true;
    this.http.get<any>(`${this.API_URL}/invoice/returns/${returnId}`).subscribe({
      next: (response) => {
        // Fill currentRecord from invoice_returns
        this.currentRecord = {
          ...this.currentRecord,
          ...response,
        } as Invoice;

        // Fill customer info and status from return record
        this.currentRecord.customer_id = response.customer_id;
        this.currentRecord.customer_name = response.customer_name;
        this.currentRecord.status = response.status;

        // Normalize itemsList from return details
        this.itemsList = (response.details || []).map((item: any) => {
          const product = this.products.find(p => p.id === item.product_id);
          return {
            id: item.id ?? null,
            product_id: item.product_id ?? null,
            product_label: product ? `${product.name} (${product.sku ?? ''})` : `${item.product_name ?? ''} (${item.product_sku ?? ''})`,
            quantity: Number(item.quantity) || 0,
            unit_id: item.unit_id ?? (product ? product.unit_id : null),
            unit_name: item.unit_name ?? (product ? product.unit_name : ''),
            price: Number(item.sale_price) || (product ? product.unit_price : 0),
            discountType: item.discount_type ?? 'Fixed',
            discountValue: Number(item.discount_value) || 0,
            total_amount: Number(item.total) || 0,
          };
        });

        // If no items, add an empty one
        if (this.itemsList.length === 0) {
          this.itemsList = [this.getEmptyItem()];
        }

        // Recalculate totals
        this.itemsList.forEach((_, i) => this.updateRowTotal(i));
        this.updateTotals();
        
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Failed to load return record:', error);
      }
    });
  }

  resetForm(): void {
    const returnDate = this.currentRecord?.return_date || this.getCurrentDateStruct();
    
    this.currentRecord = {
      customer_id: null,
      customer_name: null,
      invoice_id: null,
      return_date: returnDate,
      status: 'Active',
    };

    this.itemsList = [{
      id: null,
      product_id: null,
      quantity: 0,
      unit_id: '',
      unit_name: '',
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
    this.currentRecord.id = null;
  }

  // Helper method to get current date as NgbDateStruct
  private getCurrentDateStruct(): NgbDateStruct {
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
  }

  updateRowTotal(index: number) {
    const item = this.itemsList[index];
    if (!item) return;

    // Coerce to numbers
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

    // Update summary totals
    this.updateTotals();
  }

  updateAvailableProducts() {
    this.itemsList.forEach((item, index) => {
      item.availableProducts = this.getAvailableProducts(index);
    });
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
    this.totalQuantity = this.calculateTotalQuantity();
    this.totalPrice = this.calculateTotalPrice();
    this.totalDiscount = this.calculateTotalDiscount();
    this.grandTotal = this.calculateGrandTotal();

    let rowDiscountTotal = 0;

    // Calculate row discounts (in case you need to show breakdown)
    this.itemsList.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const discountVal = Number(item.discountValue ?? item.discount_value) || 0;

      if (item.discountType === 'Fixed') {
        rowDiscountTotal += discountVal;
      } else if (item.discountType === 'Percentage') {
        const rowTotal = qty * price;
        rowDiscountTotal += (rowTotal * discountVal) / 100;
      }
    });

    // Apply footer discount
    let footerDiscount = 0;
    if (this.selectedDiscount === 'Fixed') {
      footerDiscount = Number(this.discountValue) || 0;
    } else if (this.selectedDiscount === 'Percentage') {
      footerDiscount = (this.totalPrice * (Number(this.discountValue) || 0)) / 100;
    }

    // Sum up all discounts
    this.totalDiscount = rowDiscountTotal + footerDiscount;

    // Final grand total
    this.grandTotal = Number(this.totalPrice) - Number(this.totalDiscount);
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
    this.globalErrorMessage = '';

    // Filter valid items: must have product_id & quantity > 0
    const validItems = this.itemsList.filter(item => item.product_id && item.quantity > 0);

    if (validItems.length === 0) {
        this.globalErrorMessage = 'At least one valid item with product and quantity is required.';
        this.isLoading = false;
        return;
    }

    // Ensure return_date is always set
    const returnDate = this.formatDate(this.currentRecord.return_date || this.getCurrentDateStruct());

    // Build payload
    const payload: any = {
        ...(this.isEditMode ? { id: this.currentRecord.id } : {}),
        id: this.currentRecord.id,
        invoice_id: this.currentRecord.invoice_id,
        customer_id: this.currentRecord.customer_id,
        return_date: returnDate,
        status: this.currentRecord.status || 'Active',
        total_quantity: this.totalQuantity,
        total_price: this.totalPrice,
        total_discount: this.totalDiscount,
        grand_total: this.grandTotal,
        items: validItems.map(item => ({
            id: item.id ?? null,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_id: item.unit_id ?? null,
            unit_name: item.unit_name,
            price: item.price,
            discount_type: item.discountType || 'Fixed',
            discount_value: item.discountValue || 0,
            total_amount: item.total_amount,
        }))
    };

    // Determine POST or PUT
    const request$ = this.isEditMode
        ? this.http.put(`${this.API_URL}/invoice/returns/${this.currentRecord.id}`, payload)
        : this.http.post(`${this.API_URL}/invoice/returns`, payload);

    request$.subscribe({
        next: (response: any) => {
            this.isLoading = false;
            this.router.navigate(['/invoice/returns']);
        },
        error: (error) => {
            this.isLoading = false;
            this.formErrors = error.error?.errors || {};
            this.globalErrorMessage = error.error?.message || 'Please fill all required fields correctly.';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
    });
  }

  // Delete a single row by index (if saved on server, call API)
  deleteItemRow(index: number): void {
    const item = this.itemsList[index];
    if (!item) return;

    if (!confirm('Are you sure you want to delete this item?')) return;

    // If the item exists in the backend (has an ID)
    if (item.id) {
      this.http.delete(`${this.API_URL}/invoice/returns/items/${item.id}`).subscribe({
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
