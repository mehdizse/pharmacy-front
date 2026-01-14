import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
    RouterModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-title">Tableau de bord</h1>
          <p class="dashboard-subtitle">Vue d'ensemble de votre activité</p>
        </div>
        <div class="header-actions">
          <mat-icon class="header-icon">today</mat-icon>
          <span class="current-date">{{ getCurrentDate() }}</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-container">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Mois</mat-label>
            <mat-select (selectionChange)="onMonthFilterChange($event.value)" placeholder="Tous les mois">
              <mat-option value="">Tous les mois</mat-option>
              <mat-option *ngFor="let month of getMonths()" [value]="month.value">
                {{ month.label }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Année</mat-label>
            <mat-select (selectionChange)="onYearFilterChange($event.value)" placeholder="Toutes les années">
              <mat-option value="">Toutes les années</mat-option>
              <mat-option *ngFor="let year of getYears()" [value]="year">
                {{ year }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-flat-button color="primary" (click)="resetFilters()" class="reset-btn">
            <mat-icon>refresh</mat-icon>
            Réinitialiser
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card primary">
          <div class="kpi-content">
            <div class="kpi-icon">
              <mat-icon>receipt</mat-icon>
            </div>
            <div class="kpi-info">
              <h3 class="kpi-value">{{ getKpiValue('invoice_count') }}</h3>
              <p class="kpi-label">Factures {{ getKpiPeriod() }}</p>
            </div>
          </div>
        </div>

        <div class="kpi-card success">
          <div class="kpi-content">
            <div class="kpi-icon">
              <mat-icon>business</mat-icon>
            </div>
            <div class="kpi-info">
              <h3 class="kpi-value">{{ getKpiValue('total_suppliers') }}</h3>
              <p class="kpi-label">Fournisseurs</p>
            </div>
          </div>
        </div>

        <div class="kpi-card warning">
          <div class="kpi-content">
            <div class="kpi-icon">
              <mat-icon>assignment_return</mat-icon>
            </div>
            <div class="kpi-info">
              <h3 class="kpi-value">{{ getKpiValue('credit_note_count') }}</h3>
              <p class="kpi-label">Avoirs {{ getKpiPeriod() }}</p>
            </div>
          </div>
        </div>

        <div class="kpi-card info">
          <div class="kpi-content">
            <div class="kpi-icon">
              <mat-icon>account_balance_wallet</mat-icon>
            </div>
            <div class="kpi-info">
              <h3 class="kpi-value">{{ formatCurrency(getKpiValue('net_amount')) }}</h3>
              <p class="kpi-label">Net à payer</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-grid">
        <!-- Monthly Evolution Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h2>Évolution mensuelle</h2>
            <mat-icon class="chart-icon">trending_up</mat-icon>
          </div>
          <div class="chart-container">
            <canvas id="monthlyChart"></canvas>
          </div>
        </div>

        <!-- Supplier Breakdown Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h2>Répartition fournisseurs</h2>
            <mat-icon class="chart-icon">pie_chart</mat-icon>
          </div>
          <div class="chart-container">
            <canvas id="supplierChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Recent Invoices Table -->
      <div class="table-card">
        <div class="table-header">
          <h2>Factures récentes</h2>
          <button mat-flat-button color="primary" routerLink="/invoices/new">
            <mat-icon>add</mat-icon>
            Nouvelle facture
          </button>
        </div>
        <div class="table-container">
          <table class="invoices-table">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Fournisseur</th>
                <th>Montant</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let invoice of filteredInvoices">
                <td>{{ invoice.invoice_number }}</td>
                <td>{{ invoice.supplier_name }}</td>
                <td class="amount">{{ formatCurrency(invoice.net_to_pay) }}</td>
                <td>{{ formatDate(invoice.created_at) }}</td>
                <td>
                  <button mat-icon-button 
                          color="primary" 
                          [routerLink]="['/invoices', invoice.id]"
                          matTooltip="Voir les détails">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div class="text-center py-8" *ngIf="filteredInvoices.length === 0 && !isLoading">
            <mat-icon class="text-gray-400 text-6xl">receipt</mat-icon>
            <p class="text-gray-600 mt-4">Aucune facture trouvée pour les filtres sélectionnés</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-overlay">
        <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .dashboard-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 0.5rem 0;
    }

    .dashboard-subtitle {
      color: #718096;
      margin: 0;
      font-size: 1rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #4a5568;
    }

    .header-icon {
      font-size: 1.5rem;
      color: #4a5568;
    }

    .current-date {
      font-weight: 500;
      color: #4a5568;
    }

    /* Styles pour les filtres */
    .filters-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .filters-container {
      display: flex;
      gap: 1rem;
      align-items: end;
      flex-wrap: wrap;
    }

    .filter-field {
      min-width: 200px;
      flex: 1;
    }

    .reset-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      height: 56px;
      padding: 0 1.5rem;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .kpi-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      border-left: 4px solid transparent;
    }

    .kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .kpi-card.primary {
      border-left-color: #3182ce;
    }

    .kpi-card.success {
      border-left-color: #38a169;
    }

    .kpi-card.warning {
      border-left-color: #d69e2e;
    }

    .kpi-card.info {
      border-left-color: #3182ce;
    }

    .kpi-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .kpi-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .kpi-card.primary .kpi-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .kpi-card.success .kpi-icon {
      background: linear-gradient(135deg, #38a169 0%, #48bb78 100%);
      color: white;
    }

    .kpi-card.warning .kpi-icon {
      background: linear-gradient(135deg, #d69e2e 0%, #f6ad55 100%);
      color: white;
    }

    .kpi-card.info .kpi-icon {
      background: linear-gradient(135deg, #3182ce 0%, #4299e1 100%);
      color: white;
    }

    .kpi-icon mat-icon {
      font-size: 1.5rem;
      width: 28px;
      height: 28px;
    }

    .kpi-info {
      flex: 1;
    }

    .kpi-value {
      font-size: 2rem;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 0.25rem 0;
    }

    .kpi-label {
      color: #718096;
      margin: 0;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .chart-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .chart-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a202c;
      margin: 0;
    }

    .chart-icon {
      color: #4a5568;
    }

    .chart-container {
      height: 300px;
      position: relative;
    }

    .table-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .table-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a202c;
      margin: 0;
    }

    .table-container {
      overflow-x: auto;
    }

    .invoices-table {
      width: 100%;
      border-collapse: collapse;
    }

    .invoices-table th {
      background: #f7fafc;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #4a5568;
      border-bottom: 2px solid #e2e8f0;
    }

    .invoices-table td {
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
      color: #2d3748;
    }

    .invoices-table tr:hover {
      background: #f7fafc;
    }

    .amount {
      font-weight: 600;
      color: #2d3748;
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
    }

    /* Responsive */
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
      }

      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .filters-container {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-field {
        min-width: auto;
        width: 100%;
      }

      .reset-btn {
        width: 100%;
        justify-content: center;
      }

      .kpi-grid {
        grid-template-columns: 1fr;
      }

      .charts-grid {
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
export class DashboardComponent implements OnInit {
  kpis: DashboardKPI | null = null;
  isLoading = false;
  
  // Propriétés pour les filtres
  selectedMonth: string = '';
  selectedYear: string = '';
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
    private dateService: DateService
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
    this.apiService.get<DashboardKPI>('/api/reports/dashboard/').subscribe({
      next: (response: ApiResponse<DashboardKPI>) => {
        // Le backend envoie les données directement, pas enveloppées dans response.data
        this.kpis = response.data || response;
        
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
        
        this.allInvoices = invoices;
        
        // Appliquer les filtres si nécessaire
        if (this.selectedMonth || this.selectedYear) {
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
        
        this.allCreditNotes = creditNotes;
        
        // Appliquer les filtres si nécessaire
        if (this.selectedMonth || this.selectedYear) {
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
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Méthodes pour les KPIs dynamiques
  getKpiValue(key: string): any {
    // Pour total_suppliers, toujours utiliser les données globales
    if (key === 'total_suppliers') {
      if (this.dynamicKpis) {
        return (this.dynamicKpis.overview as any)?.total_suppliers || 0;
      } else if (this.kpis) {
        return (this.kpis.overview as any)?.total_suppliers || 0;
      }
      return 0;
    }
    
    // Si des filtres sont appliqués, utiliser les KPIs dynamiques
    if (this.selectedMonth || this.selectedYear) {
      if (!this.dynamicKpis) return 0;
      
      // Le backend envoie les données du mois courant même avec filtres
      // On va calculer les KPIs depuis les factures filtrées
      const currentMonthData = (this.dynamicKpis.overview as any)?.current_month;
      
      // Vérifier si les données du backend correspondent au filtre
      const filterInfo = (this.dynamicKpis as any).filter_info;
      const backendMonth = (this.dynamicKpis as any).period?.current_month;
      const backendYear = (this.dynamicKpis as any).period?.current_year;
      
      // Si le backend n'a pas mis à jour les données, calculer depuis le tableau
      if (filterInfo?.month !== backendMonth || filterInfo?.year !== backendYear) {
        return this.calculateKpiFromFilteredInvoices(key);
      }
      
      // Sinon utiliser les données du backend
      return currentMonthData?.[key] || 0;
    }
    
    // Sinon, utiliser les KPIs du mois courant par défaut
    if (!this.kpis) return 0;
    return (this.kpis.overview as any)?.current_month?.[key] || 0;
  }

  // Calculer les KPIs depuis les factures filtrées
  calculateKpiFromFilteredInvoices(key: string): any {
    switch (key) {
      case 'invoice_count':
        // Compter seulement les factures (pas les avoirs)
        return this.filteredInvoices.filter(item => {
          return !(item.type === 'credit_note' || 
                   item.is_credit_note || 
                   item.invoice_type === 'credit_note' ||
                   item.credit_note_number ||
                   (item.invoice_number && item.invoice_number.startsWith('AV')));
        }).length;
      
      case 'credit_note_count':
        // Compter seulement les avoirs
        const creditNotes = this.filteredInvoices.filter(item => {
          return item.type === 'credit_note' || 
                 item.is_credit_note || 
                 item.invoice_type === 'credit_note' ||
                 item.credit_note_number ||
                 (item.invoice_number && item.invoice_number.startsWith('AV'));
        });
        return creditNotes.length;
      
      case 'total_invoices':
        // Somme des factures seulement
        const invoiceTotal = this.filteredInvoices
          .filter(item => {
            return !(item.type === 'credit_note' || 
                     item.is_credit_note || 
                     item.invoice_type === 'credit_note' ||
                     item.credit_note_number ||
                     (item.invoice_number && item.invoice_number.startsWith('AV')));
          })
          .reduce((sum, item) => {
            const amount = item.total_amount || item.net_to_pay || item.amount || 0;
            return sum + Number(amount);
          }, 0);
        return invoiceTotal;
      
      case 'total_credit_notes':
        // Somme des avoirs seulement
        const creditTotal = this.filteredInvoices
          .filter(item => {
            return item.type === 'credit_note' || 
                   item.is_credit_note || 
                   item.invoice_type === 'credit_note' ||
                   item.credit_note_number ||
                   (item.invoice_number && item.invoice_number.startsWith('AV'));
          })
          .reduce((sum, item) => {
            const amount = item.total_amount || item.amount || item.net_to_pay || 0;
            return sum + Number(amount);
          }, 0);
        return creditTotal;
      
      case 'net_amount':
        // Calculer net = factures - avoirs
        const totalInv = this.filteredInvoices
          .filter(item => {
            return !(item.type === 'credit_note' || 
                     item.is_credit_note || 
                     item.invoice_type === 'credit_note' ||
                     item.credit_note_number ||
                     (item.invoice_number && item.invoice_number.startsWith('AV')));
          })
          .reduce((sum, item) => sum + Number(item.total_amount || item.net_to_pay || item.amount || 0), 0);
        const totalCred = this.filteredInvoices
          .filter(item => {
            return item.type === 'credit_note' || 
                   item.is_credit_note || 
                   item.invoice_type === 'credit_note' ||
                   item.credit_note_number ||
                   (item.invoice_number && item.invoice_number.startsWith('AV'));
          })
          .reduce((sum, item) => sum + Number(item.total_amount || item.amount || item.net_to_pay || 0), 0);
        const netAmount = totalInv - totalCred;
        return netAmount;
      
      default:
        return 0;
    }
  }

  getKpiPeriod(): string {
    if (this.selectedMonth && this.selectedYear) {
      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      return `${monthNames[parseInt(this.selectedMonth) - 1]} ${this.selectedYear}`;
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
    return `${sign}${evolution.toFixed(1)}%`;
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
    this.loadDynamicKpis(); // Charger les KPIs pour ce mois
  }

  onYearFilterChange(year: string): void {
    this.selectedYear = year;
    this.applyFilters();
    this.loadDynamicKpis(); // Charger les KPIs pour cette année
  }

  resetFilters(): void {
    this.selectedMonth = '';
    this.selectedYear = '';
    this.filteredInvoices = this.kpis?.recent_invoices || [];
    this.dynamicKpis = null; // Revenir aux KPIs par défaut
  }

  applyFilters(): void {
    // Si aucun filtre n'est appliqué, afficher les factures récentes
    if (!this.selectedMonth && !this.selectedYear) {
      this.filteredInvoices = this.kpis?.recent_invoices || [];
      return;
    }

    // Si des filtres sont appliqués, combiner factures et avoirs
    if (!this.allInvoices || !this.allCreditNotes) {
      this.filteredInvoices = [];
      return;
    }

    // Filtrer les factures
    let filteredInvoices = [...this.allInvoices];
    if (this.selectedMonth || this.selectedYear) {
      filteredInvoices = filteredInvoices.filter(invoice => {
        if (!invoice.created_at && !invoice.invoice_date) return false;
        
        const dateToUse = invoice.created_at || invoice.invoice_date;
        const invoiceDate = new Date(dateToUse);
        const invoiceMonth = String(invoiceDate.getMonth() + 1).padStart(2, '0');
        const invoiceYear = String(invoiceDate.getFullYear());
        
        const monthMatch = !this.selectedMonth || invoiceMonth === this.selectedMonth;
        const yearMatch = !this.selectedYear || invoiceYear === String(this.selectedYear);
        
        return monthMatch && yearMatch;
      });
    }

    // Filtrer les avoirs
    let filteredCreditNotes = [...this.allCreditNotes];
    if (this.selectedMonth || this.selectedYear) {
      filteredCreditNotes = filteredCreditNotes.filter(creditNote => {
        if (!creditNote.created_at && !creditNote.credit_note_date) return false;
        
        const dateToUse = creditNote.created_at || creditNote.credit_note_date;
        const creditDate = new Date(dateToUse);
        const creditMonth = String(creditDate.getMonth() + 1).padStart(2, '0');
        const creditYear = String(creditDate.getFullYear());
        
        const monthMatch = !this.selectedMonth || creditMonth === this.selectedMonth;
        const yearMatch = !this.selectedYear || creditYear === String(this.selectedYear);
        
        return monthMatch && yearMatch;
      });
    }

    // Combiner factures et avoirs filtrés
    this.filteredInvoices = [...filteredInvoices, ...filteredCreditNotes];
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
        const key = `${inv.year}-${String(inv.month).padStart(2, '0')}`;
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
      console.log('✅ supplierChart rendered', { labels, data });
    } else {
      console.log('⚠️ supplierChart canvas not found');
    }
  }
}
