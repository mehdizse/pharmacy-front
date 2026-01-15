import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvoicesListComponent } from './invoices-list/invoices-list.component';
import { InvoiceFormComponent } from './invoice-form/invoice-form.component';
import { InvoiceDetailsComponent } from './invoice-details/invoice-details.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../shared/models/auth.model';

const routes: Routes = [
  {
    path: '',
    component: InvoicesListComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { 
      roles: [UserRole.ADMIN, UserRole.PHARMACIEN, UserRole.COMPTABLE],
      title: 'Factures - Pharmacie Manager'
    }
  },
  {
    path: 'new',
    component: InvoiceFormComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { 
      roles: [UserRole.ADMIN, UserRole.PHARMACIEN, UserRole.COMPTABLE],
      title: 'Nouvelle facture - Pharmacie Manager'
    }
  },
  {
    path: ':id',
    component: InvoiceDetailsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { 
      roles: [UserRole.ADMIN, UserRole.PHARMACIEN, UserRole.COMPTABLE],
      title: 'Détails facture - Pharmacie Manager'
    }
  },
  {
    path: ':id/edit',
    component: InvoiceFormComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { 
      roles: [UserRole.ADMIN, UserRole.PHARMACIEN, UserRole.COMPTABLE],
      title: 'Modifier facture - Pharmacie Manager'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvoicesRoutingModule { }
