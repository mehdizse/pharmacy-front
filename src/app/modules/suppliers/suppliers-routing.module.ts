import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SuppliersListComponent } from './suppliers-list/suppliers-list.component';
import { SupplierFormComponent } from './supplier-form/supplier-form.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../shared/models/auth.model';

const routes: Routes = [
  {
    path: '',
    component: SuppliersListComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { 
      roles: [UserRole.ADMIN, UserRole.PHARMACIEN, UserRole.COMPTABLE],
      title: 'Fournisseurs - Pharmacie Manager'
    }
  },
  {
    path: 'new',
    component: SupplierFormComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { 
      roles: [UserRole.ADMIN, UserRole.PHARMACIEN],
      title: 'Nouveau fournisseur - Pharmacie Manager'
    }
  },
  {
    path: ':id',
    component: SupplierFormComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { 
      roles: [UserRole.ADMIN, UserRole.PHARMACIEN],
      title: 'Modifier fournisseur - Pharmacie Manager'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuppliersRoutingModule { }
