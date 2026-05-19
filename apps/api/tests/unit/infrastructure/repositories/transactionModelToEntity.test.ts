import { describe, expect, it } from 'vitest';
import type { TransactionModel } from '@/infrastructure/db/models/TransactionModel.js';
import { transactionModelToEntity } from '@/infrastructure/repositories/SequelizeTransactionRepository.js';

const NOW = new Date('2026-05-19T00:00:00.000Z');

function fakeModel(
  overrides: Partial<{ occurredAt: unknown; points: unknown; amountCents: unknown }> = {},
): TransactionModel {
  return {
    id: 't1',
    userId: 'u1',
    description: 'Venda do produto X',
    occurredAt: '2022-10-10',
    points: 10000,
    amountCents: 1_000_000,
    status: 'approved',
    importBatchId: 'b1',
    get: (key: string): unknown => (key === 'createdAt' || key === 'updatedAt' ? NOW : undefined),
    ...overrides,
  } as unknown as TransactionModel;
}

describe('transactionModelToEntity', () => {
  it('converts the DATEONLY string Sequelize returns into a Date', () => {
    const entity = transactionModelToEntity(fakeModel());
    expect(entity.occurredAt).toBeInstanceOf(Date);
    expect(entity.occurredAt.toISOString().slice(0, 10)).toBe('2022-10-10');
  });

  it('keeps Date inputs intact', () => {
    const entity = transactionModelToEntity(
      fakeModel({ occurredAt: new Date('2024-01-15T00:00:00.000Z') }),
    );
    expect(entity.occurredAt.toISOString().slice(0, 10)).toBe('2024-01-15');
  });

  it('coerces BIGINT-as-string values to numbers', () => {
    const entity = transactionModelToEntity(
      fakeModel({ points: '12345', amountCents: '6789' }),
    );
    expect(entity.points).toBe(12345);
    expect(entity.amountCents).toBe(6789);
  });
});
