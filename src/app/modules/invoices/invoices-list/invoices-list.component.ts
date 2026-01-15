import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

import { Invoice, InvoiceStatus } from '../../../shared/models/business.model';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../shared/models/api.model';
import { PdfService } from '../../../core/services/pdf.service';
import { DateService } from '../../../core/services/date.service';

@Component({
  selector: 'app-invoices-list',
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
    MatMenuModule,
    MatSelectModule,
    MatTooltipModule,
    RouterModule
  ],
  template: `
    <div class="p-6">
      <div class="page-header">
        <h1 class="text-3xl font-bold mb-2">Factures</h1>
        <p class="text-blue-100">Gestion des factures fournisseurs</p>
      </div>

      <mat-card class="mb-6">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Liste des factures</h2>
            <button mat-raised-button color="primary" routerLink="/invoices/new">
              <mat-icon>add</mat-icon>
              Nouvelle facture
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <mat-form-field appearance="outline">
              <mat-label>Rechercher...</mat-label>
              <input matInput 
                     (keyup)="applyFilter($event)" 
                     placeholder="Numéro, fournisseur..."
                     #searchInput>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Statut</mat-label>
              <mat-select (selectionChange)="filterByStatus($event.value)">
                <mat-option value="">Tous</mat-option>
                <mat-option value="PENDING">En attente</mat-option>
                <mat-option value="PAID">Payée</mat-option>
                <mat-option value="OVERDUE">En retard</mat-option>
                <mat-option value="CANCELLED">Annulée</mat-option>
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
              <ng-container matColumnDef="invoiceNumber">
                <th mat-header-cell *matHeaderCellDef>Numéro</th>
                <td mat-cell *matCellDef="let invoice">{{ invoice.invoiceNumber }}</td>
              </ng-container>

              <ng-container matColumnDef="supplier">
                <th mat-header-cell *matHeaderCellDef>Fournisseur</th>
                <td mat-cell *matCellDef="let invoice">{{ invoice.supplier.name }}</td>
              </ng-container>

              <ng-container matColumnDef="invoiceDate">
                <th mat-header-cell *matHeaderCellDef>Date facture</th>
                <td mat-cell *matCellDef="let invoice">
                  {{ formatDate(invoice.invoiceDate) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="dueDate">
                <th mat-header-cell *matHeaderCellDef>Échéance</th>
                <td mat-cell *matCellDef="let invoice">
                  {{ formatDate(invoice.dueDate) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="netToPay">
                <th mat-header-cell *matHeaderCellDef>Net à payer</th>
                <td mat-cell *matCellDef="let invoice">
                  {{ formatCurrency(invoice.netToPay) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let invoice">
                  <span [class]="getStatusClass(invoice.status)" 
                        class="status-badge">
                    {{ getStatusText(invoice.status) }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let invoice">
                  <button mat-icon-button 
                          color="primary" 
                          [routerLink]="['/invoices', invoice.id]"
                          matTooltip="Voir les détails">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button 
                          color="accent" 
                          [routerLink]="['/invoices', invoice.id, 'edit']"
                          matTooltip="Modifier">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button 
                          color="primary" 
                          (click)="generatePDF(invoice)"
                          matTooltip="Générer PDF">
                    <mat-icon>picture_as_pdf</mat-icon>
                  </button>
                  <button mat-icon-button 
                          color="warn" 
                          (click)="deleteInvoice(invoice)"
                          matTooltip="Supprimer">
                    <mat-icon>delete</mat-icon>
                  </button>
                  <button mat-icon-button 
                          [matMenuTriggerFor]="menu"
                          matTooltip="Plus d'options">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="markAsPaid(invoice)" 
                            *ngIf="invoice.status === 'PENDING'">
                      <mat-icon>paid</mat-icon>
                      Marquer comme payée
                    </button>
                    <button mat-menu-item (click)="duplicateInvoice(invoice)">
                      <mat-icon>content_copy</mat-icon>
                      Dupliquer
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <div class="text-center py-8" *ngIf="invoices.length === 0 && !isLoading">
              <mat-icon class="text-gray-400 text-6xl">receipt</mat-icon>
              <p class="text-gray-600 mt-4">Aucune facture trouvée</p>
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
export class InvoicesListComponent implements OnInit {
  invoices: Invoice[] = [];
  dataSource = new MatTableDataSource<Invoice>();
  displayedColumns: string[] = [
    'invoiceNumber', 
    'supplier', 
    'invoiceDate', 
    'dueDate', 
    'netToPay', 
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
    this.loadInvoices();
    
    // Configure filter predicate for global search (number, supplier)
    this.dataSource.filterPredicate = (data: Invoice, filter: string) => {
      const filterStr = filter.trim().toLowerCase();
      return data.invoiceNumber.toLowerCase().includes(filterStr) ||
             data.supplier.name.toLowerCase().includes(filterStr);
    };
  }

  loadInvoices(): void {
    this.isLoading = true;
    
    this.apiService.get<Invoice[]>('/api/invoices/').subscribe({
      next: (response: any) => {
        
        // Handle different response formats
        if (response && typeof response === 'object') {
          if ('data' in response) {
            this.invoices = response.data || [];
          } else if ('results' in response) {
            this.invoices = response.results || [];
          } else {
            this.invoices = Array.isArray(response) ? response : [];
          }
        } else {
          this.invoices = [];
        }
        
        // Map API response to match our interface
        this.invoices = this.invoices.map((invoice: any) => ({
          ...invoice,
          invoiceNumber: invoice.invoice_number,
          invoiceDate: invoice.invoice_date,
          dueDate: invoice.due_date,
          netToPay: parseFloat(invoice.net_to_pay),
          supplier: {
            name: invoice.supplier_name,
            code: invoice.supplier_code
          },
          status: invoice.status || 'PENDING'
        }));
        
        this.dataSource.data = this.invoices;
        
        this.isLoading = false;
      },
      error: (error: any) => {
        this.invoices = [];
        this.dataSource.data = this.invoices;
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    if (!this.invoices || this.invoices.length === 0) {
      return;
    }
    
    const filterValue = (event.target as HTMLInputElement).value;
    
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByStatus(status: string): void {
    if (!this.invoices || this.invoices.length === 0) {
      return;
    }
    
    // Set custom filter predicate for status filtering
    this.dataSource.filterPredicate = (data: Invoice, filter: string) => {
      return !filter || data.status === filter;
    };
    
    // Apply the filter
    this.dataSource.filter = status || '';
  }

  filterByPeriod(period: string): void {
    if (!this.invoices || this.invoices.length === 0) {
      return;
    }
    
    if (!period) {
      // Reset to all invoices
      this.dataSource.data = this.invoices;
      // Restore the original filter predicate for search
      this.dataSource.filterPredicate = (data: Invoice, filter: string) => {
        const filterStr = filter.trim().toLowerCase();
        return data.invoiceNumber.toLowerCase().includes(filterStr) ||
               data.supplier.name.toLowerCase().includes(filterStr);
      };
      return;
    }
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 = Janvier, 1 = Février, etc.
    
    // Set custom filter predicate for period filtering
    this.dataSource.filterPredicate = (data: Invoice, filter: string) => {
      if (!data.invoiceDate) return false;
      
      const invoiceDate = new Date(data.invoiceDate);
      const invoiceYear = invoiceDate.getFullYear();
      const invoiceMonth = invoiceDate.getMonth();
      
      switch (period) {
        case 'current':
          return invoiceYear === currentYear && invoiceMonth === currentMonth;
          
        case 'last':
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return invoiceYear === lastMonthYear && invoiceMonth === lastMonth;
          
        case 'quarter':
          const currentQuarter = Math.floor(currentMonth / 3);
          const invoiceQuarter = Math.floor(invoiceMonth / 3);
          return invoiceYear === currentYear && invoiceQuarter === currentQuarter;
          
        case 'year':
          return invoiceYear === currentYear;
          
        default:
          return true;
      }
    };
    
    // Apply the filter
    this.dataSource.filter = 'period_filter';
  }

  generatePDF(invoice: Invoice): void {
    this.pdfService.generateInvoicePDF(invoice);
  }

  deleteInvoice(invoice: Invoice): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la facture ${invoice.invoiceNumber} ?`)) {
      this.apiService.delete(`/api/invoices/${invoice.id}/`).subscribe({
        next: () => {
          this.loadInvoices();
        },
        error: (error: any) => {
          // Handle error silently
        }
      });
    }
  }

  markAsPaid(invoice: Invoice): void {
    this.apiService.patch(`/api/invoices/${invoice.id}/`, { 
      status: InvoiceStatus.PAID,
      isPaid: true,
      paidDate: new Date().toISOString()
    }).subscribe({
      next: () => {
        this.loadInvoices();
      },
      error: (error: any) => {
        // Handle error silently
      }
    });
  }

  duplicateInvoice(invoice: Invoice): void {
    // Implémentation de la duplication
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

  getStatusText(status: InvoiceStatus): string {
    const statusMap = {
      [InvoiceStatus.DRAFT]: 'Brouillon',
      [InvoiceStatus.PENDING]: 'En attente',
      [InvoiceStatus.PAID]: 'Payée',
      [InvoiceStatus.OVERDUE]: 'En retard',
      [InvoiceStatus.CANCELLED]: 'Annulée'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: InvoiceStatus): string {
    const classMap = {
      [InvoiceStatus.DRAFT]: 'status-pending',
      [InvoiceStatus.PENDING]: 'status-pending',
      [InvoiceStatus.PAID]: 'status-paid',
      [InvoiceStatus.OVERDUE]: 'status-overdue',
      [InvoiceStatus.CANCELLED]: 'status-overdue'
    };
    return classMap[status] || 'status-pending';
  }
}
