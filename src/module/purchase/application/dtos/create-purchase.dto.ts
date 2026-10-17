import { z } from 'zod';

export const purchaseItemInputSchema = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  cost_price: z.number().min(0, 'Cost price cannot be negative'),
  selling_price: z.number().min(0, 'Selling price cannot be negative'),
  mrp: z.number().min(0).optional(),
  tax_rate: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  unit: z.string().optional().default('pcs'),
  serial_numbers: z.array(z.string()).optional().default([]),
  serial_number_indexes: z.array(z.string()).optional().default([]),
});

export const createPurchaseSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier ID is required'),
  supplier_invoice_number: z.string().optional().default(''),
  till_id: z.string().optional().nullable(),
  purchase_date: z.string().datetime().optional().or(z.string().optional()),
  payment_method: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'CREDIT']).optional().default('CASH'),
  total_paid: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  tax_amount: z.number().min(0).optional().default(0),
  notes: z.string().optional().default(''),
  batch_number: z.string().optional(),
  items: z.array(purchaseItemInputSchema).min(1, 'At least one purchase product item is required'),
});

export type PurchaseItemInputDto = z.infer<typeof purchaseItemInputSchema>;
export type CreatePurchaseDto = z.infer<typeof createPurchaseSchema>;
