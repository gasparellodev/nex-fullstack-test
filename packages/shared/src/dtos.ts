import type { TransactionStatus, UserRole } from './enums.js';

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponseDto {
  user: AuthUserDto;
  token: string;
  expiresIn: string;
}

export interface TransactionDto {
  id: string;
  description: string;
  occurredAt: string;
  points: number;
  amountCents: number;
  status: TransactionStatus;
}

export interface WalletDto {
  balancePoints: number;
}

export interface ImportSkippedRow {
  row: number;
  cpfMasked: string;
  reason: string;
}

export interface ImportResultDto {
  batchId: string;
  filename: string;
  totalRows: number;
  importedRows: number;
  skippedRows: ImportSkippedRow[];
}

export interface PaginatedDto<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}
