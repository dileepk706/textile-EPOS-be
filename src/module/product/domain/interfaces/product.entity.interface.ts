export interface IProduct {
  id?: string;
  _id?: any;
  name: string;
  description: string;
  barcode: string;
  deleted: string;
  unit?: string;
  sku?: string;
  brand?: string;
  textile_id?: string | null;
  tenant_id?: string | null;
  is_active?: boolean;
  quantity_available?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

