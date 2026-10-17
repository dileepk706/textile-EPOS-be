import { z } from 'zod';

export const updateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  gstin: z.string().optional(),
  is_active: z.boolean().optional(),
  deleted: z.string().optional(),
});

export type UpdateSupplierDto = z.infer<typeof updateSupplierSchema>;
