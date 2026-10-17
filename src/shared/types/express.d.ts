export type DecodedToken = {
  user_id?: string | null;
  staff_id?: string | null;
  email?: string | null;
  textilesId?: string | null;
  textiles_id?: string | null;
  textile_id?: string | null;
  gym_id?: string | null;
  tenant_id?: string | null;
  role?: 'owner' | 'admin' | 'staff' | 'manager' | 'cashier' | string | null;
  user_type?: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user: DecodedToken;
      validatedQuery?: any;
    }
  }
}
