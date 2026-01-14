import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreditNotesListComponent } from './credit-notes-list/credit-notes-list.component';
import { CreditNoteFormComponent } from './credit-note-form/credit-note-form.component';
import { CreditNoteDetailsComponent } from './credit-note-details/credit-note-details.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../shared/models/auth.model';

const routes: Routes = [
  {
    path: '',
    component: CreditNotesListComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { 
      roles: [UserRole.ADMIN, UserRole.PHARMACIEN, UserRole.COMPTABLE],
      title: 'Avoirs - Pharmacie Manager'
    }
  },
  {
    path: 'new',
    component: CreditNoteFormComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { 
      roles: [UserRole.ADMIN, UserRole.PHARMACIEN],
      title: 'Nouvel avoir - Pharmacie Manager'
    }
  },
  {
    path: ':id',
    component: CreditNoteDetailsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { 
      roles: [UserRole.ADMIN, UserRole.PHARMACIEN, UserRole.COMPTABLE],
      title: 'Détails avoir - Pharmacie Manager'
    }
  },
  {
    path: ':id/edit',
    component: CreditNoteFormComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { 
      roles: [UserRole.ADMIN, UserRole.PHARMACIEN],
      title: 'Modifier avoir - Pharmacie Manager'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CreditNotesRoutingModule { }
