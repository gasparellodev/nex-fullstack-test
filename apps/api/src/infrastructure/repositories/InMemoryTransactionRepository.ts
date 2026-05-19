import { Transaction } from '@/domain/entities/Transaction.js';
import type {
  AdminTransactionFilters,
  CreateTransactionInput,
  ITransactionRepository,
  UserTransactionFilters,
} from '@/domain/repositories/ITransactionRepository.js';

export class InMemoryTransactionRepository implements ITransactionRepository {
  private readonly items: Transaction[] = [];

  async bulkInsert(rows: CreateTransactionInput[]): Promise<void> {
    const now = new Date();
    for (const row of rows) {
      this.items.push(new Transaction({ ...row, createdAt: now, updatedAt: now }));
    }
  }

  async sumApprovedPointsByUser(userId: string): Promise<number> {
    return this.items
      .filter((t) => t.userId === userId && t.status === 'approved')
      .reduce((s, t) => s + t.points, 0);
  }

  async listForUser(
    userId: string,
    filters: UserTransactionFilters,
  ): Promise<{ data: Transaction[]; total: number }> {
    const filtered = this.items.filter((t) => {
      if (t.userId !== userId) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (filters.fromDate && t.occurredAt < filters.fromDate) return false;
      if (filters.toDate && t.occurredAt > filters.toDate) return false;
      return true;
    });
    return paginate(filtered, filters.page, filters.pageSize);
  }

  async listForAdmin(
    filters: AdminTransactionFilters,
  ): Promise<{ data: (Transaction & { userCpfMasked: string })[]; total: number }> {
    const filtered = this.items.filter((t) => {
      if (filters.status && t.status !== filters.status) return false;
      if (filters.fromDate && t.occurredAt < filters.fromDate) return false;
      if (filters.toDate && t.occurredAt > filters.toDate) return false;
      if (filters.fromAmountCents !== undefined && t.amountCents < filters.fromAmountCents)
        return false;
      if (filters.toAmountCents !== undefined && t.amountCents > filters.toAmountCents)
        return false;
      if (
        filters.product &&
        !t.description.toLowerCase().includes(filters.product.toLowerCase())
      )
        return false;
      return true;
    });
    const page = paginate(filtered, filters.page, filters.pageSize);
    return {
      data: page.data.map((t) => Object.assign(t, { userCpfMasked: '***.***.***-**' })),
      total: page.total,
    };
  }

  size(): number {
    return this.items.length;
  }
}

function paginate<T>(items: T[], page: number, pageSize: number): { data: T[]; total: number } {
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total: items.length };
}
