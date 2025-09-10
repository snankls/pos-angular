import { Component } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ColumnMode, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../../environments/environment';
import { BreadcrumbComponent } from '../../../layout/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-edit',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    RouterLink,
    NgxDatatableModule,
    CommonModule,
    FormsModule,
    NgbDatepickerModule,
    NgbTimepickerModule,
    MyNgSelectComponent
  ],
  templateUrl: './edit.component.html'
})
export class AttendancesEditComponent {
  private API_URL = environment.API_URL;

  // In your component class
  currentRecord: any = {
    month_year: null
  };

  itemsList: {
    id: number;
    attendance_id: number;
    attendance_date: string;
    check_in: string;
    check_out: string;
    duration: string;
    attendance_status: string;
  }[] = [];

  filteredItemsList: typeof this.itemsList = [];
  monthYearOptions: { id: string, label: string }[] = [];
  attendanceDetails: any[] = [];
  check_in = { hour: 9, minute: 0 };
  check_out = { hour: 17, minute: 0 };
  duration: string = '8h 0m';
  monthlyAttendance: any[] = [];
  
  isMonthSelectDisabled = false;

  globalErrorMessage: string = '';
  isLoading = false;
  formErrors: any = {};
  employees: any[] = [];
  status: { id: string; name: string }[] = [];
  selectedEmployeeId: number | null = null;
  
  attendance_status: { id: string; name: string }[] = [];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  // defaultTimepickerCode: any;
  ngOnInit(): void {
    this.fetchEmployees();
    this.fetchStatus();
    
    this.attendance_status = [
      { id: 'Present', name: 'Present' },
      { id: 'Absent', name: 'Absent' },
      { id: 'Late', name: 'Late' },
      { id: 'Half Day', name: 'Half Day' },
      { id: 'Leave', name: 'Leave' },
      { id: 'Rest', name: 'Rest' },
      { id: 'Holiday', name: 'Holiday' },
    ];

    // Handle id-based route
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadAttendances(+id);
      }
    });
  }

  clearError(field: string): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }
  
  fetchEmployees(): void {
    this.http.get<any[]>(`${this.API_URL}/attendance/employees`).subscribe({
      next: (response) => {
        // Map each employee to add a custom label
        this.employees = response.map((employee) => ({
          ...employee,
          employee_label: `${employee.full_name} (${employee.code})`,
          joining_date: employee.joining_date ? new Date(employee.joining_date) : null
        }));
      },
      error: (error) => console.error('Failed to fetch employees:', error)
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

  loadAttendances(id: number) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const currentMonthYear = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

    const params = { month: currentMonth, year: currentYear };

    this.http.get<any>(`${this.API_URL}/attendances/${id}/detail`, { params }).subscribe(response => {
      this.currentRecord = {
        id: id,
        employee: response.employee,
        month_year: currentMonthYear,
        status: response.status,
        description: response.description
      };

      this.attendanceDetails = (response.details || []).map((item: any) => ({
        ...item,
        status: item.attendance_status,
        attendance_date: item.attendance_date
      }));

      // Generate month options based on employee's joining and resignation dates
      this.generateEmployeeMonthOptions(
        response.employee.joining_date,
        response.employee.resignation_date
      );
      
      // Load attendance details for the current month
      this.loadAttendanceDetails();

    }, error => {
      console.error('Error fetching attendance detail:', error);
    });
  }

  generateEmployeeMonthOptions(joiningDate: string, resignationDate: string | null = null): void {
    if (!joiningDate) {
      this.monthYearOptions = [];
      return;
    }

    const start = new Date(joiningDate);
    const end = resignationDate ? new Date(resignationDate) : new Date();
    
    // Ensure we're working with the first day of the month
    start.setDate(1);
    end.setDate(1);
    
    const current = new Date(start);
    
    const options: { id: string, label: string }[] = [];

    while (current <= end) {
      const month = current.getMonth() + 1;
      const year = current.getFullYear();
      const id = `${year}-${month.toString().padStart(2, '0')}`;
      const label = `${current.toLocaleString('default', { month: 'long' })} ${year}`;
      
      options.push({ id, label });
      
      // Move to next month
      current.setMonth(current.getMonth() + 1);
    }

    // Ensure current month is included even if slightly out of range
    const now = new Date();
    const currentId = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!options.some(opt => opt.id === currentId)) {
      options.push({
        id: currentId,
        label: `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`
      });
    }

    this.monthYearOptions = options;
  }

  onMonthSelect(): void {
    if (this.currentRecord.month_year) {
      this.loadAttendanceDetails();
    } else {
      this.attendanceDetails = [];
    }
  }

  // New separate method to load attendance
  loadAttendanceDetails(): void {
    if (!this.currentRecord.month_year || !this.currentRecord.employee?.id) {
      this.attendanceDetails = [];
      return;
    }

    const [yearStr, monthStr] = this.currentRecord.month_year.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    // Fetch existing attendance records for this month
    this.http.get<any>(`${this.API_URL}/attendances/${this.currentRecord.id}/detail`, {
      params: {
        employee_id: this.currentRecord.employee.id,
        month,
        year
      }
    }).subscribe({
      next: (response) => {
        // Process existing records from database
        const existingRecords = response.details || [];
        
        // Generate all days for the month
        const daysInMonth = this.generateDaysForMonth(year, month, this.currentRecord.employee.joining_date);
        
        // Merge existing records with generated days
        this.attendanceDetails = daysInMonth.map(day => {
          const existingRecord = existingRecords.find((r: any) => 
            r.attendance_date === this.formatNgbDateToYMD(day.attendance_date)
          );  // <-- Missing parenthesis was here
          
          return existingRecord ? {
            attendance_id: existingRecord.id,
            attendance_date: day.attendance_date,
            check_in: this.parseTimeString(existingRecord.check_in),
            check_out: this.parseTimeString(existingRecord.check_out),
            duration: existingRecord.duration,
            status: existingRecord.attendance_status
          } : day;
        });
      },
      error: (error) => {
        console.error('Error loading attendance details:', error);
        // If error occurs, just generate the days
        this.attendanceDetails = this.generateDaysForMonth(year, month, this.currentRecord.employee.joining_date);
      }
    });
  }

  // Helper to generate all days for a month
  generateDaysForMonth(year: number, month: number, joiningDate: string): any[] {
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);
    const joining = new Date(joiningDate);
    joining.setHours(0, 0, 0, 0);

    const days = [];
    let current = new Date(firstDayOfMonth);
    current.setHours(0, 0, 0, 0);

    while (current <= lastDayOfMonth) {
      if (current >= joining) {
        const dateStruct: NgbDateStruct = {
          year: current.getFullYear(),
          month: current.getMonth() + 1,
          day: current.getDate()
        };

        days.push({
          attendance_id: null, // Indicates new record
          attendance_date: dateStruct,
          check_in: { hour: 9, minute: 0 },
          check_out: { hour: 17, minute: 0 },
          duration: '8h 0m',
          status: 'Present'
        });
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  // Helper to parse time string (HH:MM:SS) to time object
  parseTimeString(timeString: string): {hour: number, minute: number} {
    if (!timeString) return { hour: 9, minute: 0 };
    
    const parts = timeString.split(':');
    return {
      hour: parseInt(parts[0], 10),
      minute: parseInt(parts[1], 10)
    };
  }

  updateDuration(index: number): void {
    const day = this.attendanceDetails[index];
    const { check_in, check_out } = day;

    if (check_in && check_out) {
      const inMinutes = check_in.hour * 60 + check_in.minute;
      const outMinutes = check_out.hour * 60 + check_out.minute;
      const diff = outMinutes - inMinutes;

      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      day.duration = `${hours}h ${minutes}m`;
    } else {
      day.duration = '';
    }
  }

  formatDate(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }

  // Helper method to format NgbDateStruct to YYYY-MM-DD
  formatNgbDateToYMD(date: NgbDateStruct): string {
    return `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
  }

  // Helper method to format time object to HH:MM:SS
  formatTime(time: {hour: number, minute: number}): string {
    return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}:00`;
  }
  
  updateRecord(event: Event): void {
    event.preventDefault();
  
    this.isLoading = true;

    const payload = {
      month_year: this.currentRecord.month_year,
      employee_id: this.currentRecord.employee?.id,
      status: this.currentRecord.status || 1,
      description: this.currentRecord.description || '',
      attendance_details: this.attendanceDetails.map(day => ({
        id: day.attendance_id || null,
        attendance_date: this.formatNgbDateToYMD(day.attendance_date),
        check_in: this.formatTime(day.check_in),
        check_out: this.formatTime(day.check_out),
        duration: day.duration,
        attendance_status: day.status
      }))
    };

    // const payload = {
    //   employee_id: this.currentRecord.employee?.id,
    //   status: this.currentRecord.status || 1,
    //   description: this.currentRecord.description || '',
    //   attendance_details: this.attendanceDetails.map(day => ({
    //     id: day.attendance_id || null,
    //     attendance_date: this.formatNgbDateToYMD(day.attendance_date),
    //     check_in: this.formatTime(day.check_in),
    //     check_out: this.formatTime(day.check_out),
    //     duration: day.duration,
    //     attendance_status: day.status
    //   }))
    // };

    this.http.put(`${this.API_URL}/attendances/${this.currentRecord.id}`, payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.router.navigate(['/attendances']);
      },
      error: (error) => {
        console.error('Error updating attendance:', error);
        if (error.status === 422) {
          this.formErrors = error.error.errors;
        }
        this.isLoading = false;
      }
    });
  }
  
}
