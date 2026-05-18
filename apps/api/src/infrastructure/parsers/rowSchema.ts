import type { TransactionStatus } from '@nex/shared';
import { isValidCpf, maskCpf, normalizeCpf } from '@/shared/cpf.js';
import type { ParseSkip, ParsedRow, RawRow } from './IParser.js';

const STATUS_MAP: Record<string, TransactionStatus> = {
  aprovado: 'approved',
  approved: 'approved',
  reprovado: 'rejected',
  rejected: 'rejected',
  'em avaliacao': 'pending',
  'em avaliação': 'pending',
  pending: 'pending',
};

function stripDiacritics(input: string): string {
  return input.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function normaliseStatus(input: string): TransactionStatus | null {
  const key = stripDiacritics(input.trim().toLowerCase());
  return STATUS_MAP[key] ?? null;
}

function parsePoints(input: string): number | null {
  if (typeof input !== 'string') input = String(input);
  const cleaned = input.replace(/\s+/g, '');
  if (!cleaned) return null;
  // Accept "10,000" / "10.000" / "10000" → 10000.
  const digits = cleaned.replace(/[.,]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  return Number(digits);
}

function parseAmountCents(input: string): number | null {
  if (typeof input !== 'string') input = String(input);
  const cleaned = input.replace(/\s+/g, '');
  if (!cleaned) return null;

  // Strategy:
  //   - if string has both "." and ",", "." is thousands and "," is decimal (pt-BR)
  //   - if only "," → decimal
  //   - if only "." with 2 digits after → decimal
  //   - otherwise pure integer reals; multiply by 100
  let normalised = cleaned;
  if (cleaned.includes('.') && cleaned.includes(',')) {
    normalised = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    normalised = cleaned.replace(',', '.');
  }
  const asNumber = Number(normalised);
  if (!Number.isFinite(asNumber) || asNumber < 0) return null;
  // Round to cents to avoid IEEE-754 drift.
  return Math.round(asNumber * 100);
}

function parseDate(input: string): Date | null {
  const trimmed = input.trim();
  // dd-mm-yyyy or dd/mm/yyyy
  const ddmmyyyy = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(trimmed);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  // yyyy-mm-dd
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) {
    const [, y, m, d] = iso;
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function parseRow(
  raw: RawRow,
): { kind: 'ok'; row: ParsedRow } | { kind: 'skip'; skip: ParseSkip } {
  const cpfDigits = normalizeCpf(raw.cpf);
  if (!isValidCpf(cpfDigits)) {
    return { kind: 'skip', skip: makeSkip(raw, 'invalid_cpf') };
  }
  const description = raw.description?.trim() ?? '';
  if (!description) return { kind: 'skip', skip: makeSkip(raw, 'invalid_description') };
  const occurredAt = parseDate(raw.occurredAt);
  if (!occurredAt) return { kind: 'skip', skip: makeSkip(raw, 'invalid_date') };
  const points = parsePoints(raw.points);
  if (points === null) return { kind: 'skip', skip: makeSkip(raw, 'invalid_points') };
  const amountCents = parseAmountCents(raw.amount);
  if (amountCents === null) return { kind: 'skip', skip: makeSkip(raw, 'invalid_amount') };
  const status = normaliseStatus(raw.status);
  if (!status) return { kind: 'skip', skip: makeSkip(raw, 'invalid_status') };

  return {
    kind: 'ok',
    row: {
      rowIndex: raw.rowIndex,
      cpfDigits,
      description,
      occurredAt,
      points,
      amountCents,
      status,
    },
  };
}

function makeSkip(raw: RawRow, reason: string): ParseSkip {
  return {
    rowIndex: raw.rowIndex,
    cpfMasked: maskCpf(raw.cpf ?? ''),
    reason,
  };
}
