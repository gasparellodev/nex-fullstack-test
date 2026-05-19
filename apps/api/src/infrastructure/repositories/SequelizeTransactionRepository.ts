import {
  Op,
  Sequelize,
  type IncludeOptions,
  type Transaction as SequelizeTransaction,
  type WhereOptions,
} from 'sequelize';
import { Transaction } from '@/domain/entities/Transaction.js';
import type {
  AdminTransactionFilters,
  CreateTransactionInput,
  ITransactionRepository,
  UnitOfWork,
  UserTransactionFilters,
} from '@/domain/repositories/ITransactionRepository.js';
import { TransactionModel } from '@/infrastructure/db/models/TransactionModel.js';
import { UserModel } from '@/infrastructure/db/models/UserModel.js';

const CHUNK_SIZE = 500;

function txFromUow(uow?: UnitOfWork): SequelizeTransaction | undefined {
  return (uow as { transaction?: SequelizeTransaction } | undefined)?.transaction;
}

/**
 * Sequelize returns DATEONLY columns as 'YYYY-MM-DD' strings; the domain
 * entity contract is a Date. Parse here so use cases never see a string.
 * Exported (not just module-local) so the regression test can exercise
 * the conversion without standing up a real database.
 */
export function transactionModelToEntity(model: TransactionModel): Transaction {
  const rawDate = model.occurredAt as unknown;
  const occurredAt =
    rawDate instanceof Date
      ? rawDate
      : new Date(`${String(rawDate)}T00:00:00.000Z`);

  return new Transaction({
    id: model.id,
    userId: model.userId,
    description: model.description,
    occurredAt,
    points: Number(model.points),
    amountCents: Number(model.amountCents),
    status: model.status,
    importBatchId: model.importBatchId,
    createdAt: model.get('createdAt') as Date,
    updatedAt: model.get('updatedAt') as Date,
  });
}

export class SequelizeTransactionRepository implements ITransactionRepository {
  async bulkInsert(rows: CreateTransactionInput[], uow?: UnitOfWork): Promise<void> {
    const tx = txFromUow(uow);
    const baseOpts = tx ? { transaction: tx } : {};
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE) as unknown as Partial<TransactionModel>[];
      await TransactionModel.bulkCreate(chunk, baseOpts);
    }
  }

  async sumApprovedPointsByUser(userId: string): Promise<number> {
    const result = (await TransactionModel.findOne({
      attributes: [
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('points')), 0), 'total'],
      ],
      where: { userId, status: 'approved' },
      raw: true,
    })) as unknown as { total: string | number } | null;
    return Number(result?.total ?? 0);
  }

  async listForUser(
    userId: string,
    filters: UserTransactionFilters,
  ): Promise<{ data: Transaction[]; total: number }> {
    const where: WhereOptions = { userId };
    if (filters.status) (where as Record<string, unknown>).status = filters.status;
    if (filters.fromDate || filters.toDate) {
      (where as Record<string, unknown>).occurredAt = buildBetween(filters.fromDate, filters.toDate);
    }
    const { rows, count } = await TransactionModel.findAndCountAll({
      where,
      offset: (filters.page - 1) * filters.pageSize,
      limit: filters.pageSize,
      order: [['occurredAt', 'DESC']],
    });
    return { data: rows.map(transactionModelToEntity), total: count };
  }

  async listForAdmin(
    filters: AdminTransactionFilters,
  ): Promise<{ data: (Transaction & { userCpfMasked: string })[]; total: number }> {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.fromDate || filters.toDate) {
      where.occurredAt = buildBetween(filters.fromDate, filters.toDate);
    }
    if (filters.fromAmountCents !== undefined || filters.toAmountCents !== undefined) {
      where.amountCents = buildBetween(filters.fromAmountCents, filters.toAmountCents);
    }
    if (filters.product) {
      where.description = { [Op.like]: `%${filters.product}%` };
    }

    const include: IncludeOptions = filters.cpfHash
      ? { model: UserModel, required: true, where: { cpfHash: filters.cpfHash } }
      : { model: UserModel, required: false };

    const { rows, count } = await TransactionModel.findAndCountAll({
      where,
      include: [include],
      offset: (filters.page - 1) * filters.pageSize,
      limit: filters.pageSize,
      order: [['occurredAt', 'DESC']],
    });

    return {
      data: rows.map((row) =>
        Object.assign(transactionModelToEntity(row), { userCpfMasked: '***.***.***-**' }),
      ),
      total: count,
    };
  }
}

function buildBetween<T>(from?: T, to?: T): Record<symbol, T> {
  const range: Record<symbol, T> = {};
  if (from !== undefined) range[Op.gte] = from;
  if (to !== undefined) range[Op.lte] = to;
  return range;
}
