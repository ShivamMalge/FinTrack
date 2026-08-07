import { z } from 'zod';

export const createTransactionSchema = z.object({
  amount: z.union([z.number(), z.string()]),
  type: z.enum(['INCOME', 'EXPENSE']),
  date: z.string().datetime(),
  categoryId: z.string().uuid(),
  note: z.string().optional()
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const queryTransactionSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  categoryId: z.string().uuid().optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional()
});
