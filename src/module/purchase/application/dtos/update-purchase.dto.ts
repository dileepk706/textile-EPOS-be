import { z } from 'zod';

export const updatePurchaseInvoiceSchema = z.object({
  supplier_invoice_number: z.string().optional(),
  total_paid: z.number().min(0).optional(),
  payment_method: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'CREDIT']).optional(),
  till_id: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdatePurchaseInvoiceDto = z.infer<typeof updatePurchaseInvoiceSchema>;

