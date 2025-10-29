import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'disc',
    link: '/dashboard'
  },

  // Sales
  {
    label: 'Sales',
    isTitle: true
  },
  {
    label: 'Invoices',
    icon: 'grid',
    link: '/invoices'
  },
  {
    label: 'Returns',
    icon: 'grid',
    link: '/invoice/returns'
  },
  {
    label: 'Customers',
    icon: 'users',
    link: '/customers',
  },

  // Inventory
  {
    label: 'Inventory',
    isTitle: true
  },
  {
    label: 'Products',
    icon: 'codesandbox',
    subItems: [
      {
        label: 'Listing',
        link: '/products',
      },
      {
        label: 'Add New',
        link: '/products/add'
      },
      {
        label: 'Categories',
        link: '/products/categories'
      },
      {
        label: 'Brands',
        link: '/products/brands'
      },
      {
        label: 'Units',
        link: '/products/units'
      },
    ]
  },
  {
    label: 'Stocks',
    icon: 'home',
    link: '/stocks',
  },

  // Administration
  {
    label: 'Administration',
    isTitle: true
  },
  {
    label: 'Company',
    icon: 'home',
    link: '/companies',
  },
  {
    label: 'Bank A/C',
    icon: 'dollar-sign',
    link: '/banks',
  },
  {
    label: 'Cities',
    icon: 'map',
    link: '/cities',
  },
  {
    label: 'Import / Export',
    icon: 'git-pull-request',
    link: '/import-export',
  },

  // Reports & Analytics
  {
    label: 'Reports & Analytics',
    isTitle: true
  },
  {
    label: 'Reports',
    icon: 'file-text',
    subItems: [
      {
        label: 'Customers',
        link: '/reports/customers',
      },
      {
        label: 'Customers',
        subItems: [
          {
            label: 'Card',
            link: '/reports/employees/card'
          },
          {
            label: 'Salaries',
            link: '/reports/employees/salaries'
          },
        ]
      },
    ]
  },

  // System
  {
    label: 'System',
    isTitle: true
  },
  {
    label: 'Settings',
    icon: 'settings',
    link: '/settings',
  },
];
