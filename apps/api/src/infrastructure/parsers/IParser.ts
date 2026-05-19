import type { TransactionStatus } from '@nex/shared';

export interface RawRow {
  rowIndex: number;
  cpf: string;
  description: string;
  occurredAt: string;
  points: string;
  amount: string;
  status: string;
}

export interface ParsedRow {
  rowIndex: number;
  cpfDigits: string;
  description: string;
  occurredAt: Date;
  points: number;
  amountCents: number;
  status: TransactionStatus;
}

export interface ParseSkip {
  rowIndex: number;
  cpfMasked: string;
  reason: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  skipped: ParseSkip[];
  totalRows: number;
}

export interface IParser {
  /** Parse the raw bytes of an uploaded file into rows. */
  parse(buffer: Buffer): ParseResult;
}
