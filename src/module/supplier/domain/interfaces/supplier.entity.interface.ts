export interface ISupplier {
  id?: string;
  _id?: any;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  deleted: string;
  is_active?: boolean;
  textile_id?: string | null;
  tenant_id?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
