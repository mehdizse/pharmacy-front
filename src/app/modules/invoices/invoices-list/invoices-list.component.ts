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
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';

import { Invoice, InvoiceStatus } from '../../../shared/models/business.model';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../shared/models/api.model';
import { PdfService } from '../../../core/services/pdf.service';
import { DateService } from '../../../core/services/date.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

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
    MatChipsModule,
    RouterModule
  ],
  template: `
    <div class="invoices-container">
      <!-- Header -->
      <div class="invoices-header">
        <div>
          <h1 class="invoices-title">Factures</h1>
          <div class="page-info">
            <mat-icon class="page-icon">receipt</mat-icon>
            <span class="page-text">Gestion des factures fournisseurs</span>
            <span class="page-badge">{{ dataSource.filteredData.length }} facture{{ dataSource.filteredData.length > 1 ? 's' : '' }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button mat-stroked-button class="export-btn">
            <mat-icon>download</mat-icon>
            Exporter
          </button>
          <button mat-flat-button color="primary" routerLink="/invoices/new" class="new-invoice-btn">
            <mat-icon>add</mat-icon>
            Nouvelle facture
          </button>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="filters-section">
        <div class="filters-header">
          <h2 class="filters-title">Filtres</h2>
          <button mat-button class="reset-btn" (click)="resetFilters()" [class.hidden]="!hasActiveFilters()">
            <mat-icon>refresh</mat-icon>
            Réinitialiser
          </button>
        </div>
        
        <div class="filters-container">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Rechercher...</mat-label>
            <input matInput 
                   (keyup)="applyFilter($event)" 
                   placeholder="Numéro, fournisseur..."
                   #searchInput>
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Statut</mat-label>
            <mat-select (selectionChange)="filterByStatus($event.value)">
              <mat-option value="">Tous</mat-option>
              <mat-option value="PENDING">En attente</mat-option>
              <mat-option value="PAID">Payée</mat-option>
              <mat-option value="OVERDUE">En retard</mat-option>
              <mat-option value="CANCELLED">Annulée</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
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
        
        <!-- Filtres actifs -->
        <div class="active-filters" [class.hidden]="!hasActiveFilters()">
          <span class="active-filters-label">Filtres actifs:</span>
          <div class="filter-tags">
            <mat-chip *ngIf="currentStatus" class="filter-tag" (removed)="clearStatusFilter()">
              {{ getStatusText(currentStatus) }}
              <mat-icon matChipRemove>close</mat-icon>
            </mat-chip>
            <mat-chip *ngIf="currentPeriod" class="filter-tag" (removed)="clearPeriodFilter()">
              {{ getPeriodLabel(currentPeriod) }}
              <mat-icon matChipRemove>close</mat-icon>
            </mat-chip>
          </div>
        </div>
      </div>

      <!-- Invoices Table -->
      <div class="table-card">
        <div class="table-header">
          <div class="table-title-section">
            <h2>Liste des factures</h2>
            <span class="table-count">{{ dataSource.filteredData.length }} facture{{ dataSource.filteredData.length > 1 ? 's' : '' }}</span>
          </div>
          <button mat-flat-button color="primary" routerLink="/invoices/new" class="new-invoice-btn">
            <mat-icon>add</mat-icon>
            Nouvelle facture
          </button>
        </div>
        <div class="table-container">
          <div class="table-wrapper">
            <table class="invoices-table">
              <thead>
                <tr>
                  <th class="col-number">N° Facture</th>
                  <th class="col-supplier">Fournisseur</th>
                  <th class="col-date">Date facture</th>
                  <th class="col-due">Échéance</th>
                  <th class="col-amount">Net à payer</th>
                  <th class="col-status">Statut</th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let invoice of dataSource.filteredData" class="table-row">
                  <td class="col-number">
                    <div class="invoice-number">
                      <mat-icon class="invoice-icon">receipt</mat-icon>
                      <span class="invoice-text">{{ invoice.invoiceNumber }}</span>
                    </div>
                  </td>
                  <td class="col-supplier">
                    <div class="supplier-info">
                      <span class="supplier-name">{{ invoice.supplier.name }}</span>
                    </div>
                  </td>
                  <td class="col-date">
                    <div class="date-info">
                      <span class="date-text">{{ formatDate(invoice.invoiceDate) }}</span>
                    </div>
                  </td>
                  <td class="col-due">
                    <div class="due-info">
                      <span class="due-text">{{ formatDate(invoice.dueDate) }}</span>
                    </div>
                  </td>
                  <td class="col-amount">
                    <span class="amount">{{ formatCurrency(invoice.netToPay) }}</span>
                  </td>
                  <td class="col-status">
                    <span class="status-badge" [ngClass]="getStatusClass(invoice.status)">
                      {{ getStatusText(invoice.status) }}
                    </span>
                  </td>
                  <td class="col-actions">
                    <div class="action-buttons">
                      <button mat-icon-button 
                              color="primary" 
                              [routerLink]="['/invoices', invoice.id]"
                              matTooltip="Voir les détails"
                              class="action-btn">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button 
                              color="accent" 
                              [routerLink]="['/invoices', invoice.id, 'edit']"
                              matTooltip="Modifier"
                              class="action-btn">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button 
                              color="primary"
                              (click)="generatePDF(invoice)"
                              matTooltip="Générer PDF"
                              class="action-btn">
                        <mat-icon>picture_as_pdf</mat-icon>
                      </button>
                      <button mat-icon-button 
                              [matMenuTriggerFor]="menu"
                              matTooltip="Plus d'options"
                              class="action-btn">
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
                        <button mat-menu-item (click)="deleteInvoice(invoice)" class="text-red-600">
                          <mat-icon>delete</mat-icon>
                          Supprimer
                        </button>
                      </mat-menu>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="empty-state" *ngIf="dataSource.filteredData.length === 0 && !isLoading">
            <div class="empty-content">
              <mat-icon class="empty-icon">receipt_long</mat-icon>
              <h3 class="empty-title">Aucune facture trouvée</h3>
              <p class="empty-description">
                {{ hasActiveFilters() ? 'Essayez de modifier les filtres pour voir plus de résultats.' : 'Commencez par créer votre première facture.' }}
              </p>
              <button mat-flat-button 
                      color="primary" 
                      routerLink="/invoices/new"
                      *ngIf="!hasActiveFilters()"
                      class="empty-action">
                <mat-icon>add</mat-icon>
                Créer une facture
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-overlay">
        <div class="loading-spinner">
          <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
          <span class="loading-text">Chargement des factures...</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .invoices-container {
      padding: 2rem;
      max-width: 1280px;
      margin: 0 auto;
    }

    .invoices-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--surface-color);
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.04);
      border: 1px solid var(--border-light);
    }

    .invoices-title {
      font-size: 2rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.75rem 0;
    }

    .page-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .page-icon {
      font-size: 1rem;
      color: var(--text-secondary);
    }

    .page-text {
      font-weight: 400;
    }

    .page-badge {
      background: var(--primary-soft);
      color: var(--primary-color);
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .export-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-color: var(--border-light);
      color: var(--text-primary);
    }

    .export-btn:hover {
      background: var(--background-color);
    }

    .new-invoice-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Filters Section */
    .filters-section {
      background: var(--surface-color);
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.04);
      padding: 1.5rem;
      margin-bottom: 2rem;
      border: 1px solid var(--border-light);
    }

    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .filters-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .filters-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      align-items: end;
    }

    .filter-field {
      width: 100%;
    }

    .reset-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .reset-btn:hover {
      color: var(--primary-color);
      background: var(--primary-soft);
    }

    .reset-btn.hidden {
      display: none;
    }

    .active-filters {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .active-filters.hidden {
      display: none;
    }

    .active-filters-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .filter-tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filter-tag {
      background: var(--primary-soft);
      color: var(--primary-color);
      font-size: 0.75rem;
      font-weight: 500;
    }

    .table-card {
      background: var(--surface-color);
      border-radius: 14px;
      padding: 1.5rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.04);
      border: 1px solid var(--border-light);
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .table-title-section {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .table-title-section h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .table-count {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .table-wrapper {
      border-radius: 8px;
      border: 1px solid var(--border-light);
      overflow: hidden;
      background: #FFFFFF;
    }

    .invoices-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .invoices-table th {
      background: var(--background-color);
      padding: 1rem;
      text-align: center;
      font-weight: 600;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-light);
      font-size: 0.875rem;
      white-space: nowrap;
    }

    .invoices-table td {
      padding: 0.75rem 0.5rem;
      border-bottom: 1px solid var(--border-light);
      color: var(--text-primary);
      vertical-align: middle;
      text-align: center;
    }

    .table-row {
      transition: background-color 0.15s ease;
    }

    .table-row:hover {
      background: var(--background-color);
    }

    .table-row:last-child td {
      border-bottom: none;
    }

    /* Colonnes spécifiques */
    .col-number {
      width: 14%;
      text-align: center;
    }

    .col-supplier {
      width: 16%;
      text-align: center;
    }

    .col-date {
      width: 12%;
      text-align: center;
    }

    .col-due {
      width: 12%;
      text-align: center;
    }

    .col-amount {
      width: 14%;
      text-align: center;
    }

    .col-status {
      width: 14%;
      text-align: center;
    }

    .col-actions {
      width: 18%;
      text-align: center;
    }

    /* Contenu des cellules */
    .invoice-number {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .invoice-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--text-secondary);
    }

    .invoice-text {
      font-family: 'Inter', monospace;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .supplier-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .supplier-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .date-info, .due-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .date-text, .due-text {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .amount {
      font-weight: 600;
      font-family: 'Inter', monospace;
    }

    /* Badges de statut */
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
      animation: badgeGlow 3s ease-in-out infinite;
    }

    .status-paid {
      background: #DCFCE7;
      color: #16A34A;
    }

    .status-pending {
      background: #FEF3C7;
      color: #D97706;
    }

    .status-overdue {
      background: #FEE2E2;
      color: #DC2626;
    }

    /* Actions */
    .action-buttons {
      display: flex;
      gap: 0.25rem;
      justify-content: center;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      transition: all 0.15s ease;
    }

    .action-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    /* Empty state */
    .empty-state {
      padding: 3rem 2rem;
      text-align: center;
    }

    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      max-width: 400px;
      margin: 0 auto;
    }

    .empty-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: var(--text-secondary);
      opacity: 0.5;
    }

    .empty-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .empty-description {
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .empty-action {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
    }

    .loading-spinner {
      background: #FFFFFF;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .loading-text {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    /* Animations pour les badges */
    @keyframes badgeGlow {
      0%, 100% {
        box-shadow: 0 0 0 0 currentColor;
      }
      50% {
        box-shadow: 0 0 0 4px rgba(0,0,0,0.1);
      }
    }

    /* Amélioration des transitions */
    * {
      transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .invoices-container {
        padding: 1rem;
      }

      .invoices-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .filters-container {
        grid-template-columns: 1fr;
      }

      .table-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .invoices-table {
        font-size: 0.875rem;
      }

      .invoices-table th,
      .invoices-table td {
        padding: 0.5rem;
      }
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
  
  // Properties for filters
  currentStatus: string = '';
  currentPeriod: string = '';

  constructor(
    private apiService: ApiService,
    private pdfService: PdfService,
    private dateService: DateService,
    private confirmationService: ConfirmationService
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
    this.currentStatus = status;
    
    if (!this.invoices || this.invoices.length === 0) {
      return;
    }
    
    // Set custom filter predicate for status filtering
    this.dataSource.filterPredicate = (data: Invoice, filter: string) => {
      return !filter || data.status === filter;
    };
    
    // Apply filter
    this.dataSource.filter = status || '';
  }

  filterByPeriod(period: string): void {
    this.currentPeriod = period;
    
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
    this.confirmationService.confirmDeleteInvoice(invoice.invoiceNumber).subscribe(confirmed => {
      if (confirmed) {
        this.apiService.delete(`/api/invoices/${invoice.id}/`).subscribe({
          next: () => {
            this.loadInvoices();
          },
          error: (error: any) => {
            console.error('Error deleting invoice:', error);
          }
        });
      }
    });
  }

  markAsPaid(invoice: Invoice): void {
    this.confirmationService.confirmMarkAsPaid(invoice.invoiceNumber).subscribe(confirmed => {
      if (confirmed) {
        this.apiService.patch(`/api/invoices/${invoice.id}/`, { 
          status: InvoiceStatus.PAID,
          isPaid: true,
          paidDate: new Date().toISOString()
        }).subscribe({
          next: () => {
            this.loadInvoices();
          },
          error: (error: any) => {
            console.error('Error marking invoice as paid:', error);
          }
        });
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

  getStatusText(status: InvoiceStatus | string): string {
    const statusMap = {
      [InvoiceStatus.DRAFT]: 'Brouillon',
      [InvoiceStatus.PENDING]: 'En attente',
      [InvoiceStatus.PAID]: 'Payée',
      [InvoiceStatus.OVERDUE]: 'En retard',
      [InvoiceStatus.CANCELLED]: 'Annulée'
    };
    return statusMap[status as InvoiceStatus] || status;
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

  hasActiveFilters(): boolean {
    return !!(this.currentStatus || this.currentPeriod || this.dataSource.filter);
  }

  resetFilters(): void {
    this.currentStatus = '';
    this.currentPeriod = '';
    this.dataSource.filter = '';
    
    // Restore original filter predicate for search
    this.dataSource.filterPredicate = (data: Invoice, filter: string) => {
      const filterStr = filter.trim().toLowerCase();
      return data.invoiceNumber.toLowerCase().includes(filterStr) ||
             data.supplier.name.toLowerCase().includes(filterStr);
    };
    
    // Reset to all invoices
    this.dataSource.data = this.invoices;
  }

  clearStatusFilter(): void {
    this.currentStatus = '';
    this.filterByStatus('');
  }

  clearPeriodFilter(): void {
    this.currentPeriod = '';
    this.filterByPeriod('');
  }

  getPeriodLabel(period: string): string {
    const periodMap: { [key: string]: string } = {
      'current': 'Mois en cours',
      'last': 'Mois dernier',
      'quarter': 'Trimestre',
      'year': 'Année'
    };
    return periodMap[period] || period;
  }
}
