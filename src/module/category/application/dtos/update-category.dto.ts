import { z } from 'zod';

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  code: z.string().optional(),
  is_active: z.boolean().optional(),
  deleted: z.string().optional(),
});

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
