import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

import { CreditNote, CreditNoteStatus } from '../../../shared/models/business.model';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../shared/models/api.model';
import { DateService } from '../../../core/services/date.service';
import { PdfService } from '../../../core/services/pdf.service';

@Component({
  selector: 'app-credit-note-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterModule
  ],
  template: `
    <div class="p-6">
      <div class="page-header">
        <h1 class="text-3xl font-bold mb-2">Détails Avoir</h1>
        <div class="page-info">
          <mat-icon class="page-icon">assignment_return</mat-icon>
          <span class="page-text">Informations détaillées de l\'avoir</span>
        </div>
      </div>

      <div class="max-w-4xl mx-auto">
        <mat-card class="mb-6" *ngIf="!isLoading && creditNote">
          <div class="p-6">
            <!-- En-tête avoir -->
            <div class="border-b pb-4 mb-6">
              <div class="flex justify-between items-start">
                <div>
                  <h2 class="text-2xl font-bold text-blue-600 mb-2">
                    Avoir N° {{ creditNote.creditNoteNumber }}
                  </h2>
                  <p class="text-gray-600">
                    Date: {{ formatDate(creditNote.creditDate) }}
                  </p>
                </div>
                <div class="text-right">
                  <span [class]="getStatusClass(creditNote.status)" class="status-badge">
                    {{ getStatusText(creditNote.status) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Informations facture associée -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6" *ngIf="creditNote.invoice">
              <div class="border rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4">Facture associée</h3>
                <div class="space-y-2">
                  <p><strong>Numéro:</strong> 
                    <a *ngIf="creditNote.invoice?.id" 
                       [routerLink]="['/invoices', creditNote.invoice.id]" 
                       class="text-blue-600 hover:underline">
                      {{ creditNote.invoice.invoiceNumber }}
                    </a>
                    <span *ngIf="!creditNote.invoice?.id">{{ creditNote.invoice.invoiceNumber || '-' }}</span>
                  </p>
                </div>
              </div>

              <div class="border rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4">Montant</h3>
                <div class="space-y-2">
                  <p class="text-2xl font-bold text-blue-600">
                    {{ formatCurrency(creditNote.amount) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Motif -->
            <div class="border rounded-lg p-4 mb-6" *ngIf="creditNote.reason">
              <h3 class="text-lg font-semibold mb-4">Motif</h3>
              <p class="text-gray-700 whitespace-pre-wrap">{{ creditNote.reason }}</p>
            </div>

            <!-- Actions -->
            <div class="flex justify-between">
              <button mat-stroked-button 
                      type="button" 
                      routerLink="/credit-notes"
                      matTooltip="Retour à la liste">
                <mat-icon>arrow_back</mat-icon>
                Retour
              </button>
              
              <div class="space-x-4">
                <button mat-stroked-button 
                        type="button" 
                        [routerLink]="['/credit-notes', creditNote.id, 'edit']"
                        matTooltip="Modifier">
                  <mat-icon>edit</mat-icon>
                  Modifier
                </button>
                
                <button mat-raised-button 
                        color="primary" 
                        type="button" 
                        (click)="generatePDF()"
                        matTooltip="Générer PDF">
                  <mat-icon>picture_as_pdf</mat-icon>
                  PDF
                </button>
              </div>
            </div>
          </div>
        </mat-card>

        <!-- Loading -->
        <div class="text-center py-12" *ngIf="isLoading">
          <mat-progress-spinner diameter="40"></mat-progress-spinner>
          <p class="mt-4 text-gray-600">Chargement des détails...</p>
        </div>

        <!-- Erreur -->
        <div class="text-center py-12" *ngIf="!isLoading && !creditNote">
          <mat-icon class="text-red-500 text-6xl">error</mat-icon>
          <p class="mt-4 text-red-600">Avoir non trouvé</p>
          <button mat-stroked-button 
                  type="button" 
                  routerLink="/credit-notes"
                  class="mt-4">
            Retour à la liste
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mat-mdc-form-field {
      width: 100%;
    }
    
    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    
    .status-pending {
      background-color: #fef3c7;
      color: #92400e;
    }
    
    .status-applied {
      background-color: #dcfce7;
      color: #166534;
    }
    
    .status-cancelled {
      background-color: #fecaca;
      color: #dc2626;
    }
  `]
})
export class CreditNoteDetailsComponent implements OnInit {
  creditNote: CreditNote | null = null;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private dateService: DateService,
    private pdfService: PdfService
  ) {
    this.dateService.initFrenchLocale();
  }

  ngOnInit(): void {
    this.loadCreditNote();
  }

  loadCreditNote(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/credit-notes']);
      return;
    }

    this.isLoading = true;
    this.apiService.get<CreditNote>(`/api/credit-notes/${id}/`).subscribe({
      next: (response: any) => {
        const creditNote = response && typeof response === 'object' && 'data' in response ? response.data : response;
        
        this.creditNote = {
          ...creditNote,
          creditNoteNumber: creditNote.credit_note_number || creditNote.creditNoteNumber,
          creditDate: creditNote.credit_note_date || creditNote.creditDate,
          amount: typeof creditNote.amount === 'string' ? parseFloat(creditNote.amount) : creditNote.amount,
          reason: creditNote.reason || creditNote.motif || '',
          status: creditNote.status || 'PENDING',
          invoice: creditNote.invoice_id || creditNote.invoiceId ? {
            id: creditNote.invoice_id || creditNote.invoiceId,
            invoiceNumber: creditNote.invoice_number || creditNote.invoiceNumber
          } : undefined
        };
        
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
      }
    });
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

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'status-pending',
      'APPLIED': 'status-applied',
      'CANCELLED': 'status-cancelled'
    };
    return statusMap[status] || 'status-pending';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'En attente',
      'APPLIED': 'Appliqué',
      'CANCELLED': 'Annulé'
    };
    return statusMap[status] || status;
  }

  generatePDF(): void {
    if (this.creditNote) {
      this.pdfService.generateCreditNotePDF(this.creditNote);
    }
  }
}
