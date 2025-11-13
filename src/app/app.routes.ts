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
        loadComponent: () => import('./views/pages/invoices/invoices/invoices.component').then(c => c.InvoicesComponent),
        data: { title: 'Invoices' },
      },

      // Invoices Add
      {
        path: 'invoices/add',
        loadComponent: () => import('./views/pages/invoices/invoices/setup/setup.component').then(c => c.InvoicesSetupComponent),
        data: { title: 'Invoices Add' },
      },

      // Invoices Edit
      {
        path: 'invoices/edit/:id',
        loadComponent: () => import('./views/pages/invoices/invoices/setup/setup.component').then(c => c.InvoicesSetupComponent),
        data: { title: 'Invoices Edit' },
      },

      // Invoices View
      {
        path: 'invoices/view/:id',
        loadComponent: () => import('./views/pages/invoices/invoices/view/view.component').then(c => c.InvoicesViewComponent),
        data: { title: 'Invoices View' },
      },

      // Invoice Returns
      {
        path: 'invoice/returns',
        loadComponent: () => import('./views/pages/invoices/returns/returns.component').then(c => c.ReturnsComponent),
        data: { title: 'Invoice Returns' },
      },

      // Invoice Returns Add
      {
        path: 'invoice/returns/add',
        loadComponent: () => import('./views/pages/invoices/returns/setup/setup.component').then(c => c.ReturnsSetupComponent),
        data: { title: 'Invoice Returns Add' },
      },

      // Invoice Returns Edit
      {
        path: 'invoice/returns/edit/:id',
        loadComponent: () => import('./views/pages/invoices/returns/setup/setup.component').then(c => c.ReturnsSetupComponent),
        data: { title: 'Invoice Returns Edit' },
      },

      // Invoice Returns View
      {
        path: 'invoice/returns/view/:id',
        loadComponent: () => import('./views/pages/invoices/returns/view/view.component').then(c => c.ReturnsViewComponent),
        data: { title: 'Invoice Returns View' },
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

      // Stocks
      {
        path: 'stocks',
        loadComponent: () => import('./views/pages/stocks/stocks.component').then(c => c.StocksComponent),
        data: { title: 'Stocks' },
      },

      // Stocks Add
      {
        path: 'stocks/add',
        loadComponent: () => import('./views/pages/stocks/setup/setup.component').then(c => c.StocksSetupComponent),
        data: { title: 'Stocks Add' },
      },

      // Stocks Edit
      {
        path: 'stocks/edit/:id',
        loadComponent: () => import('./views/pages/stocks/setup/setup.component').then(c => c.StocksSetupComponent),
        data: { title: 'Stocks Edit' },
      },

      // Stocks View
      {
        path: 'stocks/view/:id',
        loadComponent: () => import('./views/pages/stocks/view/view.component').then(c => c.StocksViewComponent),
        data: { title: 'Stocks View' },
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

      // Import/Export
      {
        path: 'import-export',
        loadComponent: () => import('./views/pages/import-export/import-export.component').then(c => c.ImportExportComponent),
        data: { title: 'Import/Export' },
      },

      // Reports
      // Customers Ledgers
      {
        path: 'reports/customer-ledgers',
        loadComponent: () => import('./views/pages/reports/customer-ledgers/customer-ledgers.component').then(c => c.CustomersLedgersComponent),
        data: { title: 'Customers Ledgers' },
      },

      // Settings
      {
        path: 'settings',
        loadComponent: () => import('./views/pages/settings/settings.component').then(c => c.SettingsComponent),
        data: { title: 'Settings' },
      },

      // Users Edit
      {
        path: 'user/edit/:id',
        loadComponent: () => import('./views/pages/users/setup/setup.component').then(c => c.UsersSetupComponent),
        data: { title: 'User Edit' },
      },

      // User Profile
      {
        path: 'user/profile/:id',
        loadComponent: () => import('./views/pages/users/profile/profile.component').then(c => c.ProfileComponent),
        data: { title: 'User Profile' },
      },

      // Change Password
      {
        path: 'user/change-password',
        loadComponent: () => import('./views/pages/users/change-password/change-password.component').then(c => c.ChangePasswordComponent),
        data: { title: 'Change Password' },
      },

      // Support
      {
        path: 'support',
        loadComponent: () => import('./views/pages/support/support.component').then(c => c.SupportComponent),
        data: { title: 'Support' },
      },

      // Documentation
      {
        path: 'documentation',
        loadComponent: () => import('./views/pages/documentation/documentation.component').then(c => c.DocumentationComponent),
        data: { title: 'Documentation' },
      },

      // Payment Details
      {
        path: 'payment-details',
        loadComponent: () => import('./views/pages/payment-details/payment-details.component').then(c => c.PaymentDetailsComponent),
        data: { title: 'Payment Details' },
      },

      // 404 Page
      {
        path: 'error',
        loadComponent: () => import('./views/pages/error/error.component').then(c => c.ErrorComponent),
      },
      {
        path: 'error/:type',
        loadComponent: () => import('./views/pages/error/error.component').then(c => c.ErrorComponent)
      },
      { path: '**', redirectTo: 'error/404', pathMatch: 'full' }
    ]
  },
];
