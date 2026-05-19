import type {
  ITransactionRepository,
  UserTransactionFilters,
} from '@/domain/repositories/ITransactionRepository.js';
import { ValidationError } from '@/shared/errors.js';
import type { PaginatedDto, TransactionDto } from '@nex/shared';

const MAX_PAGE_SIZE = 100;

export interface ListUserTransactionsInput extends UserTransactionFilters {
  userId: string;
}

export class ListUserTransactions {
  constructor(private readonly transactions: ITransactionRepository) {}

  async execute(input: ListUserTransactionsInput): Promise<PaginatedDto<TransactionDto>> {
    if (input.page < 1) throw new ValidationError('page must be ≥ 1', { field: 'page' });
    if (input.pageSize < 1 || input.pageSize > MAX_PAGE_SIZE) {
      throw new ValidationError(`pageSize must be in [1..${MAX_PAGE_SIZE}]`, {
        field: 'pageSize',
      });
    }

    const { data, total } = await this.transactions.listForUser(input.userId, {
      status: input.status,
      fromDate: input.fromDate,
      toDate: input.toDate,
      page: input.page,
      pageSize: input.pageSize,
    });

    return {
      data: data.map((t) => ({
        id: t.id,
        description: t.description,
        occurredAt: t.occurredAt.toISOString().slice(0, 10),
        points: t.points,
        amountCents: t.amountCents,
        status: t.status,
      })),
      page: input.page,
      pageSize: input.pageSize,
      total,
    };
  }
}
