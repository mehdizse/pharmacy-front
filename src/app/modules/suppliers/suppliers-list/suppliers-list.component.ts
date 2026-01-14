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
    <div class="p-6">
      <div class="page-header">
        <h1 class="text-3xl font-bold mb-2">Fournisseurs</h1>
        <p class="text-blue-100">Gestion des fournisseurs</p>
      </div>

      <mat-card class="mb-6">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Liste des fournisseurs</h2>
            <button mat-raised-button color="primary" routerLink="/suppliers/new">
              <mat-icon>add</mat-icon>
              Nouveau fournisseur
            </button>
          </div>

          <div class="mb-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Rechercher...</mat-label>
              <input matInput 
                     (keyup)="applyFilter($event)" 
                     placeholder="Nom, ville, SIRET..."
                     #input>
            </mat-form-field>
          </div>

          <div class="table-container">
            <table mat-table [dataSource]="dataSource" matSort>
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nom</th>
                <td mat-cell *matCellDef="let supplier">{{ supplier.name }}</td>
              </ng-container>

              <ng-container matColumnDef="city">
                <th mat-header-cell *matHeaderCellDef>Ville</th>
                <td mat-cell *matCellDef="let supplier">{{ supplier.city }}</td>
              </ng-container>

              <ng-container matColumnDef="phone">
                <th mat-header-cell *matHeaderCellDef>Téléphone</th>
                <td mat-cell *matCellDef="let supplier">{{ supplier.phone }}</td>
              </ng-container>

              <ng-container matColumnDef="isActive">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let supplier">
                  <span [class]="supplier.isActive ? 'status-paid' : 'status-overdue'" 
                        class="status-badge">
                    {{ supplier.isActive ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let supplier">
                  <button mat-icon-button 
                          color="primary" 
                          [routerLink]="['/suppliers', supplier.id]">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button 
                          color="warn" 
                          (click)="deleteSupplier(supplier)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <div class="text-center py-8" *ngIf="suppliers.length === 0 && !isLoading">
              <mat-icon class="text-gray-400 text-6xl">business</mat-icon>
              <p class="text-gray-600 mt-4">Aucun fournisseur trouvé</p>
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
      min-width: 800px;
    }
    
    .table-container {
      overflow-x: auto;
    }
  `]
})
export class SuppliersListComponent implements OnInit {
  suppliers: Supplier[] = [];
  dataSource = new MatTableDataSource<Supplier>();
  displayedColumns: string[] = ['name', 'city', 'phone', 'isActive', 'actions'];
  isLoading = false;

  constructor(private apiService: ApiService) {}

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
    if (confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur ${supplier.name} ?`)) {
      this.apiService.delete(`/api/suppliers/${supplier.id}/`).subscribe({
        next: () => {
          this.loadSuppliers();
        },
        error: (error: any) => {
          console.error('Error deleting supplier:', error);
        }
      });
    }
  }
}
