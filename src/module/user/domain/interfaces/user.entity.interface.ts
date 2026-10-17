export interface IUser {
  id?: string;
  _id?: any;
  email: string;
  password?: string;
  name?: string;
  phone?: string;
  role?: string;
  user_type?: string;
  tenant_id?: string | null;
  textile_id?: string | null;
  textiles_id?: string | null;
  is_active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
