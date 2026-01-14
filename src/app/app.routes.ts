import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'suppliers',
    loadChildren: () => import('./modules/suppliers/suppliers.module').then(m => m.SuppliersModule)
  },
  {
    path: 'invoices',
    loadChildren: () => import('./modules/invoices/invoices.module').then(m => m.InvoicesModule)
  },
  {
    path: 'credit-notes',
    loadChildren: () => import('./modules/credit-notes/credit-notes.module').then(m => m.CreditNotesModule)
  },
  {
    path: 'reports',
    loadChildren: () => import('./modules/reports/reports.module').then(m => m.ReportsModule)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
