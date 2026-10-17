export interface ICategory {
  id?: string;
  _id?: any;
  name: string;
  description?: string;
  code?: string;
  textile_id?: string | null;
  tenant_id?: string | null;
  is_active?: boolean;
  deleted?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
