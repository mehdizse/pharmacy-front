import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  constructor(private dialog: MatDialog) {}

  confirm(data: ConfirmDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      disableClose: false,
      hasBackdrop: true,
      panelClass: 'confirm-dialog-panel',
      data: {
        title: data.title || 'Confirmation',
        message: data.message || 'Êtes-vous sûr de vouloir continuer ?',
        confirmText: data.confirmText || 'Confirmer',
        cancelText: data.cancelText || 'Annuler',
        type: data.type || 'warning'
      }
    });

    return dialogRef.afterClosed();
  }

  // Méthodes pratiques pour les types de confirmation courants
  confirmDelete(itemName: string, itemType: string = 'cet élément'): Observable<boolean> {
    return this.confirm({
      title: 'Confirmation de suppression',
      message: `Êtes-vous sûr de vouloir supprimer ${itemType} "${itemName}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });
  }

  confirmDeleteSupplier(supplierName: string): Observable<boolean> {
    return this.confirm({
      title: 'Supprimer le fournisseur',
      message: `Êtes-vous sûr de vouloir supprimer le fournisseur "${supplierName}" ? Cette action est irréversible et supprimera également toutes les factures associées.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });
  }

  confirmDeleteInvoice(invoiceNumber: string): Observable<boolean> {
    return this.confirm({
      title: 'Supprimer la facture',
      message: `Êtes-vous sûr de vouloir supprimer la facture "${invoiceNumber}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });
  }

  confirmDeleteCreditNote(creditNoteNumber: string): Observable<boolean> {
    return this.confirm({
      title: 'Supprimer l\'avoir',
      message: `Êtes-vous sûr de vouloir supprimer l\'avoir "${creditNoteNumber}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });
  }

  confirmLogout(): Observable<boolean> {
    return this.confirm({
      title: 'Déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      confirmText: 'Se déconnecter',
      cancelText: 'Annuler',
      type: 'info'
    });
  }

  confirmMarkAsPaid(invoiceNumber: string): Observable<boolean> {
    return this.confirm({
      title: 'Marquer comme payée',
      message: `Êtes-vous sûr de vouloir marquer la facture "${invoiceNumber}" comme payée ?`,
      confirmText: 'Confirmer',
      cancelText: 'Annuler',
      type: 'warning'
    });
  }

  confirmApplyCreditNote(creditNoteNumber: string): Observable<boolean> {
    return this.confirm({
      title: 'Appliquer l\'avoir',
      message: `Êtes-vous sûr de vouloir appliquer l\'avoir "${creditNoteNumber}" ?`,
      confirmText: 'Appliquer',
      cancelText: 'Annuler',
      type: 'warning'
    });
  }
}
