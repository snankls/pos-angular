import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ColumnMode, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../layout/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-salaries',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxDatatableModule,
    NgSelectModule,
    BreadcrumbComponent
  ],
  templateUrl: './salaries.component.html'
})
export class ReportsSalariesComponent {
  private API_URL = environment.API_URL;
  private LIVE_URL = environment.LIVE_URL;
  
  monthYearOptions: { label: string; value: string }[] = [];
  selectedMonthYear: string | null = null;
  employees: any[] = [];
  rows: any[] = [];
  loadingIndicator = false;
  ColumnMode = ColumnMode;

  searchModel = {
    employee_id: null,
    salary_start: null,
    salary_end: null
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchEmployees();
    //this.onAdvancedSearch();
    this.getMonth2();
  }

  fetchEmployees(): void {
    this.http.get<any[]>(`${this.API_URL}/active/employees`).subscribe({
      next: (response) => {
        this.employees = response.map(emp => ({
          ...emp,
          employee_label: `${emp.full_name} (${emp.code})`
        }));
      },
      error: (error) => console.error('Failed to fetch employees:', error)
    });
  }

  // Update onMonthSelect
  onMonthSelect(event: any) {
    this.selectedMonthYear = event?.id || null;
  }
  
  onAdvancedSearch(event?: Event): void {
    if (event) event.preventDefault();
    
    this.loadingIndicator = true;
  
    const params: any = {};
    if (this.searchModel.employee_id) params.employee_id = this.searchModel.employee_id;
    if (this.searchModel.salary_start) params.salary_start = this.searchModel.salary_start;
    if (this.searchModel.salary_end) params.salary_end = this.searchModel.salary_end;
  
    this.http.get<any[]>(`${this.API_URL}/reports/salaries`, { params }).subscribe({
      next: (response) => {
        this.rows = response;
        this.loadingIndicator = false;
      },
      error: () => {
        this.loadingIndicator = false;
      }
    });
  }

  getMonth2() {
    this.http.get<{ label: string; value: string }[]>(`${this.API_URL}/get-months`)
      .subscribe((res) => {
        this.monthYearOptions = res;
      });
  }

  generateMonthYearList(startDate: Date, endDate: Date): { id: string, label: string }[] {
    const options: { id: string, label: string }[] = [];

    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (current <= endDate) {
      const year = current.getFullYear();
      const month = current.getMonth() + 1;

      const id = `${year}-${month.toString().padStart(2, '0')}`;
      const label = `${current.toLocaleString('default', { month: 'long' })} ${year}`;

      options.push({ id, label });

      current.setMonth(current.getMonth() + 1);
    }

    return options;
  }
  
  resetSearch(): void {
    this.onAdvancedSearch();

    this.searchModel = {
      employee_id: null,
      salary_start: null,
      salary_end: null,
    };
  }

  downloadFile(type: 'excel' | 'pdf'): void {
    const params = new URLSearchParams();
    if (this.searchModel.employee_id) params.append('employee_id', this.searchModel.employee_id);
    if (this.searchModel.salary_start) params.append('salary_start', this.searchModel.salary_start);
    if (this.searchModel.salary_end) params.append('salary_end', this.searchModel.salary_end);
  
    window.open(`${this.LIVE_URL}/export/salaries/${type}?${params.toString()}`, '_blank');
  }
}
