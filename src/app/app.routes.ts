import { Routes } from '@angular/router';
import { BaseComponent } from './views/layout/base/base.component';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./views/pages/auth/login/login.component').then(c => c.LoginComponent),
    data: { title: 'Login' },
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./views/pages/auth/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent),
    data: { title: 'Forgot Password' },
  },
  {
    path: 'auth/verify-account/:token',
    loadComponent: () => import('./views/pages/auth/verify-account/verify-account.component').then(c => c.VerifyAccountComponent),
    data: { title: 'Verify Account' },
  },
  {
    path: 'auth/change-password/:token',
    loadComponent: () => import('./views/pages/auth/change-password/change-password.component').then(c => c.ChangePasswordComponent),
    data: { title: 'Change Password' },
  },
  {
    path: '',
    component: BaseComponent,
    canActivate: [AuthGuard],
    children: [
      // Dashboard
      { path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./views/pages/dashboard/dashboard.component').then(c => c.DashboardComponent),
        data: { title: 'Dashboard' },
      },

      // Companies
      {
        path: 'companies',
        loadComponent: () => import('./views/pages/companies/setup.component').then(c => c.CompaniesSetupComponent),
        data: { title: 'Companies' },
      },

      
      // Invoices
      {
        path: 'invoices',
        loadComponent: () => import('./views/pages/invoices/invoices.component').then(c => c.InvoicesComponent),
        data: { title: 'Invoices' },
      },

      // Invoices Add
      {
        path: 'invoices/add',
        loadComponent: () => import('./views/pages/invoices/setup/setup.component').then(c => c.InvoicesSetupComponent),
        data: { title: 'Invoices Add' },
      },

      // Invoices Edit
      {
        path: 'invoices/edit/:id',
        loadComponent: () => import('./views/pages/invoices/setup/setup.component').then(c => c.InvoicesSetupComponent),
        data: { title: 'Invoices Edit' },
      },

      // Invoices View
      {
        path: 'invoices/view/:id',
        loadComponent: () => import('./views/pages/invoices/view/view.component').then(c => c.InvoicesViewComponent),
        data: { title: 'Invoices View' },
      },

      // Products
      {
        path: 'products',
        loadComponent: () => import('./views/pages/products/products/products.component').then(c => c.ProductsComponent),
        data: { title: 'Products' },
      },

      // Products Add
      {
        path: 'products/add',
        loadComponent: () => import('./views/pages/products/products/setup/setup.component').then(c => c.ProductsSetupComponent),
        data: { title: 'Products Add' },
      },

      // Products Edit
      {
        path: 'products/edit/:id',
        loadComponent: () => import('./views/pages/products/products/setup/setup.component').then(c => c.ProductsSetupComponent),
        data: { title: 'Products Edit' },
      },

      // Products View
      {
        path: 'products/view/:id',
        loadComponent: () => import('./views/pages/products/products/view/view.component').then(c => c.ProductsViewComponent),
        data: { title: 'Products View' },
      },

      // Categories
      {
        path: 'products/categories',
        loadComponent: () => import('./views/pages/products/categories/categories.component').then(c => c.CategoriesComponent),
        data: { title: 'Categories' },
      },

      // Brands
      {
        path: 'products/brands',
        loadComponent: () => import('./views/pages/products/brands/brands.component').then(c => c.BrandsComponent),
        data: { title: 'Brands' },
      },

      // Units
      {
        path: 'products/units',
        loadComponent: () => import('./views/pages/products/units/units.component').then(c => c.UnitsComponent),
        data: { title: 'Units' },
      },

      // Customers
      {
        path: 'customers',
        loadComponent: () => import('./views/pages/customers/customers.component').then(c => c.CustomersComponent),
        data: { title: 'Customers' },
      },

      // Customers Add
      {
        path: 'customers/add',
        loadComponent: () => import('./views/pages/customers/setup/setup.component').then(c => c.CustomersSetupComponent),
        data: { title: 'Customers Add' },
      },

      // Customers Edit
      {
        path: 'customers/edit/:id',
        loadComponent: () => import('./views/pages/customers/setup/setup.component').then(c => c.CustomersSetupComponent),
        data: { title: 'Customers Edit' },
      },

      // Customers View
      {
        path: 'customers/view/:id',
        loadComponent: () => import('./views/pages/customers/view/view.component').then(c => c.CustomersViewComponent),
        data: { title: 'Customers View' },
      },


      // // Departments
      // {
      //   path: 'organizations/departments',
      //   loadComponent: () => import('./views/pages/organizations/departments/departments.component').then(c => c.DepartmentsComponent),
      //   data: { title: 'Departments' },
      // },

      // // Designations
      // {
      //   path: 'organizations/designations',
      //   loadComponent: () => import('./views/pages/organizations/designations/designations.component').then(c => c.DesignationsComponent),
      //   data: { title: 'Designations' },
      // },

      // // Job Types
      // {
      //   path: 'organizations/job-types',
      //   loadComponent: () => import('./views/pages/organizations/job-types/job-types.component').then(c => c.JobTypesComponent),
      //   data: { title: 'Job Types' },
      // },

      // // Attendances
      // {
      //   path: 'attendances',
      //   loadComponent: () => import('./views/pages/attendances/attendances.component').then(c => c.AttendancesComponent),
      //   data: { title: 'Attendances' },
      // },

      // // Attendances Add
      // {
      //   path: 'attendances/add',
      //   loadComponent: () => import('./views/pages/attendances/add/add.component').then(c => c.AttendancesAddComponent),
      //   data: { title: 'Attendances Add' },
      // },

      // // Attendances Edit
      // {
      //   path: 'attendances/edit/:id',
      //   loadComponent: () => import('./views/pages/attendances/edit/edit.component').then(c => c.AttendancesEditComponent),
      //   data: { title: 'Attendances Edit' },
      // },

      // // Attendances View
      // {
      //   path: 'attendances/view/:id',
      //   loadComponent: () => import('./views/pages/attendances/view/view.component').then(c => c.AttendancesViewComponent),
      //   data: { title: 'Attendances View' },
      // },

      // // Leave Applications
      // {
      //   path: 'leave-applications',
      //   loadComponent: () => import('./views/pages/leave-applications/leave-applications.component').then(c => c.LeaveApplicationsComponent),
      //   data: { title: 'Leave Applications' },
      // },

      // // Leave Types
      // {
      //   path: 'leave-applications/leave-types',
      //   loadComponent: () => import('./views/pages/leave-applications/leave-types/leave-types.component').then(c => c.LeaveTypesComponent),
      //   data: { title: 'Leave Types' },
      // },

      // // Salary Wizards
      // {
      //   path: 'salary-wizards',
      //   loadComponent: () => import('./views/pages/salary-wizards/salary-wizards.component').then(c => c.SalaryWizardsComponent),
      //   data: { title: 'Salary Wizards' },
      // },

      // // Reports
      // {
      //   path: 'reports/employees/card',
      //   loadComponent: () => import('./views/pages/reports/employees/cards/cards.component').then(c => c.ReportsCardsComponent),
      //   data: { title: 'Employee Cards' },
      // },
      // {
      //   path: 'reports/employees/salaries',
      //   loadComponent: () => import('./views/pages/reports/employees/salaries/salaries.component').then(c => c.ReportsSalariesComponent),
      //   data: { title: 'Employee Salaries' },
      // },

      // // Company Assets
      // {
      //   path: 'company-assets',
      //   loadComponent: () => import('./views/pages/company-assets/company-assets.component').then(c => c.CompanyAssetsComponent),
      //   data: { title: 'Company Assets' },
      // },

      // // Company Assets Add
      // {
      //   path: 'company-assets/add',
      //   loadComponent: () => import('./views/pages/company-assets/setup/setup.component').then(c => c.CompanyAssetsSetupComponent),
      //   data: { title: 'Company Assets Add' },
      // },

      // // Company Assets Edit
      // {
      //   path: 'company-assets/edit/:id',
      //   loadComponent: () => import('./views/pages/company-assets/setup/setup.component').then(c => c.CompanyAssetsSetupComponent),
      //   data: { title: 'Company Assets Edit' },
      // },

      // // Company Assets View
      // {
      //   path: 'company-assets/view/:id',
      //   loadComponent: () => import('./views/pages/company-assets/view/view.component').then(c => c.CompanyAssetsViewComponent),
      //   data: { title: 'Company Assets View' },
      // },

      // // Assets Types
      // {
      //   path: 'company-assets/asset-types',
      //   loadComponent: () => import('./views/pages/company-assets/asset-types/asset-types.component').then(c => c.AssetTypesComponent),
      //   data: { title: 'Asset Types' },
      // },

      // // Company Asset Returns
      // {
      //   path: 'company-asset-returns',
      //   loadComponent: () => import('./views/pages/company-asset-returns/company-asset-returns.component').then(c => c.CompanyAssetRetunsComponent),
      //   data: { title: 'Company Asset Returns' },
      // },

      // // Company Asset Returns Add
      // {
      //   path: 'company-asset-returns/add',
      //   loadComponent: () => import('./views/pages/company-asset-returns/setup/setup.component').then(c => c.CompanyAssetsSetupComponent),
      //   data: { title: 'Company Asset Returns Add' },
      // },

      // // Company Asset Returns Edit
      // {
      //   path: 'company-asset-returns/edit/:id',
      //   loadComponent: () => import('./views/pages/company-asset-returns/setup/setup.component').then(c => c.CompanyAssetsSetupComponent),
      //   data: { title: 'Company Asset Returns Edit' },
      // },

      // // Company Asset Returns View
      // {
      //   path: 'company-asset-returns/view/:id',
      //   loadComponent: () => import('./views/pages/company-asset-returns/view/view.component').then(c => c.CompanyAssetReturnsViewComponent),
      //   data: { title: 'Company Asset Returns View' },
      // },


      // Banks A/C
      {
        path: 'banks',
        loadComponent: () => import('./views/pages/banks/banks.component').then(c => c.BanksComponent),
        data: { title: 'Banks' },
      },

      // Cities
      {
        path: 'cities',
        loadComponent: () => import('./views/pages/cities/cities.component').then(c => c.CitiesComponent),
        data: { title: 'Cities' },
      },

      // Settings
      {
        path: 'settings',
        loadComponent: () => import('./views/pages/settings/settings.component').then(c => c.SettingsComponent),
        data: { title: 'Settings' },
      },

      // // Users Edit
      // {
      //   path: 'users/edit/:id',
      //   loadComponent: () => import('./views/pages/users/edit/edit.component').then(c => c.UsersEditComponent),
      //   data: { title: 'Users Edit' },
      // },

      // // User Profile
      // {
      //   path: 'users/profile/:id',
      //   loadComponent: () => import('./views/pages/users/profile/profile.component').then(c => c.ProfileComponent),
      //   data: { title: 'User Profile' },
      // },

      // // Change Password
      // {
      //   path: 'change-password',
      //   loadComponent: () => import('./views/pages/users/change-password/change-password.component').then(c => c.ChangePasswordComponent),
      //   data: { title: 'Change Password' },
      // },

      // // Support
      // {
      //   path: 'support',
      //   loadComponent: () => import('./views/pages/support/support.component').then(c => c.SupportComponent),
      //   data: { title: 'Support' },
      // },

      // // Documentation
      // {
      //   path: 'documentation',
      //   loadComponent: () => import('./views/pages/documentation/documentation.component').then(c => c.DocumentationComponent),
      //   data: { title: 'Documentation' },
      // },

      // // Payment Details
      // {
      //   path: 'payment-details',
      //   loadComponent: () => import('./views/pages/payment-details/payment-details.component').then(c => c.PaymentDetailsComponent),
      //   data: { title: 'Payment Details' },
      // },

      // // 404 Page
      // {
      //   path: 'error',
      //   loadComponent: () => import('./views/pages/error/error.component').then(c => c.ErrorComponent),
      // },
      // {
      //   path: 'error/:type',
      //   loadComponent: () => import('./views/pages/error/error.component').then(c => c.ErrorComponent)
      // },
      // { path: '**', redirectTo: 'error/404', pathMatch: 'full' }
    ]
  },
];
