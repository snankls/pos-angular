import { Component } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { NgSelectComponent } from '@ng-select/ng-select';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../layout/breadcrumb/breadcrumb.component';

interface Product {
  id?: number;
  code: string;
  name: string;
  category_id: number | null;
  brand_id: number | null;
  cost_price: number | null;
  selling_price: number | null;
  wholesale_price?: number | null;
  tax?: number | null;
  stock: number | null;
  min_stock?: number | null;
  unit_id: number | null;
  status: string | null;
  description?: string;
  image?: File | string | null;
}

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink, CommonModule, FormsModule, NgSelectComponent],
  templateUrl: './setup.component.html'
})
export class ProductsSetupComponent {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;

  currentRecord: Product = {
    code: '',
    name: '',
    category_id: null,
    brand_id: null,
    cost_price: null,
    selling_price: null,
    wholesale_price: null,
    tax: null,
    stock: null,
    min_stock: null,
    unit_id: null,
    status: 'Active',
    description: '',
    image: null
  };

  isEditMode = false;
  isLoading = false;
  formErrors: any = {};
  globalErrorMessage: string = '';
  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;

  categories: any[] = [];
  brands: any[] = [];
  units: any[] = [];
  status: { id: string; name: string }[] = [];

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.fetchCategories();
    this.fetchBrands();
    this.fetchUnits();
    this.fetchStatus();

    // check if we are editing
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProduct(+id);
      }
    });
  }

  clearError(field: string): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  fetchCategories(): void {
    this.http.get<any[]>(`${this.API_URL}/categories`).subscribe({
      next: (res) => this.categories = res,
      error: (err) => console.error('Failed to fetch categories:', err)
    });
  }

  fetchBrands(): void {
    this.http.get<any[]>(`${this.API_URL}/brands`).subscribe({
      next: (res) => this.brands = res,
      error: (err) => console.error('Failed to fetch brands:', err)
    });
  }

  fetchUnits(): void {
    this.http.get<any[]>(`${this.API_URL}/units`).subscribe({
      next: (res) => this.units = res,
      error: (err) => console.error('Failed to fetch units:', err)
    });
  }

  fetchStatus(): void {
    this.http.get<any>(`${this.API_URL}/status`).subscribe({
      next: (res) => {
        this.status = Object.entries(res).map(([key, value]) => ({ id: key, name: value as string }));
      },
      error: (err) => console.error('Failed to fetch status:', err)
    });
  }

  loadProduct(id: number): void {
    this.isLoading = true;
    this.http.get<Product>(`${this.API_URL}/product/${id}`).subscribe({
      next: (product) => {
        this.currentRecord = { ...this.currentRecord, ...product };
        if (product.image) {
          this.imagePreview = `${this.IMAGE_URL}/uploads/products/${product.image}`;
        }
        this.isEditMode = true;
      },
      error: (err: HttpErrorResponse) => {
        this.globalErrorMessage = err.status === 404 ? 'Product not found' : 'Failed to load product details';
      },
      complete: () => this.isLoading = false
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result;
      reader.readAsDataURL(this.selectedFile);
    }
  }

  private buildFormData(): FormData {
    const formData = new FormData();
    for (const [key, value] of Object.entries(this.currentRecord)) {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value as any);
      }
    }
    if (this.selectedFile) {
      formData.append('product_image', this.selectedFile);
    }
    return formData;
  }

  /** ✅ Add new product */
  onSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
    this.formErrors = {};
    this.globalErrorMessage = '';

    const formData = this.buildFormData();

    this.http.post(`${this.API_URL}/products`, formData).subscribe({
      next: () => {
        this.router.navigate(['/products']);
      },
      error: (err) => {
        this.isLoading = false;
        this.formErrors = err.error?.errors || {};
        this.globalErrorMessage = 'Please fix errors before submitting.';
      },
      complete: () => this.isLoading = false
    });
  }

  /** ✅ Update existing product */
  updateRecord(event: Event): void {
    event.preventDefault();
    if (!this.currentRecord.id) return;

    this.isLoading = true;
    this.formErrors = {};
    this.globalErrorMessage = '';

    const formData = this.buildFormData();

    this.http.post(`${this.API_URL}/products/${this.currentRecord.id}`, formData).subscribe({
      // if backend supports PUT instead of POST, use this:
      // this.http.put(`${this.API_URL}/products/${this.currentRecord.id}`, formData)
      next: () => {
        this.router.navigate(['/products']);
      },
      error: (err) => {
        this.isLoading = false;
        this.formErrors = err.error?.errors || {};
        this.globalErrorMessage = 'Please fix errors before submitting.';
      },
      complete: () => this.isLoading = false
    });
  }
}
