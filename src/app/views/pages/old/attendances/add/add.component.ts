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
  selector: 'app-add',
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
  templateUrl: './add.component.html'
})
export class AttendancesAddComponent {
  private API_URL = environment.API_URL;

  // In your component class
  currentRecord: any = {
    month_year: null
  };

  // itemsList: {
  //   id: number;
  //   attendance_id: number;
  //   attendance_date: string;
  //   check_in: string;
  //   check_out: string;
  //   duration: string;
  //   attendance_status: string;
  // }[] = [];

  // filteredItemsList: typeof this.itemsList = [];
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

  onEmployeeSelect(): void {
    // Reset validation error when employee is selected
    if (this.selectedEmployeeId) {
      delete this.formErrors.employee_id; // Remove the validation error for employee_id
    }

    // Additional logic for onEmployeeSelect
    // Reset states
    this.currentRecord.month_year = null;
    this.attendanceDetails = [];
    this.isMonthSelectDisabled = false;

    if (!this.selectedEmployeeId) {
      this.monthYearOptions = [];
      return;
    }

    const selectedEmployee = this.employees.find(e => e.id === this.selectedEmployeeId);
    if (!selectedEmployee?.joining_date) {
      this.monthYearOptions = [];
      return;
    }

    // Generate month options first
    this.generateMonthOptions(selectedEmployee.joining_date);

    // Check if employee joined in current month
    const joiningDate = new Date(selectedEmployee.joining_date);
    const now = new Date();

    const joinedInCurrentMonth = 
      joiningDate.getFullYear() === now.getFullYear() && 
      joiningDate.getMonth() === now.getMonth();

    // For current month joiners, auto-select the only available month
    if (joinedInCurrentMonth && this.monthYearOptions.length === 1) {
      this.isMonthSelectDisabled = true;
      this.currentRecord.month_year = this.monthYearOptions[0].id;
      
      // Load attendance after a small delay
      setTimeout(() => {
        this.loadAttendanceDetails();
      });
    }
  }

  generateMonthOptions(joiningDate: string): void {
    const start = new Date(joiningDate);
    const now = new Date();
    
    // Ensure we're working with the first day of the month
    start.setDate(1);
    const current = new Date(start);
    
    const options: { id: string, label: string }[] = [];

    while (current <= now) {
      const month = current.getMonth() + 1;
      const year = current.getFullYear();
      const id = `${year}-${month.toString().padStart(2, '0')}`;
      const label = `${current.toLocaleString('default', { month: 'long' })} ${year}`;
      
      options.push({ id, label });
      
      // Move to next month
      current.setMonth(current.getMonth() + 1);
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

  loadAttendanceDetails(): void {
    if (!this.selectedEmployeeId || !this.currentRecord.month_year) {
      this.attendanceDetails = [];
      return;
    }

    const employee = this.employees.find(e => e.id === this.selectedEmployeeId);
    if (!employee?.joining_date) {
      this.attendanceDetails = [];
      return;
    }

    const [yearStr, monthStr] = this.currentRecord.month_year.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);

    const joiningDate = new Date(employee.joining_date);
    joiningDate.setHours(0, 0, 0, 0);

    const days = [];
    let current = new Date(firstDayOfMonth);
    current.setHours(0, 0, 0, 0);

    while (current <= lastDayOfMonth) {
      if (current >= joiningDate) {
        const dateStruct: NgbDateStruct = {
          year: current.getFullYear(),
          month: current.getMonth() + 1,
          day: current.getDate()
        };

        days.push({
          attendance_date: dateStruct,
          check_in: { hour: 9, minute: 0 },
          check_out: { hour: 17, minute: 0 },
          duration: '8h 0m',
          status: 'Present'
        });
      }
      current.setDate(current.getDate() + 1);
    }

    this.attendanceDetails = days;
  }

  calculateDuration(checkIn: any, checkOut: any): string {
    const inMinutes = checkIn.hour * 60 + checkIn.minute;
    const outMinutes = checkOut.hour * 60 + checkOut.minute;
    const totalMinutes = outMinutes - inMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  updateDuration(index: number): void {
    const day = this.attendanceDetails[index];
    day.duration = this.calculateDuration(day.check_in, day.check_out);
    // Trigger change detection
    this.attendanceDetails = [...this.attendanceDetails];
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

  // Add your onSubmit method
  onSubmit(event: Event): void {
    event.preventDefault();
    
    this.isLoading = true;

    // Prepare the data for submission
    const payload = {
      employee_id: this.selectedEmployeeId,
      status: this.currentRecord.status || 1, // Default to Active status
      description: this.currentRecord.description || '',
      attendance_details: this.attendanceDetails.map(day => ({
        attendance_date: this.formatNgbDateToYMD(day.attendance_date),
        check_in: this.formatTime(day.check_in),
        check_out: this.formatTime(day.check_out),
        duration: day.duration,
        attendance_status: day.status
      }))
    };

    this.http.post(`${this.API_URL}/attendances`, payload).subscribe({
      next: (response) => {
        this.router.navigate(['/attendances']);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving attendance:', error);
        if (error.status === 422) {
          this.formErrors = error.error.errors;
          this.globalErrorMessage = 'Please fill all required fields correctly.';
        }
        this.isLoading = false;
      }
    });
  }
  
}
