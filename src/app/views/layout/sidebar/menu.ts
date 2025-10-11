import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    label: 'Main',
    isTitle: true
  },
  {
    label: 'Dashboard',
    icon: 'disc',
    link: '/dashboard'
  },
  {
    label: 'Companies',
    isTitle: true
  },
  {
    label: 'Company',
    icon: 'home',
    link: '/companies',
  },

  {
    label: 'Invoices',
    icon: 'grid',
    subItems: [
      {
        label: 'Listing',
        link: '/invoices',
      },
      {
        label: 'Add New',
        link: '/invoices/add'
      },
      {
        label: 'Returns',
        link: '/invoices/returns'
      },
    ]
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
      {
        label: 'Stocks',
        link: '/products/stocks'
      },
    ]
  },

  // {
  //   label: 'Employees',
  //   isTitle: true
  // },
  // {
  //   label: 'Employees',
  //   icon: 'users',
  //   link: '/employees',
  // },
  // {
  //   label: 'Organizations',
  //   icon: 'codesandbox',
  //   subItems: [
  //     {
  //       label: 'Departments',
  //       link: '/organizations/departments',
  //     },
  //     {
  //       label: 'Designations',
  //       link: '/organizations/designations'
  //     },
  //     {
  //       label: 'Job Types',
  //       link: '/organizations/job-types'
  //     },
  //   ]
  // },
  // {
  //   label: 'Attendances',
  //   icon: 'calendar',
  //   link: '/attendances',
  // },
  // {
  //   label: 'Leave Applications',
  //   icon: 'mail',
  //   subItems: [
  //     {
  //       label: 'Leave Applications',
  //       link: '/leave-applications',
  //     },
  //     {
  //       label: 'Leave Types',
  //       link: '/leave-applications/leave-types'
  //     },
  //   ]
  // },
  // {
  //   label: 'Salary Wizards',
  //   icon: 'sunrise',
  //   link: '/salary-wizards',
  // },
  // {
  //   label: 'Reports',
  //   icon: 'file-text',
  //   subItems: [
  //     {
  //       label: 'Employees',
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
  // {
  //   label: 'Allowances / Benefits',
  //   isTitle: true
  // },

  // Customers
  {
    label: 'Customers',
    icon: 'users',
    link: '/customers',
  },

  // // General
  // {
  //   label: 'General',
  //   isTitle: true
  // },
  // {
  //   label: 'Loans',
  //   icon: 'layers',
  //   link: '/loans',
  // },
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
  {
    label: 'Settings',
    icon: 'settings',
    link: '/settings',
  },
];
