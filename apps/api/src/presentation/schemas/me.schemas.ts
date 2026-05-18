import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const MeTransactionsQuerySchema = z.object({
  status: z.enum(['approved', 'rejected', 'pending']).optional(),
  fromDate: dateString.optional(),
  toDate: dateString.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
