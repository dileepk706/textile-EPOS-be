import { z } from 'zod';

export const updateTillPasswordSchema = z.object({
  current_password: z.string().optional(),
  new_password: z.string().min(4, 'New password or PIN must be at least 4 characters/digits'),
});

export type UpdateTillPasswordDto = z.infer<typeof updateTillPasswordSchema>;
