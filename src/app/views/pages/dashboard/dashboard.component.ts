import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgbDatepickerModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ApexOptions, NgApexchartsModule } from "ng-apexcharts";
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService, ThemeCssVariablesType } from '../../../core/services/theme-css-variable.service';
import { environment } from '../../../environments/environment';

interface AttendanceData {
  Present: number;
  Absent: number;
  Leave: number;
  HalfDay: number;
}

interface ChartResponseItem {
  month?: number;
  day?: number;
  attendance_status: 'Present' | 'Absent' | 'Leave' | 'HalfDay';
  count: number;
}

interface MonthlyAttendanceData {
  month: number;
  attendance_status: 'Present' | 'Absent' | 'Leave';
  count: number;
}

interface DailyAttendanceData {
  day: number;
  attendance_status: 'Present' | 'Absent' | 'Leave';
  count: number;
}

interface ProcessedAttendanceData {
  Present: number;
  Absent: number;
  Leave: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgbDropdownModule,
    FormsModule, 
    NgbDatepickerModule, 
    NgApexchartsModule,
    FeatherIconDirective,
    CommonModule
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private API_URL = environment.API_URL;
  private IMAGE_URL = environment.IMAGE_URL;

  employees: any[] = [];
  dashboardData: any;
  monthlyAttendanceChartOptions: any = {};
  dailyAttendanceChartOptions: any = {};

  /* Apex chart */
  public monthlySalesChartOptions: ApexOptions | any;
  themeCssVariables = inject(ThemeCssVariableService).getThemeCssVariables();

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.getDashboardCounter();
    //this.fetchEmployees();
    //this.monthlySalesChartOptions = this.getMonthlySalesChartOptions(this.themeCssVariables);
  }

  getDashboardCounter(): void {
    this.http.get<{
      monthlyAttendanceChartData: ChartResponseItem[],
      dailyAttendanceChartData: ChartResponseItem[]
    }>(`${this.API_URL}/dashboard`).subscribe({
      next: (response) => {
        this.dashboardData = response;

        // Process monthly data with proper typing
        const monthlyData: { [key: number]: AttendanceData } = {};
        response.monthlyAttendanceChartData.forEach((item) => {
          if (!monthlyData[item.month!]) {
            monthlyData[item.month!] = { Present: 0, Absent: 0, Leave: 0, HalfDay: 0 };
          }
          monthlyData[item.month!][item.attendance_status] = item.count;
        });

        // Prepare monthly arrays
        const presentMonthly = Array(12).fill(0);
        const absentMonthly = Array(12).fill(0);
        const leaveMonthly = Array(12).fill(0);
        const halfDayMonthly = Array(12).fill(0);

        Object.entries(monthlyData).forEach(([month, data]) => {
          const monthIndex = parseInt(month) - 1;
          if (monthIndex >= 0 && monthIndex < 12) {
            presentMonthly[monthIndex] = data.Present;
            absentMonthly[monthIndex] = data.Absent;
            leaveMonthly[monthIndex] = data.Leave;
            halfDayMonthly[monthIndex] = data.HalfDay;
          }
        });

        // Process daily data
        const dailyData: { [key: number]: AttendanceData } = {};
        response.dailyAttendanceChartData.forEach((item) => {
          if (!dailyData[item.day!]) {
            dailyData[item.day!] = { Present: 0, Absent: 0, Leave: 0, HalfDay: 0 };
          }
          dailyData[item.day!][item.attendance_status] = item.count;
        });

        // Get last 10 days
        const daysInMonth = new Date().getDate();
        const last10Days = Array.from({length: Math.min(10, daysInMonth)}, (_, i) => daysInMonth - i).reverse();
        
        const presentDaily: number[] = [];
        const absentDaily: number[] = [];
        const leaveDaily: number[] = [];
        const halfDayDaily: number[] = [];
        const daysLabels: string[] = [];

        last10Days.forEach(day => {
          presentDaily.push(dailyData[day]?.Present || 0);
          absentDaily.push(dailyData[day]?.Absent || 0);
          leaveDaily.push(dailyData[day]?.Leave || 0);
          halfDayDaily.push(dailyData[day]?.HalfDay || 0);
          daysLabels.push(day.toString());
        });

        // Initialize charts
        this.initCharts(
          presentMonthly, 
          absentMonthly, 
          leaveMonthly,
          halfDayMonthly,
          presentDaily,
          absentDaily,
          leaveDaily,
          halfDayDaily,
          daysLabels
        );
      },
      error: (error) => {
        console.error('Error fetching dashboard data', error);
      }
    });
  }

  private initCharts(
    presentMonthly: number[], 
    absentMonthly: number[], 
    leaveMonthly: number[],
    halfDayMonthly: number[],
    presentDaily: number[],
    absentDaily: number[],
    leaveDaily: number[],
    halfDayDaily: number[],
    daysLabels: string[]
  ): void {
    const themeVars = this.themeCssVariables;

    // Monthly Attendance Chart
    this.monthlyAttendanceChartOptions = {
      series: [
        { name: 'Present', data: presentMonthly },
        { name: 'Absent', data: absentMonthly },
        { name: 'Leave', data: leaveMonthly },
        { name: 'Half Day', data: halfDayMonthly }
      ],
      chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        toolbar: { show: false },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      colors: [themeVars.primary, themeVars.danger, themeVars.warning, themeVars.success,],
      plotOptions: {
        bar: { 
          horizontal: false, 
          columnWidth: '50%', 
          borderRadius: 4,
          endingShape: 'rounded',
          dataLabels: {
            position: 'top',
            hideOverflowingLabels: true
          }
        }
      },
      dataLabels: { 
        enabled: false 
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        title: {
          style: {
            color: themeVars.secondary
          }
        }
      },
      yaxis: {
        title: {
          text: 'Attendance Count',
          style: {
            color: themeVars.secondary
          }
        },
        labels: {
          formatter: (value: number) => {
            return Math.floor(value) === value ? value.toString() : '';
          }
        }
      },
      fill: {
        opacity: 1,
        type: 'solid'
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        offsetX: 0,
        markers: {
          radius: 12
        },
        itemMargin: {
          horizontal: 10,
          vertical: 5
        }
      },
      grid: {
        borderColor: themeVars.gridBorder,
        row: {
          colors: ['transparent', 'transparent'],
          opacity: 0.5
        },
        padding: {
          top: 0,
          right: 20,
          bottom: 0,
          left: 20
        }
      },
      responsive: [{
        breakpoint: 768,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '70%'
            }
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    };

    // Daily Attendance Chart (Last 10 Days)
    this.dailyAttendanceChartOptions = {
      series: [
        { name: 'Present', data: presentDaily },
        { name: 'Absent', data: absentDaily },
        { name: 'Leave', data: leaveDaily },
        { name: 'Half Day', data: halfDayDaily }
      ],
      chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        toolbar: { show: false },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      colors: [themeVars.primary, themeVars.danger, themeVars.warning, themeVars.success,],
      plotOptions: {
        bar: { 
          horizontal: false, 
          columnWidth: '50%', 
          borderRadius: 4,
          endingShape: 'rounded'
        }
      },
      dataLabels: { 
        enabled: false 
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: daysLabels,
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        title: {
          style: {
            color: themeVars.secondary
          }
        }
      },
      yaxis: {
        title: {
          text: 'Attendance Count',
          style: {
            color: themeVars.secondary
          }
        },
        min: 0,
        forceNiceScale: true,
        labels: {
          formatter: (value: number) => {
            return Math.floor(value) === value ? value.toString() : '';
          }
        }
      },
      fill: {
        opacity: 1
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        offsetX: 0,
        markers: {
          radius: 12
        }
      },
      grid: {
        borderColor: themeVars.gridBorder,
        row: {
          colors: ['transparent', 'transparent'],
          opacity: 0.5
        }
      },
      responsive: [{
        breakpoint: 768,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '70%'
            }
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    };
  }

  fetchEmployees(): void {
    this.http.get<any[]>(`${this.API_URL}/employees-list`).subscribe({
      next: (response) => {
        // Map each employee to add a custom label
        this.employees = response.map((employee) => ({
          ...employee,
        }));

          // Optionally, you can process image_url if necessary (e.g., fallback for missing images)
          this.employees.forEach((employee) => {
            employee.employee_image = employee.image_url
              ? `${this.IMAGE_URL}/uploads/employees/${employee.image_url}`
              : 'images/placeholder.png';
          });
      },
      error: (error) => console.error('Failed to fetch employees:', error)
    });
  }

  // getMonthlySalesChartOptions(themeVariables: ThemeCssVariablesType) {
  //   return {
  //     series: [{
  //       name: 'Sales',
  //       data: [152,109,93,113,126,161,188,143,102,113,116,124]
  //     }],
  //     chart: {
  //       type: 'bar',
  //       height: '330',
  //       parentHeightOffset: 0,
  //       foreColor: themeVariables.secondary,
  //       toolbar: {
  //         show: false
  //       },
  //       zoom: {
  //         enabled: false
  //       }
  //     },
  //     colors: [themeVariables.primary],  
  //     fill: {
  //       opacity: .9
  //     }, 
  //     grid: {
  //       padding: {
  //         bottom: -4
  //       },
  //       borderColor: themeVariables.gridBorder,
  //       xaxis: {
  //         lines: {
  //           show: true
  //         }
  //       }
  //     },
  //     xaxis: {
  //       type: 'datetime',
  //       categories: ['01/01/2024','02/01/2024','03/01/2024','04/01/2024','05/01/2024','06/01/2024','07/01/2024', '08/01/2024','09/01/2024','10/01/2024', '11/01/2024', '12/01/2024'],
  //       axisBorder: {
  //         color: themeVariables.gridBorder,
  //       },
  //       axisTicks: {
  //         color: themeVariables.gridBorder,
  //       },
  //     },
  //     yaxis: {
  //       title: {
  //         text: 'Number of Attendances',
  //         style:{
  //           size: 9,
  //           color: themeVariables.secondary
  //         }
  //       },
  //       labels: {
  //         offsetX: 0,
  //       },
  //     },
  //     legend: {
  //       show: true,
  //       position: "top",
  //       horizontalAlign: 'center',
  //       fontFamily: themeVariables.fontFamily,
  //       itemMargin: {
  //         horizontal: 8,
  //         vertical: 0
  //       },
  //     },
  //     stroke: {
  //       width: 0
  //     },
  //     dataLabels: {
  //       enabled: true,
  //       style: {
  //         fontSize: '10px',
  //         fontFamily: themeVariables.fontFamily,
  //       },
  //       offsetY: -27
  //     },
  //     plotOptions: {
  //       bar: {
  //         columnWidth: "50%",
  //         borderRadius: 4,
  //         dataLabels: {
  //           position: 'top',
  //           orientation: 'vertical',
  //         }
  //       },
  //     }
  //   }
  // }

}