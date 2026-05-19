import { parse } from 'csv-parse/sync';
import type { IParser, ParseResult, RawRow } from './IParser.js';
import { parseRow } from './rowSchema.js';

const COLUMN_ALIASES: Record<keyof Omit<RawRow, 'rowIndex'>, string[]> = {
  cpf: ['cpf'],
  description: ['descricao da transacao', 'descrição da transação', 'descricao', 'descrição', 'description'],
  occurredAt: ['data da transacao', 'data da transação', 'data', 'date'],
  points: ['valor em pontos', 'pontos', 'points'],
  amount: ['valor', 'amount'],
  status: ['status'],
};

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function normaliseHeader(value: string): string {
  return stripDiacritics(value).trim().toLowerCase();
}

function indexHeader(headers: string[]): Record<keyof RawRow, number> {
  const normalised = headers.map(normaliseHeader);
  const result = {} as Record<keyof RawRow, number>;
  (Object.keys(COLUMN_ALIASES) as (keyof Omit<RawRow, 'rowIndex'>)[]).forEach((key) => {
    const aliasesNormalised = COLUMN_ALIASES[key].map(normaliseHeader);
    const idx = normalised.findIndex((h) => aliasesNormalised.includes(h));
    if (idx === -1) throw new Error(`missing required column: ${key}`);
    result[key] = idx;
  });
  return result;
}

export class CsvParser implements IParser {
  parse(buffer: Buffer): ParseResult {
    const records = parse(buffer, {
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      bom: true,
      trim: true,
      delimiter: detectDelimiter(buffer),
    }) as string[][];
    if (records.length === 0) return { rows: [], skipped: [], totalRows: 0 };
    const [header, ...rows] = records;
    const cols = indexHeader(header ?? []);
    return buildResult(rows, cols);
  }
}

function detectDelimiter(buffer: Buffer): string {
  const firstLine = buffer.toString('utf8').split(/\r?\n/, 1)[0] ?? '';
  const counts = {
    ',': (firstLine.match(/,/g) ?? []).length,
    ';': (firstLine.match(/;/g) ?? []).length,
    '\t': (firstLine.match(/\t/g) ?? []).length,
  };
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  return sorted[0]?.[1] ? sorted[0][0] : ',';
}

export function buildResult(
  rows: string[][],
  cols: Record<keyof RawRow, number>,
): ParseResult {
  const out: ParseResult = { rows: [], skipped: [], totalRows: rows.length };
  rows.forEach((row, index) => {
    const raw: RawRow = {
      rowIndex: index + 2,
      cpf: row[cols.cpf] ?? '',
      description: row[cols.description] ?? '',
      occurredAt: row[cols.occurredAt] ?? '',
      points: row[cols.points] ?? '',
      amount: row[cols.amount] ?? '',
      status: row[cols.status] ?? '',
    };
    const parsed = parseRow(raw);
    if (parsed.kind === 'ok') out.rows.push(parsed.row);
    else out.skipped.push(parsed.skip);
  });
  return out;
}
