export type TillStatus = 'open' | 'closed' | 'blocked';

export interface ITill {
  id?: string;
  _id?: any;
  name: string;
  code: string;
  password: string;
  status: TillStatus;
  is_blocked: boolean;
  cash_in_till: number;
  opening_balance: number;
  closing_balance?: number | null;
  discrepancy?: number | null;
  textile_id?: string | null;
  tenant_id?: string | null;
  is_linked: boolean;
  device_info?: string | null;
  assigned_user_id?: string | null;
  last_opened_at?: Date | null;
  last_closed_at?: Date | null;
  last_opened_by?: string | null;
  last_closed_by?: string | null;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
