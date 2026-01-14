export interface Supplier {
  id: number;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  siret: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  supplier: Supplier;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  vatAmount: number;
  netToPay: number;
  status: InvoiceStatus;
  isPaid: boolean;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export interface CreditNote {
  id: number;
  creditNoteNumber: string;
  invoice: Invoice;
  amount: number;
  reason: string;
  creditDate: string;
  status: CreditNoteStatus;
  createdAt: string;
  updatedAt: string;
}

export enum CreditNoteStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPLIED = 'APPLIED',
  CANCELLED = 'CANCELLED'
}

export interface InvoiceItem {
  id: number;
  invoice: Invoice;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface MonthlyReport {
  month: string;
  year: number;
  totalInvoices: number;
  totalCreditNotes: number;
  totalInvoicesAmount: number;
  totalCreditNotesAmount: number;
  netToPay: number;
  invoicesCount: number;
  creditNotesCount: number;
  supplierBreakdown: SupplierReport[];
}

export interface SupplierReport {
  supplier: Supplier;
  invoiceCount: number;
  totalAmount: number;
  creditNoteCount: number;
  totalCreditAmount: number;
  netAmount: number;
}

export interface DashboardKPI {
  period: {
    current_month: number;
    current_year: number;
    month_name: string;
  };
  overview: {
    total_suppliers: number;
    current_month: {
      total_invoices: number;
      total_credit_notes: number;
      net_amount: number;
      invoice_count: number;
      credit_note_count: number;
    };
    year_to_date: {
      total_invoices: number;
      total_credit_notes: number;
      net_amount: number;
      invoice_count: number;
      credit_note_count: number;
    };
  };
  top_suppliers: Array<{
    supplier_name: string;
    supplier_code: string;
    total_amount: number;
  }>;
  recent_invoices: Array<{
    id: string;
    invoice_number: string;
    supplier_name: string;
    net_to_pay: number;
    month: number;
    year: number;
    created_at: string;
  }>;
  status: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}
