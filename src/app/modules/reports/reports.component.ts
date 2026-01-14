import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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

import { MonthlyReport, SupplierReport } from '../../shared/models/business.model';
import { ApiService } from '../../core/services/api.service';
import { ApiResponse } from '../../shared/models/api.model';
import { PdfService } from '../../core/services/pdf.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    RouterModule
  ],
  template: `
    <div class="p-6">
      <div class="page-header">
        <h1 class="text-3xl font-bold mb-2">Rapports financiers</h1>
        <p class="text-blue-100">Génération de rapports et analyses</p>
      </div>

      <mat-card class="mb-6">
        <div class="p-6">
          <h2 class="text-xl font-semibold mb-6">Générer un rapport</h2>
          
          <form [formGroup]="reportForm" (ngSubmit)="generateReport()" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <mat-form-field appearance="outline">
                <mat-label>Mois</mat-label>
                <mat-select formControlName="month">
                  <mat-option value="01">Janvier</mat-option>
                  <mat-option value="02">Février</mat-option>
                  <mat-option value="03">Mars</mat-option>
                  <mat-option value="04">Avril</mat-option>
                  <mat-option value="05">Mai</mat-option>
                  <mat-option value="06">Juin</mat-option>
                  <mat-option value="07">Juillet</mat-option>
                  <mat-option value="08">Août</mat-option>
                  <mat-option value="09">Septembre</mat-option>
                  <mat-option value="10">Octobre</mat-option>
                  <mat-option value="11">Novembre</mat-option>
                  <mat-option value="12">Décembre</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Année</mat-label>
                <mat-select formControlName="year">
                  <mat-option *ngFor="let year of years" [value]="year">
                    {{ year }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="flex justify-center">
              <button mat-raised-button 
                      color="primary" 
                      type="submit"
                      [disabled]="reportForm.invalid || isLoading">
                <span *ngIf="!isLoading">Générer le rapport</span>
                <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
              </button>
            </div>
          </form>
        </div>
      </mat-card>

      <!-- Rapport généré -->
      <mat-card class="mb-6" *ngIf="currentReport">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold">
              Rapport {{ currentReport.month }} {{ currentReport.year }}
            </h2>
            <div class="space-x-4">
              <button mat-raised-button 
                      color="primary" 
                      (click)="generatePDF(currentReport)">
                <mat-icon>picture_as_pdf</mat-icon>
                Exporter en PDF
              </button>
              <button mat-stroked-button 
                      (click)="printReport(currentReport)">
                <mat-icon>print</mat-icon>
                Imprimer
              </button>
            </div>
          </div>

          <!-- Résumé -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <mat-form-field appearance="outline">
              <mat-label>Total factures</mat-label>
              <input matInput [value]="currentReport.totalInvoicesAmount" readonly>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Total avoirs</mat-label>
              <input matInput [value]="currentReport.totalCreditNotesAmount" readonly>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Net à payer</mat-label>
              <input matInput [value]="currentReport.netToPay" readonly>
            </mat-form-field>
          </div>

          <!-- Détails par fournisseur -->
          <div class="border rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-4">Détails par fournisseur</h3>
            <div class="table-container">
              <table class="min-w-full">
                <thead>
                  <tr class="border-b">
                    <th class="text-left p-2">Fournisseur</th>
                    <th class="text-right p-2">Nb factures</th>
                    <th class="text-right p-2">Total factures</th>
                    <th class="text-right p-2">Nb avoirs</th>
                    <th class="text-right p-2">Total avoirs</th>
                    <th class="text-right p-2">Net à payer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let supplier of currentReport.supplierBreakdown" class="border-b">
                    <td class="p-2">{{ supplier.supplier.name }}</td>
                    <td class="text-right p-2">{{ supplier.invoiceCount }}</td>
                    <td class="text-right p-2">{{ formatCurrency(supplier.totalAmount) }}</td>
                    <td class="text-right p-2">{{ supplier.creditNoteCount }}</td>
                    <td class="text-right p-2">{{ formatCurrency(supplier.totalCreditAmount) }}</td>
                    <td class="text-right p-2 font-semibold">
                      {{ formatCurrency(supplier.netAmount) }}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="border-t-2 font-bold">
                    <td class="p-2">Total</td>
                    <td class="text-right p-2">{{ currentReport.invoicesCount }}</td>
                    <td class="text-right p-2">{{ formatCurrency(currentReport.totalInvoicesAmount) }}</td>
                    <td class="text-right p-2">{{ currentReport.creditNotesCount }}</td>
                    <td class="text-right p-2">{{ formatCurrency(currentReport.totalCreditNotesAmount) }}</td>
                    <td class="text-right p-2">{{ formatCurrency(currentReport.netToPay) }}</td>
                  </tr>
                </tfoot>
              </table>
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
    
    button[mat-raised-button] {
      min-height: 44px;
    }
    
    .table-container {
      overflow-x: auto;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
    }
    
    th, td {
      border: 1px solid #e5e7eb;
      padding: 8px;
    }
    
    .border-b {
      border-bottom: 2px solid #d1d5db;
    }
    
    .border-t {
      border-top: 2px solid #d1d5db;
    }
  `]
})
export class ReportsComponent implements OnInit {
  reportForm: FormGroup;
  currentReport: MonthlyReport | null = null;
  isLoading = false;
  years: number[] = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private pdfService: PdfService
  ) {
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    this.reportForm = this.fb.group({
      month: [(new Date().getMonth() + 1).toString().padStart(2, '0'), Validators.required],
      year: [currentYear.toString(), Validators.required]
    });

    console.log('🏗️ ReportsComponent initialized');
    console.log('🗓️ Default form values:', this.reportForm.value);
  }

  ngOnInit(): void {
    // Charger le rapport du mois en cours par défaut
    this.generateReport();
  }

  generateReport(): void {
    console.log('🧾 generateReport() called');
    console.log('🧾 reportForm status:', this.reportForm.status);
    console.log('🧾 reportForm value:', this.reportForm.value);

    if (this.reportForm.invalid) {
      console.log('⚠️ reportForm invalid, aborting');
      return;
    }

    this.isLoading = true;
    const { month, year } = this.reportForm.value;

    console.log('🔄 Requesting monthly report with:', { month, year });

    this.apiService.get<MonthlyReport>(`/api/reports/monthly/?month=${month}&year=${year}`).subscribe({
      next: (response: any) => {
        console.log('✅ Monthly report API response received:', response);
        console.log('📊 Response type:', typeof response);
        console.log('🔍 Response keys:', response && typeof response === 'object' ? Object.keys(response) : null);

        const reportRaw = response && typeof response === 'object' && 'data' in response ? response.data : response;
        console.log('📦 Using report payload:', reportRaw);

        // Map snake_case payloads to our MonthlyReport interface if needed
        const monthFallback = this.reportForm.value?.month;
        const yearFallback = this.reportForm.value?.year;

        const mappedSupplierBreakdown: SupplierReport[] = (reportRaw?.supplierBreakdown ?? reportRaw?.supplier_breakdown ?? []).map((r: any) => ({
            supplier: r?.supplier ?? {
              id: r?.supplier_id ?? r?.supplier?.id,
              name: r?.supplier_name ?? r?.supplier?.name,
              address: r?.supplier_address ?? r?.supplier?.address,
              postalCode: r?.supplier_postal_code ?? r?.supplier?.postalCode,
              city: r?.supplier_city ?? r?.supplier?.city,
              phone: r?.supplier_phone ?? r?.supplier?.phone,
              email: r?.supplier_email ?? r?.supplier?.email,
              siret: r?.supplier_siret ?? r?.supplier?.siret,
              isActive: r?.supplier_is_active ?? r?.supplier?.isActive ?? true,
              createdAt: r?.supplier_created_at ?? r?.supplier?.createdAt ?? '',
              updatedAt: r?.supplier_updated_at ?? r?.supplier?.updatedAt ?? ''
            },
            invoiceCount: Number(r?.invoiceCount ?? r?.invoice_count ?? 0),
            totalAmount: Number(r?.totalAmount ?? r?.total_amount ?? 0),
            creditNoteCount: Number(r?.creditNoteCount ?? r?.credit_note_count ?? 0),
            totalCreditAmount: Number(r?.totalCreditAmount ?? r?.total_credit_amount ?? 0),
            netAmount: Number(r?.netAmount ?? r?.net_amount ?? 0)
          }));

        const monthMapped = String(reportRaw?.month ?? reportRaw?.mois ?? reportRaw?.report_month ?? monthFallback ?? '');
        const yearMappedRaw = reportRaw?.year ?? reportRaw?.annee ?? reportRaw?.report_year ?? yearFallback;
        const yearMapped = Number(yearMappedRaw);

        const invoicesCountRaw = Number(reportRaw?.invoicesCount ?? reportRaw?.invoices_count ?? 0);
        const creditNotesCountRaw = Number(reportRaw?.creditNotesCount ?? reportRaw?.credit_notes_count ?? 0);
        const totalInvoicesAmountRaw = Number(reportRaw?.totalInvoicesAmount ?? reportRaw?.total_invoices_amount ?? 0);
        const totalCreditNotesAmountRaw = Number(reportRaw?.totalCreditNotesAmount ?? reportRaw?.total_credit_notes_amount ?? 0);
        const netToPayRaw = Number(reportRaw?.netToPay ?? reportRaw?.net_to_pay ?? 0);

        const invoicesCountFallback = mappedSupplierBreakdown.reduce((s, r) => s + (Number(r.invoiceCount) || 0), 0);
        const creditNotesCountFallback = mappedSupplierBreakdown.reduce((s, r) => s + (Number(r.creditNoteCount) || 0), 0);
        const totalInvoicesAmountFallback = mappedSupplierBreakdown.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
        const totalCreditNotesAmountFallback = mappedSupplierBreakdown.reduce((s, r) => s + (Number(r.totalCreditAmount) || 0), 0);
        const netToPayFallback = mappedSupplierBreakdown.reduce((s, r) => s + (Number(r.netAmount) || 0), 0);

        const mappedReport: MonthlyReport = {
          month: monthMapped,
          year: Number.isFinite(yearMapped) ? yearMapped : Number(yearFallback),
          totalInvoices: Number(reportRaw?.totalInvoices ?? reportRaw?.total_invoices ?? 0),
          totalCreditNotes: Number(reportRaw?.totalCreditNotes ?? reportRaw?.total_credit_notes ?? 0),
          totalInvoicesAmount: totalInvoicesAmountRaw || totalInvoicesAmountFallback,
          totalCreditNotesAmount: totalCreditNotesAmountRaw || totalCreditNotesAmountFallback,
          netToPay: netToPayRaw || netToPayFallback,
          invoicesCount: invoicesCountRaw || invoicesCountFallback,
          creditNotesCount: creditNotesCountRaw || creditNotesCountFallback,
          supplierBreakdown: mappedSupplierBreakdown
        };

        console.log('🧩 Mapped report:', mappedReport);
        this.currentReport = mappedReport;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Error generating report:', error);
        console.error('🔍 Error details:', {
          status: error?.status,
          statusText: error?.statusText,
          url: error?.url,
          message: error?.message
        });
        this.isLoading = false;
      }
    });
  }

  generatePDF(report: MonthlyReport): void {
    this.pdfService.generateMonthlyReportPDF(report);
  }

  printReport(report: MonthlyReport): void {
    window.print();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}
