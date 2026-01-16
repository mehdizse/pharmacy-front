import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';

import { Chart, registerables } from 'chart.js';

import { DashboardKPI } from '../../shared/models/business.model';
import { ApiService } from '../../core/services/api.service';
import { ApiResponse } from '../../shared/models/api.model';
import { DateService } from '../../core/services/date.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    RouterModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-title">Tableau de bord</h1>
          <div class="period-info">
            <mat-icon class="period-icon">calendar_today</mat-icon>
            <span class="period-text">Période: <strong>{{ getCurrentPeriod() }}</strong></span>
            <span class="period-badge" [class.hidden]="hasActiveFilters()">Actuelle</span>
          </div>
        </div>
        <div class="header-date">
          <mat-icon class="date-icon">today</mat-icon>
          <span class="date-text">{{ getTodayDate() }}</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-header">
          <h2 class="filters-title">Filtres</h2>
          <button mat-button class="reset-btn" (click)="resetFilters()" [class.hidden]="!hasActiveFilters()">
            <mat-icon>refresh</mat-icon>
            Réinitialiser
          </button>
        </div>
        
        <div class="filters-container">
          <mat-form-field appearance="outline" class="filter-field period-field">
            <mat-label>Période</mat-label>
            <mat-select (selectionChange)="onPeriodQuickChange($event.value)" [value]="getQuickPeriod()">
              <mat-option value="current">Ce mois</mat-option>
              <mat-option value="last">Mois dernier</mat-option>
              <mat-option value="quarter">Ce trimestre</mat-option>
              <mat-option value="year">Cette année</mat-option>
              <mat-option value="custom">Personnalisé</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Mois</mat-label>
            <mat-select (selectionChange)="onMonthFilterChange($event.value)" [value]="selectedMonth">
              <mat-option value="">Tous les mois</mat-option>
              <mat-option *ngFor="let month of getMonths()" [value]="month.value">
                {{ month.label }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Année</mat-label>
            <mat-select (selectionChange)="onYearFilterChange($event.value)" [value]="selectedYear">
              <mat-option value="">Toutes les années</mat-option>
              <mat-option *ngFor="let year of getYears()" [value]="year">
                {{ year }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Statut</mat-label>
            <mat-select (selectionChange)="onStatusFilterChange($event.value)" [value]="selectedStatus">
              <mat-option value="">Tous les statuts</mat-option>
              <mat-option value="paid">Payées</mat-option>
              <mat-option value="pending">En attente</mat-option>
              <mat-option value="overdue">En retard</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        
        <!-- Filtres actifs -->
        <div class="active-filters" [class.hidden]="!hasActiveFilters()">
          <span class="active-filters-label">Filtres actifs:</span>
          <div class="filter-tags">
            <mat-chip *ngIf="selectedMonth" class="filter-tag" (removed)="clearMonthFilter()">
              {{ getMonthLabel(selectedMonth) }}
              <mat-icon matChipRemove>close</mat-icon>
            </mat-chip>
            <mat-chip *ngIf="selectedYear" class="filter-tag" (removed)="clearYearFilter()">
              {{ selectedYear }}
              <mat-icon matChipRemove>close</mat-icon>
            </mat-chip>
            <mat-chip *ngIf="selectedStatus" class="filter-tag" (removed)="clearStatusFilter()">
              {{ getStatusLabel(selectedStatus) }}
              <mat-icon matChipRemove>close</mat-icon>
            </mat-chip>
          </div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-content">
            <div class="kpi-header">
              <div class="kpi-main">
                <h3 class="kpi-value">{{ getKpiValue('invoice_count') }}</h3>
                <p class="kpi-label">Factures</p>
              </div>
              <mat-icon class="kpi-icon">receipt</mat-icon>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-content">
            <div class="kpi-header">
              <div class="kpi-main">
                <h3 class="kpi-value">{{ getKpiValue('total_suppliers') }}</h3>
                <p class="kpi-label">Fournisseurs</p>
              </div>
              <mat-icon class="kpi-icon">business</mat-icon>
            </div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-content">
            <div class="kpi-header">
              <div class="kpi-main">
                <h3 class="kpi-value">{{ getKpiValue('credit_note_count') }}</h3>
                <p class="kpi-label">Avoirs</p>
              </div>
              <mat-icon class="kpi-icon">assignment_return</mat-icon>
            </div>
          </div>
        </div>

        <div class="kpi-card kpi-primary">
          <div class="kpi-content">
            <div class="kpi-header">
              <div class="kpi-main">
                <h3 class="kpi-value">{{ formatCurrency(getKpiValue('net_amount')) }}</h3>
                <p class="kpi-label">Net à payer</p>
              </div>
              <mat-icon class="kpi-icon">account_balance_wallet</mat-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Invoices Table -->
      <div class="table-card">
        <div class="table-header">
          <div class="table-title-section">
            <h2>Factures récentes</h2>
            <span class="table-count">{{ filteredInvoices.length }} facture{{ filteredInvoices.length > 1 ? 's' : '' }}</span>
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
                  <th class="col-amount">Montant</th>
                  <th class="col-date">Date</th>
                  <th class="col-status">Statut</th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let invoice of filteredInvoices" class="table-row">
                  <td class="col-number">
                    <div class="invoice-number">
                      <mat-icon class="invoice-icon">{{ invoice.invoice_number?.startsWith('AV') ? 'assignment_return' : 'receipt' }}</mat-icon>
                      <span class="invoice-text">{{ invoice.invoice_number }}</span>
                    </div>
                  </td>
                  <td class="col-supplier">
                    <div class="supplier-info">
                      <span class="supplier-name">{{ invoice.supplier_name }}</span>
                    </div>
                  </td>
                  <td class="col-amount">
                    <span class="amount" [ngClass]="{ 'amount-credit': invoice.invoice_number?.startsWith('AV') }">
                      {{ invoice.invoice_number?.startsWith('AV') ? '-' : '' }}{{ formatCurrency(invoice.net_to_pay) }}
                    </span>
                  </td>
                  <td class="col-date">
                    <div class="date-info">
                      <span class="date-text">{{ formatDate(invoice.invoice_date || invoice.created_at) }}</span>
                    </div>
                  </td>
                  <td class="col-status">
                    <span class="status-badge" [ngClass]="getStatusClass(invoice)">
                      {{ getStatusText(invoice) }}
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
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="empty-state" *ngIf="filteredInvoices.length === 0 && !isLoading">
            <div class="empty-content">
              <mat-icon class="empty-icon">receipt_long</mat-icon>
              <h3 class="empty-title">Aucune facture trouvée</h3>
              <p class="empty-description">
                {{ selectedMonth || selectedYear ? 'Essayez de modifier les filtres pour voir plus de résultats.' : 'Commencez par créer votre première facture.' }}
              </p>
              <button mat-flat-button 
                      color="primary" 
                      routerLink="/invoices/new"
                      *ngIf="!selectedMonth && !selectedYear"
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
          <span class="loading-text">Chargement des données...</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1280px;
      margin: 0 auto;
    }

    .dashboard-header {
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

    .dashboard-title {
      font-size: 2rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.75rem 0;
    }

    .period-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .period-icon {
      font-size: 1rem;
      color: var(--text-secondary);
    }

    .period-text {
      font-weight: 400;
    }

    .period-text strong {
      font-weight: 600;
      color: var(--text-primary);
    }

    .period-badge {
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

    .header-date {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      background: var(--primary-soft);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid var(--border-light);
    }

    .date-icon {
      font-size: 1rem;
      color: var(--primary-color);
    }

    .date-text {
      font-weight: 500;
      color: var(--text-primary);
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

    /* Styles pour les filtres */
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
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      align-items: end;
    }

    .filter-field {
      width: 100%;
    }

    .period-field {
      grid-column: 1;
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

    .period-badge.hidden {
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

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .kpi-card {
      background: #FFFFFF;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      border: 1px solid #E5E7EB;
      height: 80px;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
      transform: translateX(-100%);
      transition: transform 0.6s ease;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      border-color: var(--primary-color);
    }

    .kpi-card:hover::before {
      transform: translateX(100%);
    }

    .kpi-primary {
      border-bottom: 2px solid #E5E7EB;
    }

    .kpi-primary:hover {
      border-bottom-color: var(--primary-color);
    }


    .kpi-content {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .kpi-main {
      flex: 1;
    }

    .kpi-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #9CA3AF;
      opacity: 1;
    }

    .kpi-value {
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 2px 0;
      line-height: 1.2;
      text-align: center;
    }

    .kpi-primary .kpi-value {
      color: #111827;
      font-weight: 600;
    }

    .kpi-label {
      color: var(--text-primary);
      margin: 0;
      font-size: 0.8125rem;
      font-weight: 400;
      opacity: 0.65;
      line-height: 1.3;
      text-align: center;
    }

    .kpi-primary .kpi-label {
      opacity: 0.6;
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
      width: 16.66%;
      text-align: center;
    }

    .col-supplier {
      width: 16.66%;
      text-align: center;
    }

    .col-amount {
      width: 16.66%;
      text-align: center;
    }

    .col-date {
      width: 16.66%;
      text-align: center;
    }

    .col-status {
      width: 16.66%;
      text-align: center;
    }

    .col-actions {
      width: 16.70%;
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

    .amount {
      font-weight: 600;
      font-family: 'Inter', monospace;
    }

    .amount-credit {
      color: #DC2626;
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

    .date-relative {
      font-size: 0.75rem;
      color: var(--text-secondary);
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

    .status-credit {
      background: #E0E7FF;
      color: #4F46E5;
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

    .status-badge {
      animation: badgeGlow 3s ease-in-out infinite;
    }

    /* Amélioration des transitions */
    * {
      transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .kpi-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }
      
      .filters-container {
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }
    }
  

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
      }

      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .dashboard-title {
        font-size: 1.5rem;
      }

      .period-info {
        font-size: 0.8rem;
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .new-invoice-btn {
        flex: 1;
        justify-content: center;
      }

      .export-btn {
        padding: 0.5rem 1rem;
      }

      .filters-container {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .filter-field {
        min-width: auto;
        width: 100%;
      }

      .reset-btn {
        width: 100%;
        justify-content: center;
        margin-top: 0.5rem;
      }

      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }
      
      .kpi-card {
        padding: 1rem;
        height: auto;
        min-height: 80px;
      }
      
      .kpi-value {
        font-size: 1.5rem;
      }
      
      .kpi-label {
        font-size: 0.75rem;
      }

      .table-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      
      /* Styles pour le tableau mobile */
      .table-card {
        padding: 0.75rem;
      }
      
      .table-wrapper {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        margin: 0 -0.75rem;
        padding: 0 0.75rem;
      }
      
      .invoices-table {
        min-width: 500px;
        font-size: 0.85rem;
      }
      
      .invoices-table th {
        padding: 0.75rem 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        white-space: nowrap;
        background: var(--background-color);
        position: sticky;
        top: 0;
        z-index: 10;
      }
      
      .invoices-table td {
        padding: 0.75rem 0.5rem;
        vertical-align: middle;
        white-space: nowrap;
      }
      
      .invoice-number {
        flex-direction: row;
        gap: 0.5rem;
        align-items: center;
      }
      
      .invoice-text {
        font-size: 0.8rem;
        font-weight: 500;
      }
      
      .supplier-name {
        font-size: 0.8rem;
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .amount {
        font-size: 0.85rem;
        font-weight: 600;
      }
      
      .date-text {
        font-size: 0.8rem;
      }
      
      .status-badge {
        font-size: 0.7rem;
        padding: 0.25rem 0.5rem;
        white-space: nowrap;
      }
      
      .action-buttons {
        gap: 0.25rem;
      }
      
      .action-btn {
        width: 28px;
        height: 28px;
      }
      
      .action-btn mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
  

    @media (max-width: 480px) {
      .dashboard-container {
        padding: 0.75rem;
        width: 100%;
      }
      
      .export-btn {
        width: 100%;
      }

      .filters-section {
        padding: 1rem;
      }
      
      .filters-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }
      
      .filters-title {
        font-size: 1rem;
      }

      .kpi-grid {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
      
      .kpi-card {
        padding: 0.75rem;
        height: auto;
        min-height: 70px;
      }
      
      .kpi-header {
        margin-bottom: 8px;
      }
      
      .kpi-value {
        font-size: 1.25rem;
      }
      
      .kpi-label {
        font-size: 0.7rem;
      }
      
      .kpi-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .table-card {
        padding: 1rem;
        border-radius: 12px;
      }
      
      .table-header {
        padding-bottom: 0.75rem;
      }
      
      .table-title-section h2 {
        font-size: 1rem;
      }
      
      .table-count {
        font-size: 0.75rem;
      }
    }
    /* Très petits écrans - approche simplifiée */
    @media (max-width: 480px) {
      .invoices-table {
        min-width: 450px;
        font-size: 0.8rem;
      }
      
      .invoices-table th {
        padding: 0.5rem 0.25rem;
        font-size: 0.7rem;
      }
      
      .invoices-table td {
        padding: 0.5rem 0.25rem;
      }
      
      .supplier-name {
        max-width: 100px;
        font-size: 0.75rem;
      }
      
      .invoice-text {
        font-size: 0.75rem;
      }
      
      .amount {
        font-size: 0.8rem;
      }
      
      .date-text {
        font-size: 0.75rem;
      }
      
      .status-badge {
        font-size: 0.65rem;
        padding: 0.2rem 0.4rem;
      }
      
      .action-btn {
        width: 24px;
        height: 24px;
      }
      
      .action-btn mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }
    `]
  })
export class DashboardComponent implements OnInit {
  kpis: DashboardKPI | null = null;
  isLoading = false;
  
  // Propriétés pour les filtres
  selectedMonth: string = '';
  selectedYear: string = '';
  selectedStatus: string = '';
  quickPeriod: string = 'current';
  filteredInvoices: any[] = [];
  allInvoices: any[] = []; // Toutes les factures pour le filtrage
  allCreditNotes: any[] = []; // Tous les avoirs pour le filtrage
  
  // Cache pour les fournisseurs, mois et années
  private _months: Array<{label: string, value: string}> = [];
  private _years: number[] = [];
  
  // KPIs dynamiques selon les filtres
  dynamicKpis: DashboardKPI | null = null;

  private monthlyChartInstance: Chart | null = null;
  private supplierChartInstance: Chart | null = null;

  constructor(
    private apiService: ApiService,
    private dateService: DateService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialiser le locale français pour les dates
    this.dateService.initFrenchLocale();
    
    // Ajout des méthodes manquantes
    this.getCurrentDate = this.getCurrentDate.bind(this);
    this.formatDate = this.formatDate.bind(this);

    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadAllInvoices(); // Charger toutes les factures pour le filtrage
    this.loadCreditNotes(); // Charger tous les avoirs pour le filtrage
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    // Construire l'URL avec les filtres de période
    let url = '/api/reports/dashboard/';
    const params: string[] = [];
    
    if (this.selectedMonth) {
      params.push(`month=${this.selectedMonth}`);
    }
    if (this.selectedYear) {
      params.push(`year=${this.selectedYear}`);
    } else if (this.quickPeriod) {
      // Gérer les périodes rapides
      const currentDate = new Date();
      switch (this.quickPeriod) {
        case 'current':
          params.push(`month=${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`);
          params.push(`year=${currentDate.getFullYear()}`);
          break;
        case 'last':
          const lastMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;
          const lastYear = lastMonth === 11 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
          params.push(`month=${(lastMonth + 1).toString().padStart(2, '0')}`);
          params.push(`year=${lastYear}`);
          break;
        case 'quarter':
          // Pour le trimestre, on pourrait envoyer le trimestre actuel
          params.push(`quarter=${Math.floor(currentDate.getMonth() / 3) + 1}`);
          params.push(`year=${currentDate.getFullYear()}`);
          break;
        case 'year':
          params.push(`year=${currentDate.getFullYear()}`);
          break;
      }
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    this.apiService.get<DashboardKPI>(url).subscribe({
      next: (response: ApiResponse<DashboardKPI>) => {
        // Le backend envoie les données directement, pas enveloppées dans response.data
        this.kpis = response.data || response;
        
        // Mapper les factures récentes pour être cohérent avec le tableau factures
        if (this.kpis?.recent_invoices) {
          this.kpis.recent_invoices = this.kpis.recent_invoices.map((invoice: any) => ({
            ...invoice,
            // S'assurer que les champs sont mappés correctement
            invoice_date: invoice.invoice_date || invoice.created_at,
            status: invoice.status || invoice.payment_status,
            supplier_name: invoice.supplier_name || invoice.supplier?.name || invoice.supplier
          }));
        }
        
        // Réinitialiser les caches quand les données changent
        this._months = [];
        this._years = [];
        
        // Par défaut, afficher seulement les factures récentes dans le tableau
        this.filteredInvoices = this.kpis?.recent_invoices || [];
        
        this.initCharts();
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
      }
    });
  }

  loadAllInvoices(): void {
    this.apiService.get<any[]>('/api/invoices/').subscribe({
      next: (response: any) => {
        // Handle different response formats
        let invoices: any[] = [];
        if (response && typeof response === 'object') {
          if ('data' in response) {
            invoices = response.data || [];
          } else if ('results' in response) {
            invoices = response.results || [];
          } else {
            invoices = Array.isArray(response) ? response : [];
          }
        }
        
        // Mapper les factures pour être cohérent avec le tableau factures
        this.allInvoices = invoices.map((invoice: any) => ({
          ...invoice,
          // S'assurer que les champs sont mappés correctement
          invoice_date: invoice.invoice_date || invoice.created_at,
          status: invoice.status || invoice.payment_status,
          supplier_name: invoice.supplier_name || invoice.supplier?.name || invoice.supplier
        }));
        
        // Appliquer les filtres si nécessaire
        if (this.selectedMonth || this.selectedYear || this.selectedStatus) {
          this.applyFilters();
        }
      },
      error: (error: any) => {
        this.allInvoices = [];
      }
    });
  }

  loadCreditNotes(): void {
    this.apiService.get<any[]>('/api/credit-notes/').subscribe({
      next: (response: any) => {
        // Handle different response formats
        let creditNotes: any[] = [];
        if (response && typeof response === 'object') {
          if ('data' in response) {
            creditNotes = response.data || [];
          } else if ('results' in response) {
            creditNotes = response.results || [];
          } else {
            creditNotes = Array.isArray(response) ? response : [];
          }
        }
        
        // Mapper les avoirs pour être cohérents
        this.allCreditNotes = creditNotes.map((creditNote: any) => ({
          ...creditNote,
          // S'assurer que les champs sont mappés correctement
          credit_note_date: creditNote.credit_note_date || creditNote.created_at,
          status: creditNote.status || creditNote.payment_status,
          supplier_name: creditNote.supplier_name || creditNote.supplier?.name || creditNote.supplier
        }));
        
        // Appliquer les filtres si nécessaire
        if (this.selectedMonth || this.selectedYear || this.selectedStatus) {
          this.applyFilters();
        }
      },
      error: (error: any) => {
        this.allCreditNotes = [];
      }
    });
  }

  loadDynamicKpis(): void {
    // Construire l'URL avec les filtres
    let url = '/api/reports/dashboard/';
    const params = new URLSearchParams();
    
    if (this.selectedMonth) {
      params.append('month', this.selectedMonth);
    }
    if (this.selectedYear) {
      params.append('year', this.selectedYear);
    }
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    this.apiService.get<DashboardKPI>(url).subscribe({
      next: (response: any) => {
        this.dynamicKpis = response.data || response;
      },
      error: (error: any) => {
        this.dynamicKpis = null;
      }
    });
  }

  getCurrentDate = (): string => {
    return this.dateService.formatDate(new Date());
  }

  formatDate = (dateString: string): string => {
    return this.dateService.formatDate(dateString);
  }

  formatCurrency(amount: number): string {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '0,00 DA';
    }
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Méthodes pour les KPIs dynamiques
  getKpiValue(key: string): any {
    let value = 0;
    
    // Pour total_suppliers, toujours utiliser les données globales
    if (key === 'total_suppliers') {
      value = (this.kpis as any)?.total_suppliers || (this.kpis?.overview as any)?.total_suppliers || 0;
      return isNaN(value) ? 0 : value;
    }
    
    // Si des filtres sont appliqués, utiliser les données du backend pour la période filtrée
    if (this.selectedMonth || this.selectedYear) {
      // Le backend envoie les données du mois courant même avec filtres
      // Utiliser les propriétés depuis overview (qui contient les compteurs)
      switch (key) {
        case 'invoice_count':
          value = (this.kpis?.overview as any)?.current_month?.invoice_count || 0;
          break;
        case 'credit_note_count':
          value = (this.kpis?.overview as any)?.current_month?.credit_note_count || 0;
          break;
        case 'net_amount':
          value = (this.kpis as any)?.net_current_month || (this.kpis?.overview as any)?.current_month?.net_amount || 0;
          break;
        default:
          value = 0;
      }
    } else {
      // Sinon, utiliser les KPIs du mois courant par défaut
      value = (this.kpis?.overview as any)?.current_month?.[key] || 0;
    }
    
    return isNaN(value) ? 0 : value;
  }

  // Calculer les KPIs depuis les factures filtrées
  calculateKpiFromFilteredInvoices(key: string): any {
    let value = 0;
    
    switch (key) {
      case 'invoice_count':
        // Compter seulement les factures (pas les avoirs)
        value = this.filteredInvoices.filter(item => {
          return !(item.type === 'credit_note' || 
                   item.is_credit_note || 
                   item.invoice_type === 'credit_note' ||
                   item.credit_note_number ||
                   (item.invoice_number && item.invoice_number.startsWith('AV')));
        }).length;
        break;
      
      case 'credit_note_count':
        // Compter seulement les avoirs
        value = this.filteredInvoices.filter(item => {
          return item.type === 'credit_note' || 
                 item.is_credit_note || 
                 item.invoice_type === 'credit_note' ||
                 item.credit_note_number ||
                 (item.invoice_number && item.invoice_number.startsWith('AV'));
        }).length;
        break;
      
      case 'total_invoices':
        // Somme des factures seulement
        value = this.filteredInvoices
          .filter(item => !(item.type === 'credit_note' || 
                          item.is_credit_note || 
                          item.invoice_type === 'credit_note' ||
                          item.credit_note_number ||
                          (item.invoice_number && item.invoice_number.startsWith('AV'))))
          .reduce((sum, item) => {
            const amount = parseFloat(item.total_amount) || parseFloat(item.net_to_pay) || 0;
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);
        break;
      
      case 'net_amount':
        // Somme nette (factures - avoirs)
        const invoiceTotal = this.filteredInvoices
          .filter(item => !(item.type === 'credit_note' || 
                          item.is_credit_note || 
                          item.invoice_type === 'credit_note' ||
                          item.credit_note_number ||
                          (item.invoice_number && item.invoice_number.startsWith('AV'))))
          .reduce((sum, item) => {
            const amount = parseFloat(item.net_to_pay) || 0;
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);
        
        const creditTotal = this.filteredInvoices
          .filter(item => item.type === 'credit_note' || 
                         item.is_credit_note || 
                         item.invoice_type === 'credit_note' ||
                         item.credit_note_number ||
                         (item.invoice_number && item.invoice_number.startsWith('AV')))
          .reduce((sum, item) => {
            const amount = parseFloat(item.net_to_pay) || 0;
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);
        
        value = invoiceTotal - creditTotal;
        break;
      
      default:
        value = 0;
    }
    
    return isNaN(value) ? 0 : value;
  }

  getKpiPeriod(): string {
    if (this.selectedMonth && this.selectedYear) {
      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      return monthNames[parseInt(this.selectedMonth) - 1] + ' ' + this.selectedYear;
    } else if (this.selectedMonth) {
      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      return monthNames[parseInt(this.selectedMonth) - 1];
    } else if (this.selectedYear) {
      return this.selectedYear;
    } else {
      return 'ce mois';
    }
  }

  formatEvolution(evolution: number): string {
    const sign = evolution >= 0 ? '+' : '';
    return sign + evolution.toFixed(1) + '%';
  }

  getEvolutionClass(evolution: number): string {
    if (evolution > 0) return 'evolution-positive';
    if (evolution < 0) return 'evolution-negative';
    return 'evolution-neutral';
  }

  // Méthodes pour les filtres (optimisées avec cache)
  getMonths(): Array<{label: string, value: string}> {
    if (this._months.length === 0) {
      const months = [
        { label: 'Janvier', value: '01' },
        { label: 'Février', value: '02' },
        { label: 'Mars', value: '03' },
        { label: 'Avril', value: '04' },
        { label: 'Mai', value: '05' },
        { label: 'Juin', value: '06' },
        { label: 'Juillet', value: '07' },
        { label: 'Août', value: '08' },
        { label: 'Septembre', value: '09' },
        { label: 'Octobre', value: '10' },
        { label: 'Novembre', value: '11' },
        { label: 'Décembre', value: '12' }
      ];
      this._months = months;
    }
    return this._months;
  }

  getYears(): number[] {
    if (this._years.length === 0) {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const years = [];
      
      // Générer les années de 2020 à 2030
      for (let year = currentYear + 5; year >= 2020; year--) {
        years.push(year);
      }
      
      this._years = years;
    }
    return this._years;
  }

  onMonthFilterChange(month: string): void {
    this.selectedMonth = month;
    this.applyFilters();
    this.loadDashboardData(); // Recharger les KPIs avec le nouveau filtre
  }

  onYearFilterChange(year: string): void {
    this.selectedYear = year;
    this.applyFilters();
    this.loadDashboardData(); // Recharger les KPIs avec le nouveau filtre
  }

  applyFilters(): void {
    // Si aucun filtre n'est appliqué, afficher les factures récentes
    if (!this.selectedMonth && !this.selectedYear && !this.selectedStatus) {
      this.filteredInvoices = this.kpis?.recent_invoices || [];
      return;
    }

    // Si des filtres sont appliqués, filtrer seulement les factures
    if (!this.allInvoices) {
      this.filteredInvoices = [];
      return;
    }

    // Filtrer les factures
    let filteredInvoices = [...this.allInvoices];
    
    // Filtrer par mois/année
    if (this.selectedMonth || this.selectedYear) {
      filteredInvoices = filteredInvoices.filter(invoice => {
        // Utiliser invoice_date en priorité, sinon created_at
        const dateToUse = invoice.invoice_date || invoice.created_at;
        if (!dateToUse) return false;
        
        const invoiceDate = new Date(dateToUse);
        const invoiceMonth = String(invoiceDate.getMonth() + 1).padStart(2, '0');
        const invoiceYear = String(invoiceDate.getFullYear());
        
        const monthMatch = !this.selectedMonth || invoiceMonth === this.selectedMonth;
        const yearMatch = !this.selectedYear || invoiceYear === String(this.selectedYear);
        
        return monthMatch && yearMatch;
      });
    }
    
    // Filtrer par statut
    if (this.selectedStatus) {
      filteredInvoices = filteredInvoices.filter(invoice => {
        const status = invoice.status?.toUpperCase() || invoice.payment_status?.toUpperCase() || '';
        
        switch (this.selectedStatus) {
          case 'paid':
            return status === 'PAID' || status === 'PAYEE';
          case 'pending':
            return status === 'PENDING' || status === 'EN_ATTENTE';
          case 'overdue':
            return status === 'OVERDUE' || status === 'EN_RETARD' || status === 'CANCELLED' || status === 'ANNULEE';
          default:
            return false;
        }
      });
    }

    // Afficher seulement les factures filtrées (pas les avoirs)
    this.filteredInvoices = [...filteredInvoices];
    
    // Forcer la détection de changement
    this.cdr.detectChanges();
  }

  private initCharts(): void {
    // This would be implemented with Chart.js
    // For now, we'll leave the charts empty
    setTimeout(() => {
      this.initMonthlyChart();
      this.initSupplierChart();
    }, 100);
  }

  private initMonthlyChart(): void {
    const canvas = document.getElementById('monthlyChart') as HTMLCanvasElement;
    if (canvas) {
      if (this.monthlyChartInstance) {
        this.monthlyChartInstance.destroy();
        this.monthlyChartInstance = null;
      }

      const invoices = this.kpis?.recent_invoices || [];
      if (!Array.isArray(invoices) || invoices.length === 0) {
        return;
      }

      const byMonth = new Map<string, number>();
      for (const inv of invoices) {
        const key = inv.year + '-' + String(inv.month).padStart(2, '0');
        const value = Number(inv.net_to_pay) || 0;
        byMonth.set(key, (byMonth.get(key) || 0) + value);
      }

      const labels = Array.from(byMonth.keys()).sort();
      const data = labels.map((k) => byMonth.get(k) || 0);

      this.monthlyChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Net à payer',
              data,
              borderColor: '#3182ce',
              backgroundColor: 'rgba(49, 130, 206, 0.2)',
              tension: 0.25
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  }

  private initSupplierChart(): void {
    const canvas = document.getElementById('supplierChart') as HTMLCanvasElement;
    if (canvas) {
      if (this.supplierChartInstance) {
        this.supplierChartInstance.destroy();
        this.supplierChartInstance = null;
      }

      const topSuppliers = this.kpis?.top_suppliers || [];
      if (!Array.isArray(topSuppliers) || topSuppliers.length === 0) {
        return;
      }

      const labels = topSuppliers.map((s) => s.supplier_name);
      const data = topSuppliers.map((s) => Number(s.total_amount) || 0);

      this.supplierChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              label: 'Montant',
              data,
              backgroundColor: [
                '#3182ce',
                '#38a169',
                '#d69e2e',
                '#805ad5',
                '#dd6b20',
                '#0bc5ea'
              ]
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    } else {
    }
  }

  getTodayDate(): string {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('fr-FR', options);
  }

  // Nouvelles méthodes pour les filtres améliorés
  getCurrentPeriod(): string {
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    // Si des filtres sont actifs, afficher la période filtrée
    if (this.selectedYear && this.selectedMonth) {
      const monthIndex = parseInt(this.selectedMonth) - 1;
      return monthNames[monthIndex] + ' ' + this.selectedYear;
    } else if (this.selectedYear && !this.selectedMonth) {
      return 'Année ' + this.selectedYear;
    } else if (this.quickPeriod === 'current') {
      const currentDate = new Date();
      return monthNames[currentDate.getMonth()] + ' ' + currentDate.getFullYear();
    } else if (this.quickPeriod === 'last') {
      const currentDate = new Date();
      const lastMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;
      const lastYear = lastMonth === 11 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
      return monthNames[lastMonth] + ' ' + lastYear;
    } else if (this.quickPeriod === 'quarter') {
      const currentDate = new Date();
      const currentQuarter = Math.floor(currentDate.getMonth() / 3);
      const quarterNames = ['T1', 'T2', 'T3', 'T4'];
      return quarterNames[currentQuarter] + ' ' + currentDate.getFullYear();
    } else if (this.quickPeriod === 'year') {
      const currentDate = new Date();
      return 'Annee ' + currentDate.getFullYear();
    }
    
    // Par défaut, retourner la période actuelle
    const currentDate = new Date();
    return monthNames[currentDate.getMonth()] + ' ' + currentDate.getFullYear();
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedMonth || this.selectedYear || this.selectedStatus);
  }

  getQuickPeriod(): string {
    return this.quickPeriod;
  }

  onPeriodQuickChange(value: string): void {
    this.quickPeriod = value;
    const currentDate = new Date();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const currentYear = currentDate.getFullYear();

    switch (value) {
      case 'current':
        this.selectedMonth = currentMonth;
        this.selectedYear = String(currentYear);
        break;
      case 'last':
        const lastMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
        const lastMonthStr = String(lastMonth).padStart(2, '0');
        const lastYear = lastMonth === 12 ? currentYear - 1 : currentYear;
        this.selectedMonth = lastMonthStr;
        this.selectedYear = String(lastYear);
        break;
      case 'quarter':
        // Simplifié: on utilise le mois actuel
        this.selectedMonth = currentMonth;
        this.selectedYear = String(currentYear);
        break;
      case 'year':
        this.selectedMonth = '';
        this.selectedYear = String(currentYear);
        break;
      case 'custom':
        // Ne rien faire, laisser l'utilisateur choisir
        break;
    }
    this.applyFilters();
    this.loadDashboardData(); // Recharger les KPIs avec la nouvelle période
  }

  onStatusFilterChange(value: string): void {
    this.selectedStatus = value;
    this.applyFilters();
  }

  clearMonthFilter(): void {
    this.selectedMonth = '';
    this.applyFilters();
  }

  clearYearFilter(): void {
    this.selectedYear = '';
    this.applyFilters();
  }

  clearStatusFilter(): void {
    this.selectedStatus = '';
    this.applyFilters();
  }

  getMonthLabel(monthValue: string): string {
    const month = this.getMonths().find(m => m.value === monthValue);
    return month ? month.label : monthValue;
  }

  getStatusLabel(statusValue: string): string {
    const statusMap: { [key: string]: string } = {
      'paid': 'Payées',
      'pending': 'En attente',
      'overdue': 'En retard'
    };
    return statusMap[statusValue] || statusValue;
  }

  // Mettre à jour resetFilters pour inclure selectedStatus
  resetFilters(): void {
    this.selectedMonth = '';
    this.selectedYear = '';
    this.selectedStatus = '';
    this.quickPeriod = 'current';
    this.filteredInvoices = this.kpis?.recent_invoices || [];
    this.dynamicKpis = null; // Revenir aux KPIs par défaut
  }

  // Méthodes pour les tendances des KPI
  getInvoiceTrend(): { value: number, text: string, type: 'up' | 'down' | 'neutral' } {
    // Simuler une tendance (à remplacer par vraie logique backend)
    const currentCount = this.getKpiValue('invoice_count');
    const previousCount = Math.max(0, currentCount - 3); // Simulation
    const trend = currentCount - previousCount;
    const percentage = previousCount > 0 ? Math.round((trend / previousCount) * 100) : 0;
    
    if (trend > 0) {
      return { value: percentage, text: '+' + percentage + '% vs mois dernier', type: 'up' };
    } else if (trend < 0) {
      return { value: Math.abs(percentage), text: '-' + Math.abs(percentage) + '% vs mois dernier', type: 'down' };
    } else {
      return { value: 0, text: 'Stable', type: 'neutral' };
    }
  }

  getCreditNoteTrend(): { value: number, text: string, type: 'up' | 'down' | 'neutral' } {
    // Simuler une tendance (à remplacer par vraie logique backend)
    const currentCount = this.getKpiValue('credit_note_count');
    const previousCount = Math.max(0, currentCount + 1); // Simulation de baisse
    const trend = currentCount - previousCount;
    const percentage = previousCount > 0 ? Math.round((trend / previousCount) * 100) : 0;
    
    if (trend > 0) {
      return { value: percentage, text: '+' + percentage + '% vs mois dernier', type: 'up' };
    } else if (trend < 0) {
      return { value: Math.abs(percentage), text: '-' + Math.abs(percentage) + '% vs mois dernier', type: 'down' };
    } else {
      return { value: 0, text: 'Stable', type: 'neutral' };
    }
  }

  getSupplierTrend(): { value: number, text: string, type: 'up' | 'down' | 'neutral' } {
    // Simuler une tendance (à remplacer par vraie logique backend)
    const currentCount = this.getKpiValue('total_suppliers');
    const previousCount = currentCount; // Simulation de stabilité
    const trend = currentCount - previousCount;
    
    if (trend > 0) {
      return { value: trend, text: '+' + trend + ' nouveaux', type: 'up' };
    } else if (trend < 0) {
      return { value: Math.abs(trend), text: '-' + Math.abs(trend), type: 'down' };
    } else {
      return { value: 0, text: 'Stable', type: 'neutral' };
    }
  }

  getPaymentAlert(): { count: number, text: string } {
    // Simuler des échéances (à remplacer par vraie logique backend)
    const netAmount = this.getKpiValue('net_amount');
    const simulatedCount = netAmount > 100000 ? 5 : 2; // Simulation basée sur le montant
    
    return {
      count: simulatedCount,
      text: simulatedCount + ' echeance' + (simulatedCount > 1 ? 's' : '') + ' ce mois'
    };
  }

  // Méthodes pour le tableau amélioré
  getRelativeDate(dateString: string): string {
    if (!dateString) return 'Date inconnue';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) return 'Date invalide';
    
    // Calculer la différence en jours correctement
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Ajuster pour le décalage horaire et s'assurer que les dates du même jour sont comptées comme 0
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const calendarDiff = Math.floor((nowOnly.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24));
    
    if (calendarDiff === 0) return 'Aujourd\'hui';
    if (calendarDiff === 1) return 'Hier';
    if (calendarDiff < 7) return 'Il y a ' + calendarDiff + ' jours';
    if (calendarDiff < 30) return 'Il y a ' + Math.floor(calendarDiff / 7) + ' semaine' + (Math.floor(calendarDiff / 7) > 1 ? 's' : '');
    if (calendarDiff < 365) return 'Il y a ' + Math.floor(calendarDiff / 30) + ' mois';
    return 'Il y a ' + Math.floor(calendarDiff / 365) + ' an' + (Math.floor(calendarDiff / 365) > 1 ? 's' : '');
  }

  getStatusClass(invoice: any): string {
    // Logique pour déterminer le statut visuel
    if (invoice.invoice_number?.startsWith('AV')) {
      return 'status-credit';
    }
    
    // Utiliser les mêmes valeurs que dans le composant factures
    const status = invoice.status?.toUpperCase() || invoice.payment_status?.toUpperCase() || 'PENDING';
    
    switch (status) {
      case 'PAID':
      case 'PAYEE':
        return 'status-paid';
      case 'PENDING':
      case 'EN_ATTENTE':
        return 'status-pending';
      case 'OVERDUE':
      case 'EN_RETARD':
        return 'status-overdue';
      case 'CANCELLED':
      case 'ANNULEE':
        return 'status-overdue';
      default:
        return 'status-pending';
    }
  }

  getStatusText(invoice: any): string {
    if (invoice.invoice_number?.startsWith('AV')) {
      return 'Avoir';
    }
    
    // Utiliser les mêmes valeurs que dans le composant factures
    const status = invoice.status?.toUpperCase() || invoice.payment_status?.toUpperCase() || 'PENDING';
    
    switch (status) {
      case 'PAID':
      case 'PAYEE':
        return 'Payée';
      case 'PENDING':
      case 'EN_ATTENTE':
        return 'En attente';
      case 'OVERDUE':
      case 'EN_RETARD':
        return 'En retard';
      case 'CANCELLED':
      case 'ANNULEE':
        return 'Annulée';
      case 'DRAFT':
      case 'BROUILLON':
        return 'Brouillon';
      default:
        return 'En attente';
    }
  }
}
