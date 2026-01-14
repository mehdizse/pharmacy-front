import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';

import { CreditNote, CreditNoteStatus } from '../../../shared/models/business.model';
import { PdfService } from '../../../core/services/pdf.service';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../shared/models/api.model';
import { DateService } from '../../../core/services/date.service';

@Component({
  selector: 'app-credit-notes-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatMenuModule,
    RouterModule
  ],
  template: `
    <div class="p-6">
      <div class="page-header">
        <h1 class="text-3xl font-bold mb-2">Avoirs</h1>
        <p class="text-blue-100">Gestion des avoirs et notes de crédit</p>
      </div>

      <mat-card class="mb-6">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Liste des avoirs</h2>
            <button mat-raised-button color="primary" routerLink="/credit-notes/new">
              <mat-icon>add</mat-icon>
              Nouvel avoir
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <mat-form-field appearance="outline">
              <mat-label>Rechercher...</mat-label>
              <input matInput 
                     (keyup)="applyFilter($event)" 
                     placeholder="Numéro, facture..."
                     #searchInput>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Statut</mat-label>
              <mat-select (selectionChange)="filterByStatus($event.value)">
                <mat-option value="">Tous</mat-option>
                <mat-option value="PENDING">En attente</mat-option>
                <mat-option value="APPLIED">Appliqué</mat-option>
                <mat-option value="CANCELLED">Annulé</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Période</mat-label>
              <mat-select (selectionChange)="filterByPeriod($event.value)">
                <mat-option value="">Toutes</mat-option>
                <mat-option value="current">Mois en cours</mat-option>
                <mat-option value="last">Mois dernier</mat-option>
                <mat-option value="quarter">Trimestre</mat-option>
                <mat-option value="year">Année</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="table-container">
            <table mat-table [dataSource]="dataSource" matSort>
              <ng-container matColumnDef="creditNoteNumber">
                <th mat-header-cell *matHeaderCellDef>Numéro</th>
                <td mat-cell *matCellDef="let creditNote">{{ creditNote.creditNoteNumber }}</td>
              </ng-container>

              <ng-container matColumnDef="invoice">
                <th mat-header-cell *matHeaderCellDef>Facture associée</th>
                <td mat-cell *matCellDef="let creditNote">
                  <ng-container *ngIf="creditNote.invoice?.invoiceNumber; else noInvoice">
                    <a *ngIf="creditNote.invoice?.id" 
                       [routerLink]="['/invoices', creditNote.invoice.id]" 
                       class="text-blue-600 hover:underline">
                      {{ creditNote.invoice?.invoiceNumber }}
                    </a>
                    <span *ngIf="!creditNote.invoice?.id" class="text-gray-700">
                      {{ creditNote.invoice?.invoiceNumber }}
                    </span>
                  </ng-container>
                  <ng-template #noInvoice>
                    <span class="text-gray-500 italic">
                      <small>{{ creditNote.supplier_name || 'Non spécifié' }}</small>
                    </span>
                  </ng-template>
                </td>
              </ng-container>

              <ng-container matColumnDef="creditDate">
                <th mat-header-cell *matHeaderCellDef>Date avoir</th>
                <td mat-cell *matCellDef="let creditNote">
                  {{ formatDate(creditNote.creditDate) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Montant</th>
                <td mat-cell *matCellDef="let creditNote">
                  {{ formatCurrency(creditNote.amount) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="reason">
                <th mat-header-cell *matHeaderCellDef>Motif</th>
                <td mat-cell *matCellDef="let creditNote">
                  <span class="text-gray-600">
                    {{ creditNote.reason || creditNote.motif || '-' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let creditNote">
                  <span [class]="getStatusClass(creditNote.status)" 
                        class="status-badge">
                    {{ getStatusText(creditNote.status) }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let creditNote">
                  <button mat-icon-button 
                          color="primary" 
                          [routerLink]="['/credit-notes', creditNote.id || creditNote.uuid]"
                          matTooltip="Voir les détails">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button 
                          color="accent" 
                          [routerLink]="['/credit-notes', creditNote.id || creditNote.uuid, 'edit']"
                          matTooltip="Modifier"
                          *ngIf="creditNote.status !== 'PAID'">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button 
                          color="primary" 
                          (click)="generatePDF(creditNote)"
                          matTooltip="Générer PDF">
                    <mat-icon>picture_as_pdf</mat-icon>
                  </button>
                  <button mat-icon-button 
                          color="warn" 
                          (click)="deleteCreditNote(creditNote)"
                          matTooltip="Supprimer"
                          *ngIf="creditNote.status === 'DRAFT'">
                    <mat-icon>delete</mat-icon>
                  </button>
                  <button mat-icon-button 
                          color="primary"
                          (click)="duplicateCreditNote(creditNote)"
                          matTooltip="Dupliquer">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <div class="text-center py-8" *ngIf="creditNotes.length === 0 && !isLoading">
              <mat-icon class="text-gray-400 text-6xl">assignment_return</mat-icon>
              <p class="text-gray-600 mt-4">Aucun avoir trouvé</p>
            </div>
          </div>
        </div>
      </mat-card>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
      </div>
    </div>
  `,
  styles: [`
    .mat-mdc-form-field {
      width: 100%;
    }
    
    .mat-mdc-table {
      min-width: 1000px;
    }
    
    .table-container {
      overflow-x: auto;
    }
  `]
})
export class CreditNotesListComponent implements OnInit {
  creditNotes: CreditNote[] = [];
  invoices: any[] = [];
  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = [
    'creditNoteNumber', 
    'invoice', 
    'creditDate', 
    'amount', 
    'reason', 
    'status', 
    'actions'
  ];
  isLoading = false;

  constructor(
    private apiService: ApiService,
    private pdfService: PdfService,
    private dateService: DateService
  ) {
    // Initialiser le locale français pour les dates
    this.dateService.initFrenchLocale();
  }

  ngOnInit(): void {
    this.loadCreditNotes();
  }

  loadCreditNotes(): void {
    this.isLoading = true;

    this.apiService.get<CreditNote[]>('/api/credit-notes/').subscribe({
      next: (response: any) => {
        // Handle different response formats
        if (response && typeof response === 'object') {
          if ('data' in response) {
            this.creditNotes = response.data || [];
          } else if ('results' in response) {
            this.creditNotes = response.results || [];
          } else {
            this.creditNotes = Array.isArray(response) ? response : [];
          }
        } else {
          this.creditNotes = [];
        }

        // Map API response to match our UI expectations
        this.creditNotes = this.creditNotes.map((creditNote: any) => {
          const mappedCreditNote = {
            ...creditNote,
            creditNoteNumber: creditNote.credit_note_number ?? creditNote.creditNoteNumber,
            creditDate: creditNote.credit_note_date ?? creditNote.creditDate,
            amount: typeof creditNote.amount === 'string' ? parseFloat(creditNote.amount) : creditNote.amount,
            reason: creditNote.reason ?? creditNote.motif ?? '',
            status: creditNote.status ?? (creditNote.is_active ? 'PENDING' : 'CANCELLED'),
            invoice: creditNote.invoice_id ? { 
              id: creditNote.invoice_id, 
              invoiceNumber: creditNote.invoice_number 
            } : (creditNote.invoice ? {
              id: creditNote.invoice?.id,
              invoiceNumber: creditNote.invoice?.invoice_number
            } : undefined)
          };
          
          return mappedCreditNote;
        });

        this.dataSource.data = this.creditNotes;

        this.isLoading = false;
      },
      error: (error: any) => {
        this.creditNotes = [];
        this.dataSource.data = [];
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByStatus(status: string): void {
    console.log('Filtering by status:', status);
    
    // Set custom filter predicate for status filtering
    this.dataSource.filterPredicate = (data: CreditNote, filter: string) => {
      return !filter || data.status === filter;
    };
    
    // Apply the filter
    this.dataSource.filter = status || '';
  }

  filterByPeriod(event: any): void {
    const period = event.value || event;
    // Implémentation du filtrage par période
    this.dataSource = new MatTableDataSource(this.creditNotes); // Temporaire
  }

  generatePDF(creditNote: CreditNote): void {
    this.pdfService.generateCreditNotePDF(creditNote);
  }

  deleteCreditNote(creditNote: any): void {
    const creditNoteId = creditNote.id || (creditNote as any).uuid;
    if (!creditNoteId) {
      return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'avoir ${creditNote.creditNoteNumber} ?`)) {
      this.apiService.delete(`/api/credit-notes/${creditNoteId}/`).subscribe({
        next: () => {
          this.loadCreditNotes();
        },
        error: (error: any) => {
          // Error handling
        }
      });
    }
  }

  applyCreditNote(creditNote: CreditNote): void {
    this.apiService.patch(`/api/credit-notes/${creditNote.id}/`, { 
      status: CreditNoteStatus.APPLIED 
    }).subscribe({
      next: () => {
        this.loadCreditNotes();
      },
      error: (error: any) => {
        console.error('Error applying credit note:', error);
      }
    });
  }

  duplicateCreditNote(creditNote: CreditNote): void {
    // Implémentation de la duplication
    console.log('Duplicating credit note:', creditNote);
  }

  formatDate(dateString: string): string {
    return this.dateService.formatDate(dateString);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'DRAFT': 'Brouillon',
      'PENDING': 'En attente',
      'APPLIED': 'Appliqué',
      'CANCELLED': 'Annulé'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'DRAFT': 'status-pending',
      'PENDING': 'status-pending',
      'APPLIED': 'status-paid',
      'CANCELLED': 'status-overdue'
    };
    return classMap[status] || 'status-pending';
  }
}
