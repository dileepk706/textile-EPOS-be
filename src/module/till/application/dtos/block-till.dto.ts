import { z } from 'zod';

export const blockTillSchema = z.object({
  is_blocked: z.boolean().default(true),
  reason: z.string().optional(),
});

export type BlockTillDto = z.infer<typeof blockTillSchema>;
