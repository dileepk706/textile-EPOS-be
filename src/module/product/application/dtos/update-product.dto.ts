import { z } from 'zod';

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  barcode: z.string().optional(),
  deleted: z.string().optional(),
  unit: z.string().optional(),
  sku: z.string().optional(),
  brand: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateProductDto = z.infer<typeof updateProductSchema>;
