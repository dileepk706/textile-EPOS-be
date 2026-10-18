import { z } from 'zod';

export const cashOutTillSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  password: z.string().min(1, 'Password is required'),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export type CashOutTillDto = z.infer<typeof cashOutTillSchema>;
