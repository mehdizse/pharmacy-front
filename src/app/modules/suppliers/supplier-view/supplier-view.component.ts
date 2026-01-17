import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Supplier } from '../../../shared/models/business.model';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-supplier-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="page-header">
        <h1 class="text-3xl font-bold mb-2">Détails du fournisseur</h1>
        <div class="page-info">
          <mat-icon class="page-icon">business</mat-icon>
          <span class="page-text">Visualisation des informations</span>
        </div>
      </div>

      <!-- Supplier Details -->
      <div class="supplier-details" *ngIf="!isLoading && supplier">
        <mat-card class="detail-card">
          <div class="card-header">
            <h2>Informations générales</h2>
            <div class="header-actions">
              <button mat-stroked-button 
                      [routerLink]="['/suppliers', supplier.id, 'edit']"
                      color="accent">
                <mat-icon>edit</mat-icon>
                Modifier
              </button>
              <button mat-stroked-button 
                      routerLink="/suppliers">
                <mat-icon>arrow_back</mat-icon>
                Retour
              </button>
            </div>
          </div>
          
          <div class="detail-content">
            <div class="detail-grid">
              <div class="detail-item">
                <label>Nom</label>
                <span>{{ supplier.name || '-' }}</span>
              </div>
              
              <div class="detail-item">
                <label>SIRET</label>
                <span>{{ supplier.siret || '-' }}</span>
              </div>
              
              <div class="detail-item full-width">
                <label>Adresse</label>
                <span>{{ supplier.address || '-' }}</span>
              </div>
              
              <div class="detail-item">
                <label>Code postal</label>
                <span>{{ supplier.postalCode || '-' }}</span>
              </div>
              
              <div class="detail-item">
                <label>Ville</label>
                <span>{{ supplier.city || '-' }}</span>
              </div>
              
              <div class="detail-item">
                <label>Téléphone</label>
                <span>{{ supplier.phone || '-' }}</span>
              </div>
              
              <div class="detail-item">
                <label>Email</label>
                <span>{{ supplier.email || '-' }}</span>
              </div>
              
              <div class="detail-item">
                <label>Statut</label>
                <span class="status-badge" [ngClass]="supplier.isActive ? 'status-active' : 'status-inactive'">
                  {{ supplier.isActive ? 'Actif' : 'Inactif' }}
                </span>
              </div>
            </div>
          </div>
        </mat-card>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
        <p>Chargement des informations...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="!isLoading && !supplier" class="error-state">
        <mat-icon class="error-icon">error</mat-icon>
        <h3>Fournisseur non trouvé</h3>
        <p>Le fournisseur que vous recherchez n'existe pas ou a été supprimé.</p>
        <button mat-raised-button color="primary" routerLink="/suppliers">
          Retour à la liste
        </button>
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
      display: flex;
      align-items: center;
      justify-content: flex-start;
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

    .detail-card {
      margin-bottom: 2rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-light);
    }

    .card-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .detail-content {
      padding: 1.5rem;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-item.full-width {
      grid-column: 1 / -1;
    }

    .detail-item label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .detail-item span {
      font-size: 1rem;
      color: var(--text-primary);
      font-weight: 500;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .status-active {
      background: #DCFCE7;
      color: #16A34A;
    }

    .status-inactive {
      background: #FEE2E2;
      color: #DC2626;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      gap: 1rem;
    }

    .loading-state p {
      color: var(--text-secondary);
      margin: 0;
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      text-align: center;
      gap: 1rem;
    }

    .error-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: var(--error-color);
    }

    .error-state h3 {
      margin: 0;
      color: var(--text-primary);
    }

    .error-state p {
      color: var(--text-secondary);
      margin: 0;
    }
  `]
})
export class SupplierViewComponent implements OnInit {
  supplier: Supplier | null = null;
  isLoading = false;
  supplierId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.supplierId = id;
      this.loadSupplier(id);
    } else {
      this.router.navigate(['/suppliers']);
    }
  }

  loadSupplier(id: string): void {
    this.isLoading = true;
    this.apiService.get<Supplier>(`/api/suppliers/${id}/`).subscribe({
      next: (response: any) => {
        // Handle different response formats
        let supplierData;
        if (response && typeof response === 'object') {
          if ('data' in response) {
            supplierData = response.data;
          } else {
            supplierData = response;
          }
        } else {
          supplierData = response;
        }
        
        // Map API response to match our interface
        this.supplier = {
          ...supplierData,
          isActive: supplierData.is_active !== undefined ? supplierData.is_active : supplierData.isActive
        };
        
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        this.supplier = null;
      }
    });
  }
}
