import { describe, expect, it } from 'vitest';
import { parseRow } from '@/infrastructure/parsers/rowSchema.js';

function row(overrides: Record<string, string> = {}) {
  return {
    rowIndex: 2,
    cpf: '282.279.300-00',
    description: 'Venda do produto X',
    occurredAt: '10-10-2022',
    points: '10,000',
    amount: '10.000,00',
    status: 'Aprovado',
    ...overrides,
  };
}

describe('parseRow', () => {
  it('parses the canonical happy row', () => {
    const result = parseRow(row());
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.row).toMatchObject({
      cpfDigits: '28227930000',
      description: 'Venda do produto X',
      points: 10_000,
      amountCents: 1_000_000,
      status: 'approved',
    });
    expect(result.row.occurredAt.toISOString()).toBe('2022-10-10T00:00:00.000Z');
  });

  it('maps Reprovado → rejected and Em avaliação → pending', () => {
    expect(
      parseRow(row({ status: 'Reprovado' })).kind === 'ok' &&
        (parseRow(row({ status: 'Reprovado' })) as { row: { status: string } }).row.status,
    ).toBe('rejected');
    expect(
      parseRow(row({ status: 'Em avaliação' })).kind === 'ok' &&
        (parseRow(row({ status: 'Em avaliação' })) as { row: { status: string } }).row.status,
    ).toBe('pending');
  });

  it.each([
    ['invalid_cpf', { cpf: '111.111.111-11' }],
    ['invalid_date', { occurredAt: 'not-a-date' }],
    ['invalid_points', { points: 'abc' }],
    ['invalid_amount', { amount: '-1' }],
    ['invalid_status', { status: 'maybe' }],
    ['invalid_description', { description: '   ' }],
  ])('skips rows with reason %s', (reason, overrides) => {
    const result = parseRow(row(overrides));
    expect(result.kind).toBe('skip');
    if (result.kind !== 'skip') return;
    expect(result.skip.reason).toBe(reason);
  });

  it('accepts pt-BR decimal without thousands separator', () => {
    const result = parseRow(row({ amount: '0,99' }));
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.row.amountCents).toBe(99);
  });
});
