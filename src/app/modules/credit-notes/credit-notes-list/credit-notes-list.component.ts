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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { CreditNote, CreditNoteStatus } from '../../../shared/models/business.model';
import { PdfService } from '../../../core/services/pdf.service';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../shared/models/api.model';
import { DateService } from '../../../core/services/date.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

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
    MatTooltipModule,
    MatChipsModule,
    RouterModule
  ],
  template: `
    <div class="credit-notes-container">
      <!-- Header -->
      <div class="credit-notes-header">
        <div>
          <h1 class="credit-notes-title">Avoirs</h1>
          <div class="page-info">
            <mat-icon class="page-icon">assignment_return</mat-icon>
            <span class="page-text">Gestion des avoirs et notes de crédit</span>
            <span class="page-badge">{{ dataSource.filteredData.length }} avoir{{ dataSource.filteredData.length > 1 ? 's' : '' }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button mat-stroked-button class="export-btn">
            <mat-icon>download</mat-icon>
            Exporter
          </button>
          <button mat-flat-button color="primary" routerLink="/credit-notes/new" class="new-credit-note-btn">
            <mat-icon>add</mat-icon>
            Nouvel avoir
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
                   placeholder="Numéro, facture..."
                   #searchInput>
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Statut</mat-label>
            <mat-select (selectionChange)="filterByStatus($event.value)">
              <mat-option value="">Tous</mat-option>
              <mat-option value="PENDING">En attente</mat-option>
              <mat-option value="APPLIED">Appliqué</mat-option>
              <mat-option value="CANCELLED">Annulé</mat-option>
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

      <!-- Credit Notes Table -->
      <div class="table-card">
        <div class="table-header">
          <div class="table-title-section">
            <h2>Liste des avoirs</h2>
            <span class="table-count">{{ dataSource.filteredData.length }} avoir{{ dataSource.filteredData.length > 1 ? 's' : '' }}</span>
          </div>
          <button mat-flat-button color="primary" routerLink="/credit-notes/new" class="new-credit-note-btn">
            <mat-icon>add</mat-icon>
            Nouvel avoir
          </button>
        </div>
        <div class="table-container">
          <div class="table-wrapper">
            <table class="credit-notes-table">
              <thead>
                <tr>
                  <th class="col-number">N° Avoir</th>
                  <th class="col-invoice">Facture associée</th>
                  <th class="col-date">Date avoir</th>
                  <th class="col-amount">Montant</th>
                  <th class="col-reason">Motif</th>
                  <th class="col-status">Statut</th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let creditNote of dataSource.filteredData" class="table-row">
                  <td class="col-number">
                    <div class="credit-note-number">
                      <mat-icon class="credit-note-icon">assignment_return</mat-icon>
                      <span class="credit-note-text">{{ creditNote.creditNoteNumber }}</span>
                    </div>
                  </td>
                  <td class="col-invoice">
                    <div class="invoice-info">
                      <ng-container *ngIf="creditNote.invoice?.invoiceNumber; else noInvoice">
                        <div class="invoice-link-container" *ngIf="creditNote.invoice?.id">
                          <mat-icon class="invoice-link-icon">receipt</mat-icon>
                          <a [routerLink]="['/invoices', creditNote.invoice.id]" 
                             class="invoice-link"
                             matTooltip="Voir la facture">
                            {{ creditNote.invoice?.invoiceNumber }}
                          </a>
                        </div>
                        <div class="invoice-text-container" *ngIf="!creditNote.invoice?.id">
                          <mat-icon class="invoice-text-icon">receipt</mat-icon>
                          <span class="invoice-text">{{ creditNote.invoice?.invoiceNumber }}</span>
                        </div>
                      </ng-container>
                      <ng-template #noInvoice>
                        <div class="no-invoice-info">
                          <mat-icon class="no-invoice-icon">business</mat-icon>
                          <span class="no-invoice-text">{{ creditNote.supplier_name || 'Non spécifié' }}</span>
                        </div>
                      </ng-template>
                    </div>
                  </td>
                  <td class="col-date">
                    <div class="date-info">
                      <span class="date-text">{{ formatDate(creditNote.creditDate) }}</span>
                    </div>
                  </td>
                  <td class="col-amount">
                    <span class="amount amount-credit">-{{ formatCurrency(creditNote.amount) }}</span>
                  </td>
                  <td class="col-reason">
                    <div class="reason-info">
                      <span class="reason-text" [matTooltip]="creditNote.reason || creditNote.motif" 
                            [matTooltipDisabled]="!creditNote.reason && !creditNote.motif">
                        {{ (creditNote.reason || creditNote.motif || '-').length > 20 ? (creditNote.reason || creditNote.motif || '-').substring(0, 20) + '...' : (creditNote.reason || creditNote.motif || '-') }}
                      </span>
                    </div>
                  </td>
                  <td class="col-status">
                    <span class="status-badge" [ngClass]="getStatusClass(creditNote.status)">
                      {{ getStatusText(creditNote.status) }}
                    </span>
                  </td>
                  <td class="col-actions">
                    <div class="action-buttons">
                      <button mat-icon-button 
                              color="primary" 
                              [routerLink]="['/credit-notes', creditNote.id || creditNote.uuid]"
                              matTooltip="Voir les détails"
                              class="action-btn">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button 
                              color="accent" 
                              [routerLink]="['/credit-notes', creditNote.id || creditNote.uuid, 'edit']"
                              matTooltip="Modifier"
                              class="action-btn"
                              *ngIf="creditNote.status !== 'PAID'">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button 
                              color="primary"
                              (click)="generatePDF(creditNote)"
                              matTooltip="Générer PDF"
                              class="action-btn">
                        <mat-icon>picture_as_pdf</mat-icon>
                      </button>
                      <button mat-icon-button 
                              color="warn" 
                              (click)="deleteCreditNote(creditNote)"
                              matTooltip="Supprimer"
                              class="action-btn"
                              *ngIf="creditNote.status === 'DRAFT'">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="empty-state" *ngIf="dataSource.filteredData.length === 0 && !isLoading">
            <div class="empty-content">
              <mat-icon class="empty-icon">assignment_return</mat-icon>
              <h3 class="empty-title">Aucun avoir trouvé</h3>
              <p class="empty-description">
                {{ hasActiveFilters() ? 'Essayez de modifier les filtres pour voir plus de résultats.' : 'Commencez par créer votre premier avoir.' }}
              </p>
              <button mat-flat-button 
                      color="primary" 
                      routerLink="/credit-notes/new"
                      *ngIf="!hasActiveFilters()"
                      class="empty-action">
                <mat-icon>add</mat-icon>
                Créer un avoir
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-overlay">
        <div class="loading-spinner">
          <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
          <span class="loading-text">Chargement des avoirs...</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .credit-notes-container {
      padding: 2rem;
      max-width: 1280px;
      margin: 0 auto;
    }

    .credit-notes-header {
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

    .credit-notes-title {
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

    .new-credit-note-btn {
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

    .credit-notes-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .credit-notes-table th {
      background: var(--background-color);
      padding: 1rem;
      text-align: center;
      font-weight: 600;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-light);
      font-size: 0.875rem;
      white-space: nowrap;
    }

    .credit-notes-table td {
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
      width: 12%;
      text-align: center;
    }

    .col-invoice {
      width: 18%;
      text-align: center;
    }

    .col-date {
      width: 12%;
      text-align: center;
    }

    .col-amount {
      width: 14%;
      text-align: center;
    }

    .col-reason {
      width: 18%;
      text-align: center;
    }

    .col-status {
      width: 12%;
      text-align: center;
    }

    .col-actions {
      width: 14%;
      text-align: center;
    }

    /* Contenu des cellules */
    .credit-note-number {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .credit-note-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--text-secondary);
    }

    .credit-note-text {
      font-family: 'Inter', monospace;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--primary-color);
    }

    .invoice-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .invoice-link-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .invoice-link-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--primary-color);
    }

    .invoice-link {
      font-family: 'Inter', monospace;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--primary-color);
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .invoice-link:hover {
      color: var(--primary-color);
      text-decoration: underline;
    }

    .invoice-text-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .invoice-text-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--text-secondary);
    }

    .invoice-text {
      font-family: 'Inter', monospace;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .no-invoice-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .no-invoice-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--text-secondary);
    }

    .no-invoice-text {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
      font-style: italic;
    }

    .date-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .date-text {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .amount {
      font-weight: 600;
      font-family: 'Inter', monospace;
    }

    .amount-credit {
      color: #DC2626;
    }

    .reason-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .reason-text {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
      flex-wrap: wrap;
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
      .credit-notes-container {
        padding: 1rem;
      }

      .credit-notes-header {
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

      .credit-notes-table {
        font-size: 0.875rem;
      }

      .credit-notes-table th,
      .credit-notes-table td {
        padding: 0.5rem;
      }
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
    this.loadCreditNotes();
    
    // Configure filter predicate for global search (number, invoice)
    this.dataSource.filterPredicate = (data: CreditNote, filter: string) => {
      const filterStr = filter.trim().toLowerCase();
      return data.creditNoteNumber.toLowerCase().includes(filterStr) ||
             (data.invoice?.invoiceNumber?.toLowerCase().includes(filterStr) || false) ||
             ((data as any).supplier_name?.toLowerCase().includes(filterStr) || false);
    };
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
    if (!this.creditNotes || this.creditNotes.length === 0) {
      return;
    }
    
    const filterValue = (event.target as HTMLInputElement).value;
    
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByStatus(status: string): void {
    this.currentStatus = status;
    
    if (!this.creditNotes || this.creditNotes.length === 0) {
      return;
    }
    
    // Set custom filter predicate for status filtering
    this.dataSource.filterPredicate = (data: CreditNote, filter: string) => {
      return !filter || data.status === filter;
    };
    
    // Apply filter
    this.dataSource.filter = status || '';
  }

  filterByPeriod(period: string): void {
    this.currentPeriod = period;
    
    if (!this.creditNotes || this.creditNotes.length === 0) {
      return;
    }
    
    if (!period) {
      // Reset to all credit notes
      this.dataSource.data = this.creditNotes;
      // Restore original filter predicate for search
      this.dataSource.filterPredicate = (data: CreditNote, filter: string) => {
        const filterStr = filter.trim().toLowerCase();
        return data.creditNoteNumber.toLowerCase().includes(filterStr) ||
               (data.invoice?.invoiceNumber?.toLowerCase().includes(filterStr) || false) ||
               ((data as any).supplier_name?.toLowerCase().includes(filterStr) || false);
      };
      return;
    }
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 = Janvier, 1 = Février, etc.
    
    // Set custom filter predicate for period filtering
    this.dataSource.filterPredicate = (data: CreditNote, filter: string) => {
      if (!data.creditDate) return false;
      
      const creditDate = new Date(data.creditDate);
      const creditYear = creditDate.getFullYear();
      const creditMonth = creditDate.getMonth();
      
      switch (period) {
        case 'current':
          return creditYear === currentYear && creditMonth === currentMonth;
          
        case 'last':
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return creditYear === lastMonthYear && creditMonth === lastMonth;
          
        case 'quarter':
          const currentQuarter = Math.floor(currentMonth / 3);
          const creditQuarter = Math.floor(creditMonth / 3);
          return creditYear === currentYear && creditQuarter === currentQuarter;
          
        case 'year':
          return creditYear === currentYear;
          
        default:
          return true;
      }
    };
    
    // Apply filter
    this.dataSource.filter = 'period_filter';
  }

  generatePDF(creditNote: CreditNote): void {
    this.pdfService.generateCreditNotePDF(creditNote);
  }

  deleteCreditNote(creditNote: any): void {
    const creditNoteId = creditNote.id || (creditNote as any).uuid;
    if (!creditNoteId) {
      return;
    }
    
    this.confirmationService.confirmDeleteCreditNote(creditNote.creditNoteNumber).subscribe(confirmed => {
      if (confirmed) {
        this.apiService.delete(`/api/credit-notes/${creditNoteId}/`).subscribe({
          next: () => {
            this.loadCreditNotes();
          },
          error: (error: any) => {
            console.error('Error deleting credit note:', error);
          }
        });
      }
    });
  }

  applyCreditNote(creditNote: CreditNote): void {
    this.confirmationService.confirmApplyCreditNote(creditNote.creditNoteNumber).subscribe(confirmed => {
      if (confirmed) {
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

  hasActiveFilters(): boolean {
    return !!(this.currentStatus || this.currentPeriod || this.dataSource.filter);
  }

  resetFilters(): void {
    this.currentStatus = '';
    this.currentPeriod = '';
    this.dataSource.filter = '';
    
    // Restore original filter predicate for search
    this.dataSource.filterPredicate = (data: CreditNote, filter: string) => {
      const filterStr = filter.trim().toLowerCase();
      return data.creditNoteNumber.toLowerCase().includes(filterStr) ||
             (data.invoice?.invoiceNumber?.toLowerCase().includes(filterStr) || false) ||
             ((data as any).supplier_name?.toLowerCase().includes(filterStr) || false);
    };
    
    // Reset to all credit notes
    this.dataSource.data = this.creditNotes;
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
