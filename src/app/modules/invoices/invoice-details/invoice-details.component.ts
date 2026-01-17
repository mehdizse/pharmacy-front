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

import { Invoice, InvoiceStatus } from '../../../shared/models/business.model';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../shared/models/api.model';
import { DateService } from '../../../core/services/date.service';
import { PdfService } from '../../../core/services/pdf.service';

@Component({
  selector: 'app-invoice-details',
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
        <h1 class="text-3xl font-bold mb-2">Détails Facture</h1>
        <div class="page-info">
          <mat-icon class="page-icon">receipt_long</mat-icon>
          <span class="page-text">Informations détaillées de la facture</span>
        </div>
      </div>

      <div class="max-w-4xl mx-auto">
        <mat-card class="mb-6" *ngIf="!isLoading && invoice">
          <div class="p-6">
            <!-- En-tête facture -->
            <div class="border-b pb-4 mb-6">
              <div class="flex justify-between items-start">
                <div>
                  <h2 class="text-2xl font-bold text-blue-600 mb-2">
                    Facture N° {{ invoice.invoiceNumber }}
                  </h2>
                  <p class="text-gray-600">
                    Date: {{ formatDate(invoice.invoiceDate) }}
                  </p>
                  <p class="text-gray-600" *ngIf="invoice.dueDate">
                    Échéance: {{ formatDate(invoice.dueDate) }}
                  </p>
                </div>
                <div class="text-right">
                  <span [class]="getStatusClass(invoice.status)" class="status-badge">
                    {{ getStatusText(invoice.status) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Informations fournisseur -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div class="border rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4">Fournisseur</h3>
                <div class="space-y-2">
                  <p><strong>Nom:</strong> {{ invoice.supplier.name }}</p>
                  <p><strong>Adresse:</strong> {{ invoice.supplier.address }}</p>
                  <p><strong>Code postal:</strong> {{ invoice.supplier.postalCode }}</p>
                  <p><strong>Ville:</strong> {{ invoice.supplier.city }}</p>
                  <p><strong>Téléphone:</strong> {{ invoice.supplier.phone }}</p>
                  <p *ngIf="invoice.supplier.email"><strong>Email:</strong> {{ invoice.supplier.email }}</p>
                </div>
              </div>

              <div class="border rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4">Montant</h3>
                <div class="space-y-2">
                  <p class="text-2xl font-bold text-blue-600">
                    Net à payer: {{ formatCurrency(invoice.netToPay) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="border rounded-lg p-4 mb-6" *ngIf="invoice.notes">
              <h3 class="text-lg font-semibold mb-4">Notes</h3>
              <p class="text-gray-700 whitespace-pre-wrap">{{ invoice.notes }}</p>
            </div>

            <!-- Actions -->
            <div class="flex justify-between items-center">
              <button mat-stroked-button 
                      type="button" 
                      routerLink="/invoices"
                      matTooltip="Retour à la liste">
                <mat-icon>arrow_back</mat-icon>
                Retour
              </button>
              
              <div class="space-x-4">
                <button mat-stroked-button 
                        type="button" 
                        [routerLink]="['/invoices', invoice.id, 'edit']"
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
        <div class="text-center py-12" *ngIf="!isLoading && !invoice">
          <mat-icon class="text-red-500 text-6xl">error</mat-icon>
          <p class="mt-4 text-red-600">Facture non trouvée</p>
          <button mat-stroked-button 
                  type="button" 
                  routerLink="/invoices"
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
    
    .status-paid {
      background-color: #dcfce7;
      color: #166534;
    }
    
    .status-pending {
      background-color: #fef3c7;
      color: #92400e;
    }
    
    .status-overdue {
      background-color: #fee2e2;
      color: #991b1b;
    }
    
    .status-draft {
      background-color: #f3f4f6;
      color: #374151;
    }
    
    .status-cancelled {
      background-color: #fecaca;
      color: #dc2626;
    }
  `]
})
export class InvoiceDetailsComponent implements OnInit {
  invoice: Invoice | null = null;
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
    this.loadInvoice();
  }

  loadInvoice(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/invoices']);
      return;
    }

    this.isLoading = true;
    this.apiService.get<Invoice>(`/api/invoices/${id}/`).subscribe({
      next: (response: any) => {
        const invoice = response && typeof response === 'object' && 'data' in response ? response.data : response;
        
        this.invoice = {
          ...invoice,
          invoiceNumber: invoice.invoice_number,
          invoiceDate: invoice.invoice_date,
          dueDate: invoice.due_date,
          netToPay: invoice.net_to_pay || invoice.netToPay || 0,
          supplier: {
            name: invoice.supplier_name || invoice.supplier?.name || '',
            address: invoice.supplier_address || invoice.supplier?.address || '',
            postalCode: invoice.supplier_postal_code || invoice.supplier?.postalCode || '',
            city: invoice.supplier_city || invoice.supplier?.city || '',
            phone: invoice.supplier_phone || invoice.supplier?.phone || '',
            email: invoice.supplier_email || invoice.supplier?.email || ''
          },
          status: invoice.status || 'PENDING',
          notes: invoice.notes || ''
        };
        
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading invoice:', error);
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
      'PAID': 'status-paid',
      'PENDING': 'status-pending',
      'OVERDUE': 'status-overdue',
      'DRAFT': 'status-draft',
      'CANCELLED': 'status-cancelled'
    };
    return statusMap[status] || 'status-pending';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'DRAFT': 'Brouillon',
      'PENDING': 'En attente',
      'PAID': 'Payée',
      'OVERDUE': 'En retard',
      'CANCELLED': 'Annulée'
    };
    return statusMap[status] || status;
  }

  generatePDF(): void {
    if (this.invoice) {
      this.pdfService.generateInvoicePDF(this.invoice);
    }
  }
}
