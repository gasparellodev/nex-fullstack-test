import { randomUUID } from 'node:crypto';
import type { ICpfIndex } from '@/domain/ports/ICpfIndex.js';
import type { IAuditLogRepository } from '@/domain/repositories/IAuditLogRepository.js';
import type {
  AdminTransactionFilters,
  ITransactionRepository,
} from '@/domain/repositories/ITransactionRepository.js';
import { isValidCpf, normalizeCpf } from '@/shared/cpf.js';
import { ValidationError } from '@/shared/errors.js';
import type { PaginatedDto, TransactionDto } from '@nex/shared';

export interface ListAdminTransactionsInput {
  adminId: string;
  cpf?: string | undefined;
  product?: string | undefined;
  fromDate?: Date | undefined;
  toDate?: Date | undefined;
  fromAmountCents?: number | undefined;
  toAmountCents?: number | undefined;
  status?: AdminTransactionFilters['status'];
  page: number;
  pageSize: number;
}

export interface AdminTransactionRowDto extends TransactionDto {
  userCpfMasked: string;
}

export interface ListAdminTransactionsDeps {
  transactions: ITransactionRepository;
  auditLogs: IAuditLogRepository;
  cpfIndex: ICpfIndex;
}

const MAX_PAGE_SIZE = 100;

export class ListAdminTransactions {
  constructor(private readonly deps: ListAdminTransactionsDeps) {}

  async execute(
    input: ListAdminTransactionsInput,
  ): Promise<PaginatedDto<AdminTransactionRowDto>> {
    if (input.page < 1) throw new ValidationError('page must be ≥ 1', { field: 'page' });
    if (input.pageSize < 1 || input.pageSize > MAX_PAGE_SIZE) {
      throw new ValidationError(`pageSize must be in [1..${MAX_PAGE_SIZE}]`, {
        field: 'pageSize',
      });
    }

    let cpfHash: string | undefined;
    if (input.cpf) {
      const digits = normalizeCpf(input.cpf);
      if (!isValidCpf(digits)) {
        throw new ValidationError('invalid CPF filter', { field: 'cpf' });
      }
      cpfHash = this.deps.cpfIndex.compute(digits);
    }

    const filters: AdminTransactionFilters = {
      cpfHash,
      product: input.product,
      fromDate: input.fromDate,
      toDate: input.toDate,
      fromAmountCents: input.fromAmountCents,
      toAmountCents: input.toAmountCents,
      status: input.status,
      page: input.page,
      pageSize: input.pageSize,
    };

    const { data, total } = await this.deps.transactions.listForAdmin(filters);

    await this.deps.auditLogs.log({
      id: randomUUID(),
      actorId: input.adminId,
      action: 'report.view',
      metadata: {
        filters: {
          ...filters,
          cpfHash: cpfHash ? '[present]' : undefined,
        },
        total,
      },
    });

    return {
      data: data.map((t) => ({
        id: t.id,
        description: t.description,
        occurredAt: t.occurredAt.toISOString().slice(0, 10),
        points: t.points,
        amountCents: t.amountCents,
        status: t.status,
        userCpfMasked: t.userCpfMasked,
      })),
      page: input.page,
      pageSize: input.pageSize,
      total,
    };
  }
}
