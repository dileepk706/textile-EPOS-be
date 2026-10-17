import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional().default(''),
  barcode: z.string().optional(),
  deleted: z.string().optional().default('false'),
  unit: z.string().optional().default('pcs'),
  sku: z.string().optional(),
  brand: z.string().optional(),
  textile_id: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
