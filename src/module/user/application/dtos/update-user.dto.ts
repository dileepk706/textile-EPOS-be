import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(3, 'Password must be at least 6 characters long').optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']),
  user_type: z.enum(['owner', 'admin', 'manager', 'cashier', 'staff']).optional(),
  is_active: z.boolean().optional(),
  tenant_id: z.string().optional().nullable(),
  textile_id: z.string().optional().nullable(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
