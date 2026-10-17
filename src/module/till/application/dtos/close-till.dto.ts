import { z } from 'zod';

export const closeTillSchema = z.object({
  closing_balance: z.number().nonnegative('Closing balance must be 0 or positive'),
  notes: z.string().optional(),
});

export type CloseTillDto = z.infer<typeof closeTillSchema>;
