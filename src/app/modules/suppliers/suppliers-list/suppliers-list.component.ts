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

import { Supplier } from '../../../shared/models/business.model';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../shared/models/api.model';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-suppliers-list',
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
    RouterModule
  ],
  template: `
    <div class="suppliers-container">
      <!-- Header -->
      <div class="suppliers-header">
        <div>
          <h1 class="suppliers-title">Fournisseurs</h1>
          <div class="page-info">
            <mat-icon class="page-icon">business</mat-icon>
            <span class="page-text">Gestion des fournisseurs</span>
            <span class="page-badge">{{ suppliers.length }} fournisseur{{ suppliers.length > 1 ? 's' : '' }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button mat-stroked-button class="export-btn">
            <mat-icon>download</mat-icon>
            Exporter
          </button>
          <button mat-flat-button color="primary" routerLink="/suppliers/new" class="new-supplier-btn">
            <mat-icon>add</mat-icon>
            Nouveau fournisseur
          </button>
        </div>
      </div>

      <!-- Search Section -->
      <div class="search-section">
        <div class="search-header">
          <h2 class="search-title">Recherche</h2>
        </div>
        
        <div class="search-container">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Rechercher un fournisseur...</mat-label>
            <input matInput 
                   (keyup)="applyFilter($event)" 
                   placeholder="Nom, ville, SIRET..."
                   #input>
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>
      </div>

      <!-- Suppliers Table -->
      <div class="table-card">
        <div class="table-header">
          <div class="table-title-section">
            <h2>Liste des fournisseurs</h2>
            <span class="table-count">{{ dataSource.filteredData.length }} fournisseur{{ dataSource.filteredData.length > 1 ? 's' : '' }}</span>
          </div>
          <button mat-flat-button color="primary" routerLink="/suppliers/new" class="new-supplier-btn">
            <mat-icon>add</mat-icon>
            Nouveau fournisseur
          </button>
        </div>
        <div class="table-container">
          <div class="table-wrapper">
            <table class="suppliers-table">
              <thead>
                <tr>
                  <th class="col-name">Nom</th>
                  <th class="col-city">Ville</th>
                  <th class="col-phone">Téléphone</th>
                  <th class="col-status">Statut</th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let supplier of dataSource.filteredData" class="table-row">
                  <td class="col-name">
                    <div class="supplier-name-info">
                      <mat-icon class="supplier-icon">business</mat-icon>
                      <span class="supplier-text">{{ supplier.name }}</span>
                    </div>
                  </td>
                  <td class="col-city">
                    <div class="city-info">
                      <span class="city-text">{{ supplier.city || '-' }}</span>
                    </div>
                  </td>
                  <td class="col-phone">
                    <div class="phone-info">
                      <span class="phone-text">{{ supplier.phone || '-' }}</span>
                    </div>
                  </td>
                  <td class="col-status">
                    <span class="status-badge" [ngClass]="supplier.isActive ? 'status-paid' : 'status-overdue'">
                      {{ supplier.isActive ? 'Actif' : 'Inactif' }}
                    </span>
                  </td>
                  <td class="col-actions">
                    <div class="action-buttons">
                      <button mat-icon-button 
                              color="primary" 
                              [routerLink]="['/suppliers', supplier.id]"
                              matTooltip="Voir les détails"
                              class="action-btn">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button 
                              color="accent" 
                              [routerLink]="['/suppliers', supplier.id, 'edit']"
                              matTooltip="Modifier"
                              class="action-btn">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button 
                              color="warn"
                              (click)="deleteSupplier(supplier)"
                              matTooltip="Supprimer"
                              class="action-btn">
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
              <mat-icon class="empty-icon">business</mat-icon>
              <h3 class="empty-title">Aucun fournisseur trouvé</h3>
              <p class="empty-description">
                {{ dataSource.filter ? 'Essayez de modifier votre recherche pour voir plus de résultats.' : 'Commencez par créer votre premier fournisseur.' }}
              </p>
              <button mat-flat-button 
                      color="primary" 
                      routerLink="/suppliers/new"
                      *ngIf="!dataSource.filter"
                      class="empty-action">
                <mat-icon>add</mat-icon>
                Créer un fournisseur
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-overlay">
        <div class="loading-spinner">
          <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
          <span class="loading-text">Chargement des fournisseurs...</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .suppliers-container {
      padding: 2rem;
      max-width: 1280px;
      margin: 0 auto;
    }

    .suppliers-header {
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

    .suppliers-title {
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

    .new-supplier-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Search Section */
    .search-section {
      background: var(--surface-color);
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.04);
      padding: 1.5rem;
      margin-bottom: 2rem;
      border: 1px solid var(--border-light);
    }

    .search-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .search-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .search-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .search-field {
      width: 100%;
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

    .suppliers-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .suppliers-table th {
      background: var(--background-color);
      padding: 1rem;
      text-align: center;
      font-weight: 600;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-light);
      font-size: 0.875rem;
      white-space: nowrap;
    }

    .suppliers-table td {
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
    .col-name {
      width: 30%;
      text-align: center;
    }

    .col-city {
      width: 20%;
      text-align: center;
    }

    .col-phone {
      width: 20%;
      text-align: center;
    }

    .col-status {
      width: 15%;
      text-align: center;
    }

    .col-actions {
      width: 15%;
      text-align: center;
    }

    /* Contenu des cellules */
    .supplier-name-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .supplier-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--text-secondary);
    }

    .supplier-text {
      font-family: 'Inter', monospace;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .city-info, .phone-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .city-text, .phone-text {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
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
      .suppliers-container {
        padding: 1rem;
      }

      .suppliers-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .search-container {
        grid-template-columns: 1fr;
      }

      .table-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .suppliers-table {
        font-size: 0.875rem;
      }

      .suppliers-table th,
      .suppliers-table td {
        padding: 0.5rem;
      }
    }
  `]
})
export class SuppliersListComponent implements OnInit {
  suppliers: Supplier[] = [];
  dataSource = new MatTableDataSource<Supplier>();
  displayedColumns: string[] = ['name', 'city', 'phone', 'isActive', 'actions'];
  isLoading = false;

  constructor(
    private apiService: ApiService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    console.log('🔄 Starting to load suppliers...');
    this.isLoading = true;
    
    this.apiService.get<Supplier[]>('/api/suppliers/').subscribe({
      next: (response: any) => {
        console.log('✅ API Response received:', response);
        console.log('📊 Response type:', typeof response);
        console.log('🔍 Response keys:', Object.keys(response));
        
        // Handle different response formats
        if (response && typeof response === 'object') {
          if ('data' in response) {
            console.log('📦 Using response.data:', response.data);
            this.suppliers = response.data || [];
          } else if ('results' in response) {
            console.log('📦 Using response.results:', response.results);
            this.suppliers = response.results || [];
          } else {
            console.log('📦 Using direct response:', response);
            this.suppliers = Array.isArray(response) ? response : [];
          }
        } else {
          console.log('❌ Invalid response format:', response);
          this.suppliers = [];
        }
        
        // Map API response to match our interface
        this.suppliers = this.suppliers.map((supplier: any) => ({
          ...supplier,
          isActive: supplier.is_active !== undefined ? supplier.is_active : supplier.isActive
        }));
        
        console.log('📋 Final suppliers array:', this.suppliers);
        console.log('📏 Suppliers count:', this.suppliers.length);
        
        this.dataSource.data = this.suppliers;
        console.log('🗂️ DataSource data set:', this.dataSource.data);
        
        this.isLoading = false;
        console.log('✅ Load suppliers completed');
      },
      error: (error: any) => {
        console.error('❌ Error loading suppliers:', error);
        console.error('🔍 Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message
        });
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  deleteSupplier(supplier: Supplier): void {
    this.confirmationService.confirmDeleteSupplier(supplier.name).subscribe(confirmed => {
      if (confirmed) {
        this.apiService.delete(`/api/suppliers/${supplier.id}/`).subscribe({
          next: () => {
            this.loadSuppliers();
          },
          error: (error: any) => {
            console.error('Error deleting supplier:', error);
          }
        });
      }
    });
  }
}
