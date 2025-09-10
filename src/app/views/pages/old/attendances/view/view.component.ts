import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
//import { NgbDropdownModule, NgbNavContent, NgbNavModule, NgbTooltip, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';

interface AttendanceDetail {
  id: number;
  attendance_date: string;
  check_in: string;
  check_out: string;
  duration: string;
  attendance_status: string;
}

interface EmployeeInfo {
  id?: number;
  full_name: string;
  joining_date: string;
  resign_date?: string | null;
}

interface AttendanceRecord {
  id?: number;
  employee?: EmployeeInfo;
  month?: number;
  year?: number;
  status: string;
  description: string;
  details?: AttendanceDetail[];
}

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
    MyNgSelectComponent
  ],
  templateUrl: './view.component.html'
})
export class AttendancesViewComponent {
  private API_URL = environment.API_URL;

  currentRecord: AttendanceRecord = {
    status: '',
    description: '',
  };

  itemsList: AttendanceDetail[] = [];
  filteredItemsList: AttendanceDetail[] = [];
  monthYearList: { id: string; label: string }[] = [];
  selectedMonthYear: string = '';
  loading = false;
  loadingIndicator = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadAttendances(+id);
      }
    });
  }

  loadAttendances(id: number) {
    this.loading = true;
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    this.http.get<AttendanceRecord>(`${this.API_URL}/attendances/${id}/detail`, {
      params: { month, year }
    }).subscribe({
      next: (response) => {
        this.currentRecord = {
          ...response,
          id: id,
          month: month,
          year: year
        };

        // Store all details in itemsList
        this.itemsList = response.details || [];

        // Filter by month-year
        const monthlyItems = this.filterDetailsByMonth(month, year);

        // Further filter to exclude future dates
        const today = new Date().toISOString().split('T')[0];
        this.filteredItemsList = monthlyItems.filter(item => item.attendance_date <= today);

        if (response.employee?.joining_date) {
          this.generateMonthYearList(
            response.employee.joining_date,
            response.employee.resign_date
          );
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        
        if (error.status === 403 && error.error?.redirect) {
          // Unauthorized access - redirect to dashboard
          this.router.navigate(['/dashboard']);
        } else {
          // Handle other errors
          console.error('Error fetching attendance detail:', error);
        }
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  private filterDetailsByMonth(month: number, year: number): AttendanceDetail[] {
    return this.itemsList.filter(item => {
      const date = new Date(item.attendance_date);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    });
  }

  filterByMonthYear() {
    if (!this.selectedMonthYear) {
      this.filteredItemsList = [...this.itemsList];
      return;
    }

    const [year, month] = this.selectedMonthYear.split('-').map(Number);
    this.filteredItemsList = this.filterDetailsByMonth(month, year);
    
    // Optional: Load data from server if not available
    if (this.filteredItemsList.length === 0) {
      this.loadMonthData(this.currentRecord.id!, month, year);
    }
  }

  private loadMonthData(id: number, month: number, year: number) {
    this.loading = true;
    this.http.get<AttendanceRecord>(`${this.API_URL}/attendances/${id}/detail`, { 
      params: { month, year } 
    }).subscribe({
      next: (response) => {
        // Add new details to itemsList
        this.itemsList = [...this.itemsList, ...(response.details || [])];
        this.filteredItemsList = this.filterDetailsByMonth(month, year);
      },
      error: (error) => {
        console.error('Error fetching month data:', error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // Add this to your component class
  // Calculate total duration in hours and minutes (for Total Duration)
calculateTotalDuration(): string {
  if (!this.filteredItemsList || this.filteredItemsList.length === 0) {
    return '0h 0m';
  }

  let totalMinutes = 0;

  this.filteredItemsList.forEach(item => {
    const duration = item.duration || '0h 0m';
    const [hours, minutes] = duration.split(/h\s*/).map(part =>
      parseInt(part.replace(/[^\d]/g, '')) || 0
    );
    totalMinutes += hours * 60 + minutes;
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

// Calculate total days for a specific status
calculateTotalDaysByStatus(status: string): string {
  if (!this.filteredItemsList || this.filteredItemsList.length === 0) {
    return '0 days';
  }

  const days = this.filteredItemsList.filter(item => item.attendance_status === status).length;
  return `${days} days`;
}

// Computed properties
get totalPresent(): string {
  return this.calculateTotalDaysByStatus('Present');
}

get totalAbsent(): string {
  return this.calculateTotalDaysByStatus('Absent');
}

get totalHalfDay(): string {
  return this.calculateTotalDaysByStatus('Half Day');
}

get totalLeave(): string {
  return this.calculateTotalDaysByStatus('Leave');
}

get totalDuration(): string {
  return this.calculateTotalDuration();
}


  generateMonthYearList(joiningDateStr: string, resignDateStr?: string | null) {
    const joiningDate = new Date(joiningDateStr);
    const endDate = resignDateStr ? new Date(resignDateStr) : new Date();
    
    // Set to first day of the month for both dates
    joiningDate.setDate(1);
    endDate.setDate(1);
    
    let current = new Date(joiningDate);
    const monthYearList: { id: string; label: string }[] = [];

    while (current <= endDate) {
      const year = current.getFullYear();
      const month = current.getMonth() + 1;
      const id = `${year}-${month.toString().padStart(2, '0')}`;
      const label = `${current.toLocaleString('default', { month: 'long' })} ${year}`;
      
      monthYearList.push({ id, label });
      current.setMonth(current.getMonth() + 1);
    }

    this.monthYearList = monthYearList;
    this.selectedMonthYear = monthYearList[monthYearList.length - 1]?.id || '';
  }
  
}
