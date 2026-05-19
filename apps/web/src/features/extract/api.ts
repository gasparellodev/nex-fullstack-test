import type { PaginatedDto, TransactionDto, TransactionStatus, WalletDto } from '@nex/shared';
import { api } from '@/lib/api-client';

export interface UserExtractFilters {
  status?: TransactionStatus | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
  page: number;
  pageSize: number;
}

export async function listMyTransactions(
  filters: UserExtractFilters,
): Promise<PaginatedDto<TransactionDto>> {
  const params: Record<string, string | number> = {
    page: filters.page,
    pageSize: filters.pageSize,
  };
  if (filters.status) params.status = filters.status;
  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  const { data } = await api.get<PaginatedDto<TransactionDto>>('/me/transactions', { params });
  return data;
}

export async function fetchWallet(): Promise<WalletDto> {
  const { data } = await api.get<WalletDto>('/me/wallet');
  return data;
}
