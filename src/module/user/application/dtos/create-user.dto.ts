import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(3, 'Password must be at least 3 characters long'),
  name: z.string().optional(),
  phone: z.string().optional(),
  tenant_id: z.string().optional().nullable(),
  textile_id: z.string().optional().nullable(),
  user_type: z.enum(['owner', 'admin', 'manager', 'cashier', 'staff']).optional(),
  role: z.string().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
