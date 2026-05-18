import type { NextFunction, Request, Response } from 'express';
import type { GetWalletBalance } from '@/application/transactions/GetWalletBalance.js';
import type { ListUserTransactions } from '@/application/transactions/ListUserTransactions.js';
import type { IUserRepository } from '@/domain/repositories/IUserRepository.js';
import { NotFoundError, UnauthorizedError } from '@/shared/errors.js';
import { MeTransactionsQuerySchema } from '@/presentation/schemas/me.schemas.js';

function toDate(value: string | undefined): Date | undefined {
  return value ? new Date(`${value}T00:00:00.000Z`) : undefined;
}

export class MeController {
  constructor(
    private readonly users: IUserRepository,
    private readonly listUserTransactions: ListUserTransactions,
    private readonly getWalletBalance: GetWalletBalance,
  ) {}

  show = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError('authentication required');
      const user = await this.users.findById(req.auth.sub);
      if (!user) throw new NotFoundError('user not found');
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        consentAt: user.consentAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };

  transactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError('authentication required');
      const query = MeTransactionsQuerySchema.parse(req.query);
      const result = await this.listUserTransactions.execute({
        userId: req.auth.sub,
        status: query.status,
        fromDate: toDate(query.fromDate),
        toDate: toDate(query.toDate),
        page: query.page,
        pageSize: query.pageSize,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  wallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError('authentication required');
      const result = await this.getWalletBalance.execute(req.auth.sub);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
