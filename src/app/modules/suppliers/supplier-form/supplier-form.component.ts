import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';

import { Supplier } from '../../../shared/models/business.model';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../shared/models/api.model';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  template: `
    <div class="p-6">
      <div class="page-header">
        <h1 class="text-3xl font-bold mb-2">
          {{ isEditMode ? 'Modifier' : 'Nouveau' }} fournisseur
        </h1>
        <p class="text-blue-100">
          {{ isEditMode ? 'Modifier les informations' : 'Ajouter un nouveau fournisseur' }}
        </p>
      </div>

      <mat-card class="max-w-2xl mx-auto">
        <div class="p-6">
          <form [formGroup]="supplierForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <mat-form-field appearance="outline">
                <mat-label>Nom *</mat-label>
                <input matInput formControlName="name" placeholder="Nom du fournisseur">
                <mat-error *ngIf="supplierForm.get('name')?.hasError('required')">
                  Le nom est requis
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>SIRET</mat-label>
                <input matInput formControlName="siret" placeholder="Numéro SIRET">
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Adresse</mat-label>
              <input matInput formControlName="address" placeholder="Adresse complète">
            </mat-form-field>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <mat-form-field appearance="outline">
                <mat-label>Code postal</mat-label>
                <input matInput formControlName="postalCode" placeholder="Code postal">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Ville</mat-label>
                <input matInput formControlName="city" placeholder="Ville">
              </mat-form-field>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <mat-form-field appearance="outline">
                <mat-label>Téléphone</mat-label>
                <input matInput formControlName="phone" placeholder="Numéro de téléphone">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" placeholder="Email de contact">
                <mat-error *ngIf="supplierForm.get('email')?.hasError('email')">
                  L'email n'est pas valide
                </mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Statut</mat-label>
              <mat-select formControlName="isActive">
                <mat-option [value]="true">Actif</mat-option>
                <mat-option [value]="false">Inactif</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="flex justify-between">
              <button mat-stroked-button 
                      type="button" 
                      routerLink="/suppliers"
                      [disabled]="isLoading">
                Annuler
              </button>
              <div class="space-x-4">
                <button mat-stroked-button 
                        type="button" 
                        (click)="onSubmitAndNew()"
                        [disabled]="supplierForm.invalid || isLoading">
                  Enregistrer et nouveau
                </button>
                <button mat-raised-button 
                        color="primary" 
                        type="submit"
                        [disabled]="supplierForm.invalid || isLoading">
                  <span *ngIf="!isLoading">{{ isEditMode ? 'Mettre à jour' : 'Enregistrer' }}</span>
                  <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                </button>
              </div>
            </div>
          </form>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .mat-mdc-form-field {
      width: 100%;
    }
    
    button[mat-raised-button] {
      min-height: 44px;
    }
  `]
})
export class SupplierFormComponent implements OnInit {
  supplierForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  supplierId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.supplierForm = this.fb.group({
      name: ['', Validators.required],
      siret: [''],
      address: [''],
      postalCode: [''],
      city: [''],
      phone: [''],
      email: ['', [Validators.email]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.supplierId = id;
      this.loadSupplier(id);
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
        const mappedData = {
          ...supplierData,
          isActive: supplierData.is_active !== undefined ? supplierData.is_active : supplierData.isActive
        };
        
        this.supplierForm.patchValue(mappedData);
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      return;
    }

    this.isLoading = true;
    const supplierData = this.supplierForm.value;

    if (this.isEditMode && this.supplierId) {
      this.apiService.put(`/api/suppliers/${this.supplierId}/`, supplierData).subscribe({
        next: () => {
          this.snackBar.open('Fournisseur mis à jour avec succès', 'Fermer', {
            duration: 3000
          });
          this.router.navigate(['/suppliers']);
        },
        error: (error: any) => {
          this.isLoading = false;
        }
      });
    } else {
      this.apiService.post('/api/suppliers/', supplierData).subscribe({
        next: () => {
          this.snackBar.open('Fournisseur créé avec succès', 'Fermer', {
            duration: 3000
          });
          this.router.navigate(['/suppliers']);
        },
        error: (error: any) => {
          this.isLoading = false;
        }
      });
    }
  }

  onSubmitAndNew(): void {
    if (this.supplierForm.invalid) {
      return;
    }

    this.isLoading = true;
    const supplierData = this.supplierForm.value;

    this.apiService.post('/api/suppliers/', supplierData).subscribe({
      next: () => {
        this.snackBar.open('Fournisseur créé avec succès', 'Fermer', {
          duration: 3000
        });
        this.supplierForm.reset({
          isActive: true
        });
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error creating supplier:', error);
        this.isLoading = false;
      }
    });
  }
}
