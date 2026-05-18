import { z } from 'zod';

export const AdminImportResultSchema = z.object({
  batchId: z.string().uuid(),
  filename: z.string(),
  totalRows: z.number().int().nonnegative(),
  importedRows: z.number().int().nonnegative(),
  skippedRows: z.array(
    z.object({
      row: z.number().int().positive(),
      cpfMasked: z.string(),
      reason: z.string(),
    }),
  ),
});
