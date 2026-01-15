import { Component, OnInit, ViewChild } from '@angular/core';
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

import { CreditNote, Invoice } from '../../../shared/models/business.model';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../shared/models/api.model';
import { PdfService } from '../../../core/services/pdf.service';
import { DateService } from '../../../core/services/date.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-credit-note-form',
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
          {{ isEditMode ? 'Modifier' : 'Nouvel' }} avoir
        </h1>
        <p class="text-blue-100">
          {{ isEditMode ? 'Modifier les informations' : 'Ajouter un nouvel avoir' }}
        </p>
      </div>

      <mat-card class="max-w-2xl mx-auto">
        <div class="p-6">
          <!-- Message d'erreur -->
          <div class="error-message" *ngIf="errorMessage">
            <mat-icon class="error-icon">error</mat-icon>
            <span class="error-text">{{ errorMessage }}</span>
            <button mat-icon-button class="error-close" (click)="errorMessage = null">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <form [formGroup]="creditNoteForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Informations générales -->
            <div class="border rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">Informations générales</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <mat-form-field appearance="outline">
                  <mat-label>Numéro avoir *</mat-label>
                  <input matInput formControlName="creditNoteNumber" placeholder="Numéro d'avoir">
                  <mat-error *ngIf="creditNoteForm.get('creditNoteNumber')?.hasError('required')">
                    Le numéro est requis
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Facture associée *</mat-label>
                  <input matInput 
                         placeholder="Rechercher par numéro de facture..."
                         (keyup)="filterInvoices($event)"
                         #invoiceSearch>
                  <mat-select formControlName="invoiceId" (selectionChange)="onInvoiceSelected()">
                    <mat-option value="">Sélectionner une facture</mat-option>
                    <mat-option *ngFor="let invoice of filteredInvoices" [value]="invoice.id">
                      {{ invoice.invoiceNumber }} - {{ invoice.supplier.name }}
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="creditNoteForm.get('invoiceId')?.hasError('required')">
                    La facture est requise
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Date avoir *</mat-label>
                  <input matInput 
                         [matDatepicker]="creditDatePicker" 
                         formControlName="creditDate"
                         readonly>
                  <mat-datepicker-toggle matSuffix [for]="creditDatePicker">
                    <mat-icon>calendar_today</mat-icon>
                  </mat-datepicker-toggle>
                  <mat-datepicker #creditDatePicker></mat-datepicker>
                  <mat-error *ngIf="creditNoteForm.get('creditDate')?.hasError('required')">
                    La date est requise
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Montant *</mat-label>
                  <input matInput 
                         type="number"
                         step="0.01"
                         formControlName="amount" 
                         placeholder="0.00">
                  <mat-error *ngIf="creditNoteForm.get('amount')?.hasError('required')">
                    Le montant est requis
                  </mat-error>
                  <mat-error *ngIf="creditNoteForm.get('amount')?.hasError('min')">
                    Le montant doit être positif
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <!-- Motif -->
            <div class="border rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">Motif de l'avoir</h3>
              <mat-form-field appearance="outline">
                <mat-label>Motif</mat-label>
                <textarea matInput 
                          formControlName="reason" 
                          rows="4"
                          placeholder="Expliquez la raison de cet avoir...">
                </textarea>
              </mat-form-field>
            </div>

            <!-- Statut -->
            <div class="border rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">Statut</h3>
              <mat-form-field appearance="outline">
                <mat-label>Statut</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="DRAFT">Brouillon</mat-option>
                  <mat-option value="PENDING">En attente</mat-option>
                  <mat-option value="APPLIED">Appliqué</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Actions -->
            <div class="flex justify-between">
              <button mat-stroked-button 
                      type="button" 
                      routerLink="/credit-notes"
                      [disabled]="isLoading">
                Annuler
              </button>
              <div class="space-x-4">
                <button mat-stroked-button 
                        type="button" 
                        (click)="onSubmitAndNew()"
                        [disabled]="creditNoteForm.invalid || isLoading">
                  Enregistrer et nouveau
                </button>
                <button mat-raised-button 
                        color="primary" 
                        type="submit"
                        [disabled]="creditNoteForm.invalid || isLoading">
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
export class CreditNoteFormComponent implements OnInit {
  creditNoteForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  creditNoteId: string | null = null;
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  suppliers: any[] = [];
  errorMessage: string | null = null;
  
  @ViewChild('invoiceSearch') invoiceSearch: any;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private pdfService: PdfService,
    private dateService: DateService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Initialiser le locale français pour les dates
    this.dateService.initFrenchLocale();
    
    this.creditNoteForm = this.fb.group({
      creditNoteNumber: ['', Validators.required],
      invoiceId: [null, Validators.required],
      creditDate: [new Date(), Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      reason: [''],
      status: ['DRAFT']
    });
  }

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadInvoices();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.creditNoteId = id; // Garder comme string (UUID)
      this.loadCreditNote(id);
    }

    // Effacer l'erreur quand l'utilisateur modifie le formulaire
    this.creditNoteForm.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = null;
      }
      
      // Log les changements du motif en temps réel
      const reasonValue = this.creditNoteForm.get('reason')?.value;
      console.log('🔍 MOTIF - Real-time reason field change:', reasonValue);
    });
  }

  loadSuppliers(): void {
    console.log('🔍 MOTIF - Loading suppliers...');
    this.apiService.get<any[]>('/api/suppliers/').subscribe({
      next: (response: any) => {
        console.log('🔍 MOTIF - Suppliers API response:', response);
        
        // Handle different response formats
        let suppliers: any[] = [];
        if (response && typeof response === 'object') {
          if ('data' in response) {
            suppliers = response.data || [];
          } else if ('results' in response) {
            suppliers = response.results || [];
          } else {
            suppliers = Array.isArray(response) ? response : [];
          }
        }
        
        this.suppliers = suppliers;
        console.log('🔍 MOTIF - Loaded suppliers:', this.suppliers);
        console.log('🔍 MOTIF - Suppliers count:', this.suppliers.length);
      },
      error: (error: any) => {
        console.error('🔍 MOTIF - Error loading suppliers:', error);
        this.suppliers = [];
      }
    });
  }

  loadInvoices(): void {
    this.apiService.get<Invoice[]>('/api/invoices/').subscribe({
      next: (response: any) => {
        // Handle different response formats
        let invoices: Invoice[] = [];
        if (response && typeof response === 'object') {
          if ('data' in response) {
            invoices = response.data || [];
          } else if ('results' in response) {
            invoices = response.results || [];
          } else {
            invoices = Array.isArray(response) ? response : [];
          }
        }
        
        // Map API response to match our interface
        this.invoices = invoices.map((invoice: any) => {
          // Find supplier by name
          const supplier = this.suppliers.find(s => 
            s.name === invoice.supplier_name || 
            s.code === invoice.supplier_code
          );
          
          const mappedInvoice = {
            ...invoice,
            invoiceNumber: invoice.invoice_number,
            invoiceDate: invoice.invoice_date,
            dueDate: invoice.due_date,
            netToPay: parseFloat(invoice.net_to_pay),
            supplier: {
              id: supplier?.id || null,
              name: invoice.supplier_name,
              code: invoice.supplier_code
            },
            status: invoice.status || 'PENDING'
          };
          
          return mappedInvoice;
        }).filter(invoice => invoice.status !== 'CANCELLED');
        
        // Initialize filtered invoices with all invoices
        this.filteredInvoices = [...this.invoices];
      },
      error: (error: any) => {
        this.invoices = [];
      }
    });
  }

  filterInvoices(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    
    if (!filterValue) {
      this.filteredInvoices = [...this.invoices];
    } else {
      this.filteredInvoices = this.invoices.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(filterValue) ||
        invoice.supplier.name.toLowerCase().includes(filterValue)
      );
    }
  }

  onInvoiceSelected(): void {
    // Vider le champ de recherche et réinitialiser la liste
    if (this.invoiceSearch) {
      this.invoiceSearch.nativeElement.value = '';
      this.filteredInvoices = [...this.invoices];
    }
    
    // Récupérer l'ID de la facture sélectionnée
    const invoiceId = this.creditNoteForm.get('invoiceId')?.value;
    if (!invoiceId) return;
    
    // Trouver la facture sélectionnée
    const selectedInvoice = this.invoices.find(inv => inv.id === invoiceId);
    if (!selectedInvoice || !selectedInvoice.supplier) return;
    
    // Mettre à jour le supplier dans le formulaire (si le champ existe)
    // Note: Le backend attend le supplier ID, mais on peut le déduire de la facture
    console.log('🔍 MOTIF - Invoice selected:', selectedInvoice);
    console.log('🔍 MOTIF - Supplier from invoice:', selectedInvoice.supplier);
  }

  formatDateForAPI(date: Date): string {
    // Format date as YYYY-MM-DD for API
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadCreditNote(id: string): void {
    this.isLoading = true;
    this.apiService.get<CreditNote>(`/api/credit-notes/${id}/`).subscribe({
      next: (response: any) => {
        // Gérer différents formats de réponse API
        const creditNote = response && typeof response === 'object' && 'data' in response ? response.data : response;
        
        console.log('🔍 MOTIF - Loading credit note:', creditNote);
        console.log('🔍 MOTIF - Backend reason field:', creditNote.reason);
        console.log('🔍 MOTIF - Backend motif field:', creditNote.motif);
        
        // Extraire le motif correctement
        const motifValue = creditNote.reason || creditNote.motif || '';
        console.log('🔍 MOTIF - Final motif value to set in form:', motifValue);
        
        this.creditNoteForm.patchValue({
          creditNoteNumber: creditNote.credit_note_number || creditNote.creditNoteNumber,
          invoiceId: creditNote.invoice_id || creditNote.invoice?.id,
          creditDate: new Date(creditNote.credit_note_date || creditNote.creditDate),
          amount: typeof creditNote.amount === 'string' ? parseFloat(creditNote.amount) : creditNote.amount,
          reason: motifValue,
          status: creditNote.status || 'DRAFT'
        });
        
        console.log('🔍 MOTIF - Form reason field value after patch:', this.creditNoteForm.get('reason')?.value);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.log('🔍 MOTIF - Error loading credit note:', error);
        this.errorMessage = 'Erreur lors du chargement de l\'avoir';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.creditNoteForm.invalid) {
      console.log('🔍 MOTIF - Form is invalid:', this.creditNoteForm.errors);
      return;
    }

    this.isLoading = true;
    const creditNoteData = this.creditNoteForm.value;
    
    console.log('🔍 MOTIF - Form data before sending:', creditNoteData);
    console.log('🔍 MOTIF - Reason field from form:', creditNoteData.reason);
    
    // Find selected invoice (pour les logs et pour le supplier)
    const selectedInvoice = this.invoices.find(inv => inv.id === creditNoteData.invoiceId);
    console.log('🔍 MOTIF - Selected invoice:', selectedInvoice);
    
    // Find supplier by name from the suppliers list
    let supplierId = null;
    if (selectedInvoice?.supplier?.name) {
      const supplier = this.suppliers.find(s => 
        s.name === selectedInvoice.supplier.name
      );
      supplierId = supplier?.id || null;
      console.log('🔍 MOTIF - Found supplier:', supplier);
      console.log('🔍 MOTIF - Supplier ID:', supplierId);
    }
    
    // Map frontend field names to backend field names
    const payload = {
      invoice: creditNoteData.invoiceId, // UUID de la facture
      supplier: supplierId, // ID du fournisseur trouvé
      credit_note_number: creditNoteData.creditNoteNumber,
      credit_note_date: this.formatDateForAPI(creditNoteData.creditDate),
      amount: creditNoteData.amount,
      reason: creditNoteData.reason || '',
      // status: optionnel, le backend mettra défaut
      ...(creditNoteData.status && creditNoteData.status !== 'DRAFT' && { 
        status: creditNoteData.status 
      })
    };

    console.log('🔍 MOTIF - Payload to send to backend:', payload);
    console.log('🔍 MOTIF - Payload reason field:', payload.reason);

    if (this.isEditMode && this.creditNoteId) {
      console.log('🔍 MOTIF - UPDATE mode - sending PUT to:', `/api/credit-notes/${this.creditNoteId}/`);
      this.apiService.put(`/api/credit-notes/${this.creditNoteId}/`, payload).subscribe({
        next: (response) => {
          console.log('🔍 MOTIF - UPDATE success response:', response);
          this.notificationService.success('Avoir mis à jour avec succès');
          this.router.navigate(['/credit-notes']);
        },
        error: (error: any) => {
          console.log('🔍 MOTIF - UPDATE error:', error);
          console.log('🔍 MOTIF - UPDATE error details:', error.error);
          this.handleApiError(error);
          this.isLoading = false;
        }
      });
    } else {
      console.log('🔍 MOTIF - CREATE mode - sending POST to: /api/credit-notes/');
      this.apiService.post('/api/credit-notes/', payload).subscribe({
        next: (response: any) => {
          console.log('🔍 MOTIF - CREATE success response:', response);
          console.log('🔍 MOTIF - CREATE response data:', response?.data);
          console.log('🔍 MOTIF - CREATE response motif field:', (response?.data as any)?.motif);
          console.log('🔍 MOTIF - CREATE response reason field:', (response?.data as any)?.reason);
          this.notificationService.success('Avoir créé avec succès');
          this.router.navigate(['/credit-notes']);
        },
        error: (error: any) => {
          console.log('🔍 MOTIF - CREATE error:', error);
          console.log('🔍 MOTIF - CREATE error details:', error.error);
          this.handleApiError(error);
          this.isLoading = false;
        }
      });
    }
  }

  onSubmitAndNew(): void {
    this.onSubmit();
    if (!this.isEditMode) {
      this.creditNoteForm.reset({
        creditNoteNumber: '',
        invoiceId: null,
        creditDate: new Date(),
        amount: 0,
        reason: '',
        status: 'DRAFT'
      });
    }
  }

  generatePDF(creditNote: CreditNote): void {
    this.pdfService.generateCreditNotePDF(creditNote);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  private handleApiError(error: any): void {
    let errorMessage = 'Une erreur est survenue lors de l\'opération.';
    
    if (error.error && typeof error.error === 'object') {
      // Gérer les erreurs de validation du backend
      if (error.error.credit_note_number && Array.isArray(error.error.credit_note_number)) {
        errorMessage = error.error.credit_note_number.join(', ');
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
