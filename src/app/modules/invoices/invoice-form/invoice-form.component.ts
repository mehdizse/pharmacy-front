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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { Invoice, InvoiceStatus, Supplier } from '../../../shared/models/business.model';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../shared/models/api.model';
import { PdfService } from '../../../core/services/pdf.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DateService } from '../../../core/services/date.service';

@Component({
  selector: 'app-invoice-form',
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
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    RouterModule,
    MatTableModule,
    MatDialogModule
  ],
  template: `
    <div class="p-6">
      <div class="page-header">
        <h1 class="text-3xl font-bold mb-2">
          {{ isEditMode ? 'Modifier' : 'Nouvelle' }} facture
        </h1>
        <p class="text-blue-100">
          {{ isEditMode ? 'Modifier les informations' : 'Ajouter une nouvelle facture' }}
        </p>
      </div>

      <mat-card class="max-w-4xl mx-auto">
        <div class="p-6">
          <!-- Message d'erreur -->
          <div class="error-message" *ngIf="errorMessage">
            <mat-icon class="error-icon">error</mat-icon>
            <span class="error-text">{{ errorMessage }}</span>
            <button mat-icon-button class="error-close" (click)="errorMessage = null">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <form [formGroup]="invoiceForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Informations générales -->
            <div class="border rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">Informations générales</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <mat-form-field appearance="outline">
                  <mat-label>Numéro facture *</mat-label>
                  <input matInput formControlName="invoiceNumber" placeholder="Numéro de facture">
                  <mat-error *ngIf="invoiceForm.get('invoiceNumber')?.hasError('required')">
                    Le numéro est requis
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Fournisseur *</mat-label>
                  <mat-select formControlName="supplierId">
                    <mat-option value="">Sélectionner un fournisseur</mat-option>
                    <mat-option *ngFor="let supplier of suppliers" [value]="supplier.id">
                      {{ supplier.name }}
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="invoiceForm.get('supplierId')?.hasError('required')">
                    Le fournisseur est requis
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Date facture *</mat-label>
                  <input matInput 
                         [matDatepicker]="invoiceDatePicker" 
                         formControlName="invoiceDate"
                         readonly>
                  <mat-datepicker-toggle matSuffix [for]="invoiceDatePicker">
                    <mat-icon>calendar_today</mat-icon>
                  </mat-datepicker-toggle>
                  <mat-datepicker #invoiceDatePicker></mat-datepicker>
                  <mat-error *ngIf="invoiceForm.get('invoiceDate')?.hasError('required')">
                    La date est requise
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Date d'échéance *</mat-label>
                  <input matInput 
                         [matDatepicker]="dueDatePicker" 
                         formControlName="dueDate"
                         readonly>
                  <mat-datepicker-toggle matSuffix [for]="dueDatePicker">
                    <mat-icon>calendar_today</mat-icon>
                  </mat-datepicker-toggle>
                  <mat-datepicker #dueDatePicker></mat-datepicker>
                </mat-form-field>
              </div>
            </div>

            <!-- Net à payer -->
            <div class="border rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">Montant</h3>
              <div class="grid grid-cols-1 md:grid-cols-1 gap-6">
                <div>
                  <mat-form-field appearance="outline">
                    <mat-label>Net à payer</mat-label>
                    <input matInput type="number" formControlName="netToPay">
                    <mat-error *ngIf="invoiceForm.get('netToPay')?.hasError('required')">
                      Net à payer est requis
                    </mat-error>
                  </mat-form-field>
                </div>
              </div>
            </div>

            <!-- Informations supplémentaires -->
            <div class="border rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">Informations supplémentaires</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <mat-form-field appearance="outline">
                  <mat-label>Statut</mat-label>
                  <mat-select formControlName="status">
                    <mat-option value="DRAFT">Brouillon</mat-option>
                    <mat-option value="PENDING">En attente</mat-option>
                    <mat-option value="PAID">Payée</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Notes</mat-label>
                  <textarea matInput 
                            formControlName="notes" 
                            rows="3"
                            placeholder="Notes ou commentaires...">
                  </textarea>
                </mat-form-field>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-between">
              <button mat-stroked-button 
                      type="button" 
                      routerLink="/invoices"
                      [disabled]="isLoading">
                Annuler
              </button>
              <div class="space-x-4">
                <button mat-stroked-button 
                        type="button" 
                        (click)="onSubmitAndNew()"
                        [disabled]="invoiceForm.invalid || isLoading">
                  Enregistrer et nouveau
                </button>
                <button mat-raised-button 
                        color="primary" 
                        type="submit"
                        [disabled]="invoiceForm.invalid || isLoading">
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
    
    .table-container {
      overflow-x: auto;
    }
    
    .mat-mdc-table {
      min-width: 800px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 12px;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      animation: slideDown 0.3s ease-out;
    }

    .error-icon {
      color: #dc2626;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .error-text {
      color: #dc2626;
      font-weight: 500;
      flex: 1;
    }

    .error-close {
      color: #dc2626;
      width: 32px;
      height: 32px;
    }

    .error-close:hover {
      background-color: #fecaca;
      border-radius: 50%;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class InvoiceFormComponent implements OnInit {
  invoiceForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  invoiceId: string | null = null;
  suppliers: Supplier[] = [];
  errorMessage: string | null = null;


  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private pdfService: PdfService,
    private notificationService: NotificationService,
    private dateService: DateService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Initialiser le locale français pour les dates
    this.dateService.initFrenchLocale();
    
    this.invoiceForm = this.fb.group({
      invoiceNumber: ['', Validators.required],
      supplierId: [null, Validators.required],
      invoiceDate: [new Date(), Validators.required],
      dueDate: [new Date()],
      netToPay: [0, Validators.required],
      status: [InvoiceStatus.DRAFT],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadSuppliers();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.invoiceId = id;
      this.loadInvoice(id);
    }

    // Effacer l'erreur quand l'utilisateur modifie le formulaire
    this.invoiceForm.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = null;
      }
    });
  }

  loadSuppliers(): void {
    this.apiService.get<Supplier[]>('/api/suppliers/').subscribe({
      next: (response: any) => {
        if (response && typeof response === 'object') {
          if ('data' in response) {
            this.suppliers = response.data || [];
          } else if ('results' in response) {
            this.suppliers = response.results || [];
          } else {
            this.suppliers = Array.isArray(response) ? response : [];
          }
        } else {
          this.suppliers = [];
        }
      },
      error: (error: any) => {
        console.error('Error loading suppliers:', error);
      }
    });
  }

  loadInvoice(id: string): void {
    this.isLoading = true;
    this.apiService.get<Invoice>(`/api/invoices/${id}/`).subscribe({
      next: (response: any) => {
        const invoice = response && typeof response === 'object' && 'data' in response ? response.data : response;
        const netToPay = invoice.netToPay ?? invoice.net_to_pay ?? 0;

        const supplierId = invoice.supplierId ?? invoice.supplier_id ?? invoice.supplier?.id ?? invoice.supplier;
        const invoiceNumber = invoice.invoiceNumber ?? invoice.invoice_number;
        const invoiceDate = invoice.invoiceDate ?? invoice.invoice_date;
        const dueDate = invoice.dueDate ?? invoice.due_date;

        this.invoiceForm.patchValue({
          invoiceNumber,
          supplierId,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
          dueDate: dueDate ? new Date(dueDate) : null,
          netToPay,
          status: invoice.status,
          notes: invoice.notes
        });
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading invoice:', error);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.invoiceForm.invalid) {
      return;
    }

    this.isLoading = true;
    const netToPay = Number(this.invoiceForm.get('netToPay')?.value || 0);

    const invoiceDateStr = this.dateService.toApiFormat(this.invoiceForm.get('invoiceDate')?.value);
    const dueDateStr = this.dateService.toApiFormat(this.invoiceForm.get('dueDate')?.value);
    const supplierId = this.invoiceForm.get('supplierId')?.value;

    // Backend payload (snake_case)
    const backendPayload: any = {
      invoice_number: this.invoiceForm.get('invoiceNumber')?.value,
      supplier: supplierId,
      invoice_date: invoiceDateStr,
      net_to_pay: netToPay,
      status: this.invoiceForm.get('status')?.value,
      notes: this.invoiceForm.get('notes')?.value
    };

    // due_date is optional
    if (dueDateStr) {
      backendPayload.due_date = dueDateStr;
    }

    // Backward-compatible payload: send new fields + legacy fields in case backend still expects them
    const invoiceData: any = {
      ...backendPayload,
      // keep old keys too, harmless if backend ignores them
      invoiceNumber: backendPayload.invoice_number,
      supplierId: backendPayload.supplier,
      invoiceDate: backendPayload.invoice_date,
      dueDate: backendPayload.due_date,
      netToPay
    };

    if (this.isEditMode && this.invoiceId) {
      this.apiService.put(`/api/invoices/${this.invoiceId}/`, invoiceData).subscribe({
        next: () => {
          this.notificationService.success('Facture mise à jour avec succès');
          this.router.navigate(['/invoices']);
        },
        error: (error: any) => {
          console.error('Error updating invoice:', error);
          this.handleApiError(error);
          this.isLoading = false;
        }
      });
    } else {
      this.apiService.post('/api/invoices/', invoiceData).subscribe({
        next: () => {
          this.notificationService.success('Facture créée avec succès');
          this.router.navigate(['/invoices']);
        },
        error: (error: any) => {
          console.error('Error creating invoice:', error);
          this.handleApiError(error);
          this.isLoading = false;
        }
      });
    }
  }

  onSubmitAndNew(): void {
    this.onSubmit();
    if (!this.isEditMode) {
      this.invoiceForm.reset({
        invoiceNumber: '',
        supplierId: null,
        invoiceDate: new Date(),
        dueDate: new Date(),
        netToPay: 0,
        status: InvoiceStatus.DRAFT,
        notes: ''
      });
    }
  }

  generatePDF(invoice: Invoice): void {
    this.pdfService.generateInvoicePDF(invoice);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  private handleApiError(error: any): void {
    let errorMessage = 'Une erreur est survenue lors de l\'opération.';
    
    if (error.error && typeof error.error === 'object') {
      // Gérer les erreurs de validation du backend
      if (error.error.invoice_number && Array.isArray(error.error.invoice_number)) {
        errorMessage = error.error.invoice_number.join(', ');
      } else if (error.error.detail) {
        errorMessage = error.error.detail;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.non_field_errors && Array.isArray(error.error.non_field_errors)) {
        errorMessage = error.error.non_field_errors.join(', ');
      } else {
        // Extraire le premier message d'erreur disponible
        const firstErrorKey = Object.keys(error.error)[0];
        const firstError = error.error[firstErrorKey];
        if (Array.isArray(firstError)) {
          errorMessage = firstError.join(', ');
        } else if (typeof firstError === 'string') {
          errorMessage = firstError;
        }
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    this.errorMessage = errorMessage;
    
    // Scroll vers le haut pour voir l'erreur
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }
}
