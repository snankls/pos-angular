import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'activity', // analytics / overview
    link: '/dashboard'
  },

  // Sales
  {
    label: 'Sales',
    isTitle: true
  },
  {
    label: 'Invoices',
    icon: 'file-text', // document/invoice icon
    link: '/invoices'
  },
  {
    label: 'Returns',
    icon: 'rotate-ccw', // return/refund icon
    link: '/invoice/returns'
  },
  {
    label: 'Customers',
    icon: 'users', // customers/people
    link: '/customers',
  },

  // Inventory
  {
    label: 'Inventory',
    isTitle: true
  },
  {
    label: 'Products',
    icon: 'package', // box/package for products
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
        label: 'Brands',
        link: '/products/brands'
      },
      {
        label: 'Categories',
        link: '/products/categories'
      },
      {
        label: 'Units',
        link: '/products/units'
      },
    ]
  },
  {
    label: 'Stocks',
    icon: 'layers', // stacked layers for inventory/stock
    link: '/stocks',
  },

  // Administration
  {
    label: 'Administration',
    isTitle: true
  },
  {
    label: 'Company',
    icon: 'briefcase', // business/company
    link: '/companies',
  },
  {
    label: 'Bank A/C',
    icon: 'credit-card', // finance/bank account
    link: '/banks',
  },
  {
    label: 'Cities',
    icon: 'map-pin', // locations/cities
    link: '/cities',
  },
  {
    label: 'Import / Export',
    icon: 'refresh-cw', // sync/import-export
    link: '/import-export',
  },

  // Reports & Analytics
  // {
  //   label: 'Reports & Analytics',
  //   isTitle: true
  // },
  // {
  //   label: 'Reports',
  //   icon: 'file-text',
  //   subItems: [
  //     {
  //       label: 'Customers',
  //       link: '/reports/customers',
  //     },
  //     {
  //       label: 'Customers',
  //       subItems: [
  //         {
  //           label: 'Card',
  //           link: '/reports/employees/card'
  //         },
  //         {
  //           label: 'Salaries',
  //           link: '/reports/employees/salaries'
  //         },
  //       ]
  //     },
  //   ]
  // },

  // System
  {
    label: 'System',
    isTitle: true
  },
  {
    label: 'Settings',
    icon: 'settings', // cog/settings
    link: '/settings',
  },
];
