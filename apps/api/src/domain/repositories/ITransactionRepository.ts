import type { TransactionStatus } from '@nex/shared';
import type { Transaction } from '@/domain/entities/Transaction.js';

export interface CreateTransactionInput {
  id: string;
  userId: string;
  description: string;
  occurredAt: Date;
  points: number;
  amountCents: number;
  status: TransactionStatus;
  importBatchId: string;
}

/** Opaque token threaded through repositories to scope them to a single
 * database transaction. Concrete implementations decide what to store inside
 * (Sequelize stores its `Transaction` instance under `transaction`). */
export type UnitOfWork = Record<string, unknown>;

export interface UserTransactionFilters {
  status?: TransactionStatus | undefined;
  fromDate?: Date | undefined;
  toDate?: Date | undefined;
  page: number;
  pageSize: number;
}

export interface AdminTransactionFilters {
  cpfHash?: string | undefined;
  product?: string | undefined;
  fromDate?: Date | undefined;
  toDate?: Date | undefined;
  fromAmountCents?: number | undefined;
  toAmountCents?: number | undefined;
  status?: TransactionStatus | undefined;
  page: number;
  pageSize: number;
}

export interface ITransactionRepository {
  bulkInsert(rows: CreateTransactionInput[], uow?: UnitOfWork): Promise<void>;
  sumApprovedPointsByUser(userId: string): Promise<number>;
  listForUser(
    userId: string,
    filters: UserTransactionFilters,
  ): Promise<{ data: Transaction[]; total: number }>;
  listForAdmin(
    filters: AdminTransactionFilters,
  ): Promise<{ data: (Transaction & { userCpfMasked: string })[]; total: number }>;
}
