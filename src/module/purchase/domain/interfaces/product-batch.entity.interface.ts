export type BatchStatus = 'ACTIVE' | 'DEPLETED' | 'CANCELLED';

export interface IProductBatch {
  id?: string;
  _id?: any;
  batch_number: string;
  product_id: string;
  product_name: string;
  barcode: string;
  description?: string;
  unit: string;
  quantity: number;
  quantity_sold: number;
  quantity_returned: number;
  quantity_available: number;
  cost_price: number;
  selling_price: number;
  mrp?: number;
  serial_number_indexes: string[];
  serial_numbers_purchased: string[];
  serial_numbers_sold: string[];
  serial_numbers_available: string[];
  supplier_id: string;
  supplier_name: string;
  invoice_id: string;
  invoice_number: string;
  till_id?: string | null;
  staff_id: string;
  staff_name?: string;
  received_date: Date;
  status: BatchStatus;
  notes?: string;
  deleted: string;
  textile_id?: string | null;
  tenant_id?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
