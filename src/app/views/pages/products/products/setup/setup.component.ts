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
  sku: string;
  name: string;
  category_id: number | null;
  brand_id: number | null;
  unit_id: number | null;
  cost_price: number | null;
  sale_price: number | null;
  stock: number | null;
  status: string | null;
  description?: string;
  images?: {
    image_name: string;
    image_path?: string;
  } | null;
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
    sku: '',
    name: '',
    category_id: null,
    brand_id: null,
    unit_id: null,
    cost_price: null,
    sale_price: null,
    stock: null,
    status: 'Active',
    description: '',
    images: null
  };

  isEditMode = false;
  isLoading = false;
  formErrors: any = {};
  globalErrorMessage: string = '';
  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  isImageDeleted = false;

  selected: { id: number; [key: string]: any }[] = [];
  rows: { id: number; [key: string]: any }[] = [];
  temp: { id: number; [key: string]: any }[] = [];
  
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
    this.http.get<any[]>(`${this.API_URL}/active/categories`).subscribe({
      next: (res) => this.categories = res,
      error: (err) => console.error('Failed to fetch categories:', err)
    });
  }

  fetchBrands(): void {
    this.http.get<any[]>(`${this.API_URL}/active/brands`).subscribe({
      next: (res) => this.brands = res,
      error: (err) => console.error('Failed to fetch brands:', err)
    });
  }

  fetchUnits(): void {
    this.http.get<any[]>(`${this.API_URL}/active/units`).subscribe({
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
    this.http.get<Product>(`${this.API_URL}/products/${id}`).subscribe({
      next: (product: any) => {
        this.currentRecord = { ...this.currentRecord, ...product };

        // ✅ Fix image handling
        if (product.images && product.images.image_name) {
          this.imagePreview = `${this.IMAGE_URL}/uploads/products/${product.images.image_name}`;
        }

        this.isEditMode = true;
      },
      error: (err: HttpErrorResponse) => {
        this.globalErrorMessage = err.status === 404
          ? 'Product not found'
          : 'Failed to load product details';
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

  // Remove Image Function
  removeImage(): void {
    this.imagePreview = null;
    this.currentRecord.images = null;
    this.selectedFile = null;
    this.isImageDeleted = true;
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
    
    const formData = new FormData();

    // Only append primitive values (string, number, boolean)
    for (const [key, value] of Object.entries(this.currentRecord)) {
      if (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        typeof value !== 'object' // 👈 skip objects like "images"
      ) {
        formData.append(key, value as any);
      }
    }

    // If a new file is selected
    if (this.selectedFile) {
      formData.append('product_image', this.selectedFile);
    }

    // If image was deleted
    if (this.isImageDeleted) {
      formData.append('isImageDeleted', '1');
    }

    const request$ = this.currentRecord.id
      ? this.http.post(`${this.API_URL}/products/${this.currentRecord.id}?_method=PUT`, formData)
      : this.http.post(`${this.API_URL}/products`, formData);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/products']);
      },
      error: (error) => {
        this.isLoading = false;
        this.formErrors = error.error?.errors || {};
        this.globalErrorMessage = 'Please check the highlighted fields.';
      }
    });
  }

}
  