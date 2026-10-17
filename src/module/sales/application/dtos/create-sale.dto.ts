import { z } from 'zod';

export const createSaleItemInputSchema = z.object({
  batch_id: z.string().min(1, 'Batch ID is required'),
  product_id: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be an integer greater than 0'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  tax_rate: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  serial_numbers: z.array(z.string()).optional().default([]),
});

export const createSaleSchema = z.object({
  till_id: z.string().min(1, 'Till ID is required'),
  payment_method: z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CREDIT', 'SPLIT']).default('CASH'),
  total_paid: z.number().min(0).optional(),
  discount: z.number().min(0).optional().default(0),
  tax_amount: z.number().min(0).optional(),
  notes: z.string().optional().default(''),
  items: z.array(createSaleItemInputSchema).min(1, 'At least one sale item is required'),
});

export type CreateSaleItemInputDto = z.infer<typeof createSaleItemInputSchema>;
export type CreateSaleDto = z.infer<typeof createSaleSchema>;
