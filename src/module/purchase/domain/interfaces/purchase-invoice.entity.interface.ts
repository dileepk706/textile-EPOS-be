export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'UPI' | 'CREDIT';

export interface IPurchaseInvoice {
  id?: string;
  _id?: any;
  invoice_number: string;
  supplier_invoice_number?: string;
  supplier_id: string;
  supplier_name: string;
  staff_id: string;
  staff_name?: string;
  till_id?: string | null;
  batch_id?: string | null;
  batch_number?: string;
  total_amount: number;
  discount: number;
  tax_amount: number;
  net_amount: number;
  total_paid: number;
  balance_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  items_count: number;
  total_quantity: number;
  purchase_date: Date;
  notes?: string;
  deleted: string;
  textile_id?: string | null;
  tenant_id?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
