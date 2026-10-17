export interface ITextileAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface ITextileSettings {
  receipt_header?: string;
  receipt_footer?: string;
  tax_rate?: number;
  enable_barcode?: boolean;
}

export interface ITextile {
  id?: string;
  _id?: any;
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  address?: ITextileAddress;
  gstin?: string;
  currency?: string;
  is_active?: boolean;
  tenant_id?: string | null;
  settings?: ITextileSettings;
  createdAt?: Date;
  updatedAt?: Date;
}
