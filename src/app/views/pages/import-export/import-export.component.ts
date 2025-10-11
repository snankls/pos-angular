import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { NgSelectComponent } from '@ng-select/ng-select';
import { environment } from '../../../environments/environment';
import { BreadcrumbComponent } from '../../layout/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink, CommonModule, FormsModule, NgSelectComponent],
  templateUrl: './import-export.component.html'
})
export class ImportExportComponent implements OnInit {
  private API_URL = environment.API_URL;
  private DOWNLOAD_CSV_URL = environment.IMAGE_URL;

  selectedFile: File | null = null;
  isLoading = false;
  formErrors: any = {};
  globalErrorMessage = '';
  successMessage = '';
  selectedDoc: string = '';
  modalTitle: string = '';
  modalContent = '';

  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  activeModal: NgbModalRef | null = null;

  constructor(private http: HttpClient, private modalService: NgbModal) {}

  ngOnInit(): void {}

  // 📦 Download CSV Template
  downloadCSV(type: string): void {
    const apiUrl = `${this.DOWNLOAD_CSV_URL}/download/${type}`;
    const link = document.createElement('a');
    link.href = apiUrl;
    link.download = `${type}.csv`;
    link.click();
  }

  // 📂 File select handler
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  // 📘 Show documentation modal
  documentationCSV(type: string): void {
    this.selectedDoc = type;
    this.modalTitle = `${type.charAt(0).toUpperCase() + type.slice(1)} Documentation`;
    this.activeModal = this.modalService.open(this.modalTemplate, { size: 'lg' });
  }
//   documentationCSV(type: string): void {
//     const docs: any = {
//       products: {
//         title: 'Products CSV Format',
//         content: `
//           <p>To import <strong>products</strong>, create a CSV file with the following columns:</p>
//           <ul>
//             <li><code>sku</code> – Unique product code (required)</li>
//             <li><code>name</code> – Product name (required)</li>
//             <li><code>category_id</code> – Category ID from your categories table</li>
//             <li><code>unit_id</code> – Unit ID from your units table</li>
//             <li><code>cost_price</code> – Purchase price</li>
//             <li><code>sale_price</code> – Selling price</li>
//             <li><code>stock</code> – Quantity in stock</li>
//             <li><code>description</code> – Optional product description</li>
//           </ul>
//           <p>Example:</p>
//           <pre>sku,name,category_id,unit_id,cost_price,sale_price,stock,description
// PR-001,Pepsi 500ml,3,1,40,60,100,Cold drink</pre>
//         `
//       },
//       categories: {
//         title: 'Categories CSV Format',
//         content: `
//           <p>Use this format for <strong>categories</strong>:</p>
//           <ul><li><code>name</code> – Category name (required)</li></ul>
//           <pre>name
// Beverages</pre>
//         `
//       },
//       brands: {
//         title: 'Brands CSV Format',
//         content: `
//           <p>Use this format for <strong>brands</strong>:</p>
//           <ul><li><code>name</code> – Brand name (required)</li></ul>
//           <pre>name
// Nestle</pre>
//         `
//       },
//       units: {
//         title: 'Units CSV Format',
//         content: `
//           <p>Use this format for <strong>units</strong>:</p>
//           <ul><li><code>name</code> – Unit name (required)</li></ul>
//           <pre>name
// Bottle</pre>
//         `
//       },
//       stocks: {
//         title: 'Stocks CSV Format',
//         content: `
//           <p>Use this format for <strong>stocks</strong>:</p>
//           <ul>
//             <li><code>product_id</code> – Product ID</li>
//             <li><code>quantity</code> – Stock quantity</li>
//             <li><code>warehouse_id</code> – Warehouse ID (optional)</li>
//           </ul>
//           <pre>product_id,quantity,warehouse_id
// 1,50,2</pre>
//         `
//       },
//       customers: {
//         title: 'Customers CSV Format',
//         content: `
//           <p>To import <strong>customers</strong>, use these columns:</p>
//           <ul>
//             <li><code>code</code> – Unique customer code (required)</li>
//             <li><code>name</code> – Full name</li>
//             <li><code>cnic</code> – National ID</li>
//             <li><code>email_address</code></li>
//             <li><code>phone_number</code></li>
//             <li><code>mobile_number</code></li>
//             <li><code>whatsapp</code></li>
//             <li><code>city_id</code></li>
//             <li><code>credit_balance</code></li>
//             <li><code>credit_limit</code></li>
//             <li><code>address</code></li>
//           </ul>
//           <pre>code,name,cnic,email_address,phone_number,mobile_number,whatsapp,city_id,credit_balance,credit_limit,address
// CUST-01,Ahmad,35202-1234567-8,ahmad@gmail.com,061-1234567,0301-1234567,0301-1234567,1,5000,15000,Gujrat</pre>
//         `
//       },
//       banks: {
//         title: 'Banks CSV Format',
//         content: `
//           <p>To import <strong>banks</strong>:</p>
//           <ul>
//             <li><code>name</code> – Bank name (required)</li>
//             <li><code>branch_name</code> – Branch name</li>
//             <li><code>account_number</code></li>
//             <li><code>iban</code></li>
//             <li><code>balance</code></li>
//           </ul>
//           <pre>name,branch_name,account_number,iban,balance
// HBL,Main Branch,123456789,PK12HBL123456789000,50000</pre>
//         `
//       },
//       cities: {
//         title: 'Cities CSV Format',
//         content: `
//           <p>To import <strong>cities</strong>:</p>
//           <ul><li><code>name</code> – City name (required)</li></ul>
//           <pre>name
// Lahore</pre>
//         `
//       }
//     };

//     // 🧠 Assign modal data dynamically
//     this.modalTitle = docs[type]?.title || 'Import CSV Documentation';
//     this.modalContent = docs[type]?.content || 'No documentation available for this type.';

//     this.activeModal = this.modalService.open(this.modalTemplate, {
//       size: 'lg',
//       ariaLabelledBy: 'exampleModalLabel',
//     });
//   }

  // 🧾 Submit import form
  onSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
    this.formErrors = {};
    this.globalErrorMessage = '';
    this.successMessage = '';

    if (!this.selectedFile) {
      this.isLoading = false;
      this.globalErrorMessage = 'Please select a CSV file before submitting.';
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post(`${this.API_URL}/imports`, formData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = response.message || 'File imported successfully!';
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 422 && error.error.errors) {
          this.formErrors = error.error.errors;
        } else {
          this.globalErrorMessage = error.error.message || 'An unexpected error occurred.';
        }
      }
    });
  }
}
