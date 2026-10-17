import { z } from 'zod';

export const openTillSchema = z.object({
  opening_balance: z.number().nonnegative('Opening balance must be 0 or positive'),
  password: z.string().optional(),
  device_info: z.string().optional(),
  notes: z.string().optional(),
});

export type OpenTillDto = z.infer<typeof openTillSchema>;
