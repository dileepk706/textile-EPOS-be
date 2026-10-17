import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact_person: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional().default(''),
  gstin: z.string().optional().default(''),
  textile_id: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  deleted: z.string().optional().default('false'),
});

export type CreateSupplierDto = z.infer<typeof createSupplierSchema>;
