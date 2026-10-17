export interface ISaleItem {
  id?: string;
  _id?: any;
  invoice_id: string;
  invoice_number: string;
  batch_id: string;
  batch_number: string;
  product_id: string;
  product_name: string;
  barcode: string;
  till_id: string;
  staff_id: string;
  staff_name?: string;
  quantity: number;
  unit?: string;
  unit_price: number;        // selling price per unit
  cost_price: number;        // batch cost price for profit margin analytics
  mrp?: number;
  tax_rate?: number;
  tax_amount?: number;
  discount?: number;
  subtotal: number;          // quantity * unit_price
  total_amount: number;      // subtotal + tax_amount - discount
  total_paid: number;
  serial_numbers_sold?: string[];
  notes?: string;
  deleted: string;
  textile_id?: string | null;
  tenant_id?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
