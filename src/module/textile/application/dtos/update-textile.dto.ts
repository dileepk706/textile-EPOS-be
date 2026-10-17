import { z } from 'zod';

export const updateTextileSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  gstin: z.string().optional(),
  currency: z.string().optional(),
  is_active: z.boolean().optional(),
  settings: z
    .object({
      receipt_header: z.string().optional(),
      receipt_footer: z.string().optional(),
      tax_rate: z.number().optional(),
      enable_barcode: z.boolean().optional(),
    })
    .optional(),
});

export type UpdateTextileDto = z.infer<typeof updateTextileSchema>;
