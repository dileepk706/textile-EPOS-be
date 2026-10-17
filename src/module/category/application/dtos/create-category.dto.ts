import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  code: z.string().optional(),
  textile_id: z.string().optional().nullable(),
  tenant_id: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
