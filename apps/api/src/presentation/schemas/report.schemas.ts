import { z } from 'zod';

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

export const AdminTransactionsQuerySchema = z.object({
  cpf: z.string().optional(),
  product: z.string().trim().min(1).optional(),
  fromDate: dateString.optional(),
  toDate: dateString.optional(),
  fromAmount: z.coerce.number().nonnegative().optional(),
  toAmount: z.coerce.number().nonnegative().optional(),
  status: z.enum(['approved', 'rejected', 'pending']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type AdminTransactionsQuery = z.infer<typeof AdminTransactionsQuerySchema>;
