export type SalesPaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';
export type SalesPaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CREDIT' | 'SPLIT';

export interface ISalesInvoice {
  id?: string;
  _id?: any;
  invoice_number: string;
  till_id: string;
  staff_id: string;
  staff_name?: string;
  total_amount: number;      // gross sum of items
  discount: number;          // overall invoice discount
  tax_amount: number;        // total tax applied
  net_amount: number;        // total_amount + tax_amount - discount
  total_paid: number;        // amount customer paid
  balance_amount: number;    // net_amount - total_paid
  payment_status: SalesPaymentStatus;
  payment_method: SalesPaymentMethod;
  items_count: number;
  total_quantity: number;
  sale_date: Date;
  notes?: string;
  deleted: string;
  textile_id?: string | null;
  tenant_id?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
