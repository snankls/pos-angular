import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ColumnMode, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../layout/breadcrumb/breadcrumb.component';

interface SearchModel {
  employee_id: number[] | null;
}

interface Employee {
  id: number;
  full_name: string;
  code: string;
  employee_label?: string;
  image_name: string;
}

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxDatatableModule,
    NgSelectModule,
    BreadcrumbComponent
  ],
  templateUrl: './cards.component.html'
})
export class ReportsCardsComponent implements OnInit {
  private readonly API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;
  private readonly LIVE_URL = environment.LIVE_URL;

  monthYearOptions: { label: string; value: string }[] = [];
  selectedMonthYear: string | null = null;
  employees: Employee[] = [];
  imagePreview: string | ArrayBuffer | null = null;
  rows: any[] = [];
  loadingIndicator = false;
  ColumnMode = ColumnMode;

  searchModel: SearchModel = {
    employee_id: null
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchEmployees();
  }

  fetchEmployees(): void {
    this.http.get<Employee[]>(`${this.API_URL}/active/employees`).subscribe({
      next: (response) => {
        this.employees = response.map(emp => ({
          ...emp,
          employee_label: `${emp.full_name} (${emp.code})`
        }));
      },
      error: (error) => console.error('Failed to fetch employees:', error)
    });
  }
  
  onAdvancedSearch(event?: Event): void {
    if (event) event.preventDefault();
    
    this.loadingIndicator = true;

    // Create URLSearchParams for proper array serialization
    const params = new URLSearchParams();
    
    if (this.searchModel.employee_id && this.searchModel.employee_id.length > 0) {
      this.searchModel.employee_id.forEach(id => {
        params.append('employee_id[]', id.toString());
      });
    }

    this.http.get<any[]>(`${this.API_URL}/reports/employees/cards?${params.toString()}`).subscribe({
      next: (response) => {
        this.rows = response.map(employee => ({
          ...employee,
          employee_image: employee.image_name 
            ? `${this.IMAGE_URL}/uploads/employees/${employee.image_url}`
            : 'images/placeholder.png'
        }));
        this.loadingIndicator = false;
      },
      error: (error) => {
        console.error('Search failed:', error);
        this.loadingIndicator = false;
      }
    });
  }
  
  resetSearch(): void {
    this.searchModel = {
      employee_id: null
    };
    this.onAdvancedSearch();
  }

  downloadFile(type: 'excel' | 'pdf'): void {
    const params = new URLSearchParams();

    (this.searchModel?.employee_id ?? []).forEach(id => {
      params.append('employee_id[]', id.toString());
    });

    const url = `${this.LIVE_URL}/export/employees/cards/${type}?${params.toString()}`;
    console.log('Download URL:', url);

    window.open(url, '_blank');
  }
  
}