import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
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
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
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
    MatPaginatorModule,
    RouterModule
  ],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="page-header">
        <h1 class="text-3xl font-bold mb-2">Fournisseurs</h1>
        <div class="page-info">
          <mat-icon class="page-icon">business</mat-icon>
          <span class="page-text">Gestion des fournisseurs</span>
          <span class="page-badge">{{ suppliers.length }} fournisseur{{ suppliers.length > 1 ? 's' : '' }}</span>
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

      <!-- Paginator -->
      <mat-paginator 
        [pageSizeOptions]="[10, 20, 50, 100]"
        [pageSize]="20"
        showFirstLastButtons
        showPageSizeSelect
        aria-label="Pagination des fournisseurs"
        itemsPerPageLabel="Éléments par page"
        nextPageLabel="Page suivante"
        previousPageLabel="Page précédente"
        firstPageLabel="Première page"
        lastPageLabel="Dernière page">
      </mat-paginator>

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
    .page-header {
      text-align: left;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--surface-color);
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.04);
      border: 1px solid var(--border-light);
    }

    .page-header h1 {
      font-size: 2rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.75rem 0;
    }

    .page-info {
      text-align: left;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .page-icon {
      font-size: 1rem;
      color: var(--text-secondary);
      margin-right: 0.25rem;
      vertical-align: middle;
    }

    .page-text {
      font-weight: 400;
      margin-right: 0.5rem;
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
export class SuppliersListComponent implements OnInit, AfterViewInit {
  suppliers: Supplier[] = [];
  dataSource = new MatTableDataSource<Supplier>();
  displayedColumns: string[] = ['name', 'city', 'phone', 'isActive', 'actions'];
  isLoading = false;
  totalCount = 0;
  pageSize = 20;
  currentPage = 0;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private apiService: ApiService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  ngAfterViewInit(): void {
    // Configurer le paginator pour utiliser notre pagination personnalisée
    this.paginator.page.subscribe((event: PageEvent) => {
      this.pageSize = event.pageSize;
      this.currentPage = event.pageIndex;
      this.loadSuppliers(); // Recharger avec la nouvelle page
    });
    
    // Configurer les labels français
    this.paginator._intl.itemsPerPageLabel = "Éléments par page";
    this.paginator._intl.nextPageLabel = "Page suivante";
    this.paginator._intl.previousPageLabel = "Page précédente";
    this.paginator._intl.firstPageLabel = "Première page";
    this.paginator._intl.lastPageLabel = "Dernière page";
    this.paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return `0 sur ${length}`;
      }
      length = Math.max(length, 0);
      const startIndex = page * pageSize;
      const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} sur ${length}`;
    };
  }

  loadSuppliers(): void {
    this.isLoading = true;
    
    const page = this.currentPage + 1; // API utilise 1-based, Angular utilise 0-based
    const url = `/api/suppliers/?page=${page}&page_size=${this.pageSize}`;
    
    this.apiService.get<Supplier[]>(url).subscribe({
      next: (response: any) => {
        // Handle different response formats
        if (response && typeof response === 'object') {
          if ('results' in response) {
            // Pagination format
            this.suppliers = response.results || [];
            this.totalCount = response.count || 0;
          } else if ('data' in response) {
            this.suppliers = response.data || [];
            this.totalCount = this.suppliers.length;
          } else {
            this.suppliers = Array.isArray(response) ? response : [];
            this.totalCount = this.suppliers.length;
          }
        } else {
          this.suppliers = [];
          this.totalCount = 0;
        }
        
        // Map API response to match our interface
        this.suppliers = this.suppliers.map((supplier: any) => ({
          ...supplier,
          isActive: supplier.is_active !== undefined ? supplier.is_active : supplier.isActive
        }));
        
        // Configurer le dataSource SANS paginator (on gère manuellement)
        this.dataSource.data = this.suppliers;
        
        // Mettre à jour les infos du paginator
        this.paginator.length = this.totalCount;
        this.paginator.pageSize = this.pageSize;
        this.paginator.pageIndex = this.currentPage;
        
        this.isLoading = false;
      },
      error: (error: any) => {
        this.suppliers = [];
        this.dataSource.data = [];
        this.totalCount = 0;
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
          }
        });
      }
    });
  }
}
