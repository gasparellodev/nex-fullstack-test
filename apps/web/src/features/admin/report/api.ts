import type { PaginatedDto, TransactionStatus } from '@nex/shared';
import { api } from '@/lib/api-client';

export interface AdminReportFilters {
  cpf?: string | undefined;
  product?: string | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
  fromAmount?: number | undefined;
  toAmount?: number | undefined;
  status?: TransactionStatus | undefined;
  page: number;
  pageSize: number;
}

export interface AdminTransactionRow {
  id: string;
  description: string;
  occurredAt: string;
  points: number;
  amountCents: number;
  status: TransactionStatus;
  userCpfMasked: string;
}

export async function listAdminTransactions(
  filters: AdminReportFilters,
): Promise<PaginatedDto<AdminTransactionRow>> {
  const params: Record<string, string | number> = {
    page: filters.page,
    pageSize: filters.pageSize,
  };
  if (filters.cpf) params.cpf = filters.cpf;
  if (filters.product) params.product = filters.product;
  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  if (filters.fromAmount !== undefined) params.fromAmount = filters.fromAmount;
  if (filters.toAmount !== undefined) params.toAmount = filters.toAmount;
  if (filters.status) params.status = filters.status;

  const { data } = await api.get<PaginatedDto<AdminTransactionRow>>('/admin/transactions', {
    params,
  });
  return data;
}
