import * as XLSX from 'xlsx';
import type { IParser, ParseResult, RawRow } from './IParser.js';
import { buildResult } from './CsvParser.js';

const COLUMN_ALIASES: Record<keyof Omit<RawRow, 'rowIndex'>, string[]> = {
  cpf: ['cpf'],
  description: ['descricao da transacao', 'descrição da transação', 'descricao', 'descrição', 'description'],
  occurredAt: ['data da transacao', 'data da transação', 'data', 'date'],
  points: ['valor em pontos', 'pontos', 'points'],
  amount: ['valor', 'amount'],
  status: ['status'],
};

function normaliseHeader(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
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

export class XlsxParser implements IParser {
  parse(buffer: Buffer): ParseResult {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, cellNF: false });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return { rows: [], skipped: [], totalRows: 0 };
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) return { rows: [], skipped: [], totalRows: 0 };

    const raw = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    }) as unknown[][];
    if (raw.length === 0) return { rows: [], skipped: [], totalRows: 0 };

    const [headerRow, ...dataRows] = raw;
    const headers = (headerRow ?? []).map((c) => String(c ?? ''));
    const cols = indexHeader(headers);
    const stringRows = dataRows.map((r) => r.map((c) => (c == null ? '' : String(c))));
    return buildResult(stringRows, cols);
  }
}
