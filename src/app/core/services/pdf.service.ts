import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, CreditNote, MonthlyReport, Supplier } from '../../shared/models/business.model';
import { DateService } from './date.service';

// Extension du type jsPDF pour inclure autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
    lastAutoTable: { finalY: number };
  }
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  
  constructor(private dateService: DateService) {
    // Initialiser le locale français pour les dates
    this.dateService.initFrenchLocale();
  }

  /**
   * Méthode sécurisée pour ajouter du texte au PDF
   */
  private safeText(doc: jsPDF, text: string, x: number, y: number, options?: any): void {
    if (text && text.trim() !== '') {
      doc.text(text, x, y, options);
    }
  }
  
  generateInvoicePDF(invoice: Invoice): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(0, 102, 204);
    doc.text('PHARMACIE - FACTURE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Informations pharmacie
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Pharmacie Centrale', 20, yPosition);
    yPosition += 6;
    doc.text('123 Rue de la Santé', 20, yPosition);
    yPosition += 6;
    doc.text('75001 Paris, France', 20, yPosition);
    yPosition += 6;
    doc.text('Tél: 01 23 45 67 89', 20, yPosition);
    yPosition += 6;
    doc.text('Email: contact@pharmacie.fr', 20, yPosition);
    yPosition += 15;

    // Informations facture
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Numéro de facture: ${invoice.invoiceNumber || 'N/A'}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Date: ${this.dateService.formatDate(invoice.invoiceDate) || 'N/A'}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Date d'échéance: ${this.dateService.formatDate(invoice.dueDate) || 'N/A'}`, 20, yPosition);
    yPosition += 8;

    // Informations fournisseur
    doc.text('Fournisseur:', 20, yPosition);
    yPosition += 6;
    doc.setFontSize(10);
    if (invoice.supplier?.name) {
      doc.text(invoice.supplier.name, 20, yPosition);
      yPosition += 6;
    }
    if (invoice.supplier?.address) {
      doc.text(invoice.supplier.address, 20, yPosition);
      yPosition += 6;
    }
    if (invoice.supplier?.postalCode && invoice.supplier?.city) {
      doc.text(`${invoice.supplier.postalCode} ${invoice.supplier.city}`, 20, yPosition);
      yPosition += 6;
    }
    yPosition += 9;

    // Tableau des montants
    const netToPay = Number(invoice.netToPay) || 0;
    
    const tableData = [
      ['Description', 'Montant'],
      ['Net à payer', `${netToPay.toFixed(2)} DZD`]
    ];

    autoTable(doc, {
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: yPosition,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 102, 204], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 60, halign: 'right' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Statut
    doc.setFontSize(12);
    doc.text(`Statut: ${this.getStatusText(invoice.status)}`, 20, yPosition);
    yPosition += 10;

    if (invoice.notes) {
      doc.text('Notes:', 20, yPosition);
      yPosition += 6;
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(invoice.notes, pageWidth - 40);
      doc.text(lines, 20, yPosition);
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Document généré par Pharmacie Manager', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Page 1 sur 1`, pageWidth / 2, footerY + 5, { align: 'center' });

    // Téléchargement
    doc.save(`facture_${invoice.invoiceNumber}.pdf`);
  }

  generateCreditNotePDF(creditNote: CreditNote): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(220, 53, 69);
    doc.text('PHARMACIE - AVOIR', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Informations pharmacie
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Pharmacie Centrale', 20, yPosition);
    yPosition += 6;
    doc.text('123 Rue de la Santé', 20, yPosition);
    yPosition += 6;
    doc.text('75001 Paris, France', 20, yPosition);
    yPosition += 6;
    doc.text('Tél: 01 23 45 67 89', 20, yPosition);
    yPosition += 6;
    doc.text('Email: contact@pharmacie.fr', 20, yPosition);
    yPosition += 15;

    // Informations avoir
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Numéro d'avoir: ${creditNote.creditNoteNumber || 'N/A'}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Date: ${this.dateService.formatDate(creditNote.creditDate) || 'N/A'}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Facture associée: ${creditNote.invoice?.invoiceNumber || 'N/A'}`, 20, yPosition);
    yPosition += 8;

    // Tableau des informations
    const tableData = [
      ['Description', 'Montant'],
      ['Montant de l\'avoir', `${(creditNote.amount || 0).toFixed(2)} DZD`],
      ['Motif', creditNote.reason || 'N/A'],
      ['Statut', this.getCreditNoteStatusText(creditNote.status) || 'N/A']
    ];

    autoTable(doc, {
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: yPosition,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [220, 53, 69], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 80 }
      }
    });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Document généré par Pharmacie Manager', pageWidth / 2, footerY, { align: 'center' });

    // Téléchargement
    doc.save(`avoir_${creditNote.creditNoteNumber}.pdf`);
  }

  generateMonthlyReportPDF(report: MonthlyReport): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(0, 102, 204);
    doc.text('RAPPORT MENSUEL', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(14);
    doc.text(`${report.month} ${report.year}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 25;

    // Résumé financier
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Résumé financier', 20, yPosition);
    yPosition += 10;

    const summaryData = [
      ['Description', 'Montant'],
      ['Total factures', `${report.totalInvoicesAmount.toFixed(2)} DZD`],
      ['Total avoirs', `${report.totalCreditNotesAmount.toFixed(2)} DZD`],
      ['Net à payer', `${report.netToPay.toFixed(2)} DZD`],
      ['Nombre de factures', report.invoicesCount.toString()],
      ['Nombre d\'avoirs', report.creditNotesCount.toString()]
    ];

    autoTable(doc, {
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: yPosition,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 102, 204], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 60, halign: 'right' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Détails par fournisseur
    if (report.supplierBreakdown && report.supplierBreakdown.length > 0) {
      doc.setFontSize(12);
      doc.text('Détails par fournisseur', 20, yPosition);
      yPosition += 10;

      const supplierData = [
        ['Fournisseur', 'Factures', 'Avoirs', 'Net']
      ];

      report.supplierBreakdown.forEach(supplier => {
        supplierData.push([
          supplier.supplier.name,
          `${supplier.totalAmount.toFixed(2)} DZD`,
          `${supplier.totalCreditAmount.toFixed(2)} DZD`,
          `${supplier.netAmount.toFixed(2)} DZD`
        ]);
      });

      autoTable(doc, {
        head: [supplierData[0]],
        body: supplierData.slice(1),
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 102, 204], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 60, halign: 'right' },
          2: { cellWidth: 60, halign: 'right' },
          3: { cellWidth: 60, halign: 'right' }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Document généré par Pharmacie Manager', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Généré le ${this.dateService.formatDate(new Date())}`, pageWidth / 2, footerY + 5, { align: 'center' });

    // Téléchargement
    doc.save(`rapport_${report.month}_${report.year}.pdf`);
  }

  private getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'DRAFT': 'Brouillon',
      'PENDING': 'En attente',
      'PAID': 'Payée',
      'OVERDUE': 'En retard',
      'CANCELLED': 'Annulée'
    };
    return statusMap[status] || status;
  }

  private getCreditNoteStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'DRAFT': 'Brouillon',
      'PENDING': 'En attente',
      'APPLIED': 'Appliqué',
      'CANCELLED': 'Annulé'
    };
    return statusMap[status] || status;
  }
}
