import { z } from 'zod';

export const createTillSchema = z.object({
  name: z.string().min(1, 'Till name is required'),
  code: z.string().optional(),
  password: z.string().min(4, 'Password or PIN must be at least 4 characters/digits'),
  cash_in_till: z.number().nonnegative().optional().default(0),
  opening_balance: z.number().nonnegative().optional().default(0),
  device_info: z.string().optional(),
  notes: z.string().optional(),
  textile_id: z.string().optional().nullable(),
});

export type CreateTillDto = z.infer<typeof createTillSchema>;
