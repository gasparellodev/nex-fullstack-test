import type { NextFunction, Request, Response } from 'express';
import type { ListAdminTransactions } from '@/application/transactions/ListAdminTransactions.js';
import { UnauthorizedError } from '@/shared/errors.js';
import { AdminTransactionsQuerySchema } from '@/presentation/schemas/report.schemas.js';

function toDate(value: string | undefined): Date | undefined {
  return value ? new Date(`${value}T00:00:00.000Z`) : undefined;
}

function toCents(value: number | undefined): number | undefined {
  return value === undefined ? undefined : Math.round(value * 100);
}

export class AdminTransactionsController {
  constructor(private readonly listAdminTransactions: ListAdminTransactions) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError('authentication required');
      const query = AdminTransactionsQuerySchema.parse(req.query);
      const result = await this.listAdminTransactions.execute({
        adminId: req.auth.sub,
        cpf: query.cpf,
        product: query.product,
        fromDate: toDate(query.fromDate),
        toDate: toDate(query.toDate),
        fromAmountCents: toCents(query.fromAmount),
        toAmountCents: toCents(query.toAmount),
        status: query.status,
        page: query.page,
        pageSize: query.pageSize,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
