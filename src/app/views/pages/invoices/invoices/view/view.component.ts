import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { NgbDropdownModule, NgbNavContent, NgbNavModule, NgbModal, NgbModalRef, NgbTooltip, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { BreadcrumbComponent } from '../../../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../../../environments/environment';

interface Invoice {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_address?: string;
  customer_email?: string;
  customer_whatsapp?: string;
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
    NgbTooltip,
    MyNgSelectComponent,
    FormsModule
  ],
  templateUrl: './view.component.html'
})
export class InvoicesViewComponent implements OnInit {
  private API_URL = environment.API_URL;

  formErrors: any = {};
  currentRecord: Invoice | null = null;
  itemsList: InvoiceDetail[] = [];
  isLoading = false;
  errorMessage = '';
  currencySign: string = '';
  basicModalCloseResult: string = '';
  discount: string[] = ['Email', 'WhatsApp'];
  selectedTypes: string[] = [];
  emailAddress: string = '';
  whatsappNumber: string = '';

  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  activeModal: NgbModalRef | null = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.fetchCurrencySign();
    
    // Invoice Send List
    this.discount = ['Email', 'WhatsApp'];

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadInvoice(+id);
      }
    });
  }

  clearError(field: string): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
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

  openModal(): void {
    this.activeModal = this.modalService.open(this.modalTemplate, { ariaLabelledBy: 'exampleModalLabel' });
  }
  // openModal(content: TemplateRef<any>) {
  //   this.modalService.open(content, { size: 'md' }).result.then((result) => {
  //     this.basicModalCloseResult = "Modal closed: " + result;
  //   }).catch((res) => {});
  // }

  loadInvoice(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.itemsList = [];

    this.http.get<Invoice>(`${this.API_URL}/invoices/${id}`).subscribe({
      next: (response) => {
        this.currentRecord = response;
        this.itemsList = response.details || [];
        
        // Auto-fill email & WhatsApp from currentRecord
        this.emailAddress = this.currentRecord.customer_email || '';
        this.whatsappNumber = this.currentRecord.customer_whatsapp || '';
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

  saveInvoiceSend(modal: any): void {
    this.formErrors = {};

    if (this.selectedTypes.includes('Email') && !this.emailAddress) {
      this.formErrors.email_address = ['Email address is required'];
      return;
    }
    if (this.selectedTypes.includes('WhatsApp') && !this.whatsappNumber) {
      this.formErrors.whatsapp = ['WhatsApp number is required'];
      return;
    }

    const payload = {
      invoice_id: this.currentRecord?.id,
      types: this.selectedTypes,
      email: this.emailAddress,
      whatsapp: this.whatsappNumber
    };

    this.http.post(`${this.API_URL}/invoices/send`, payload).subscribe({
      next: (res: any) => {
        console.log('Send response:', res);
        modal.close('Invoice sent');
      },
      error: (err) => {
        console.error('Error sending invoice:', err);
      }
    });
  }

}
