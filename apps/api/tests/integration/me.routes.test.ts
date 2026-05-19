import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildTestApp, type TestAppHandle } from '@tests/helpers/buildTestApp.js';
import { HmacIndex } from '@/infrastructure/crypto/HmacIndex.js';

const USER_ID = 'user-uuid';

async function seed(handle: TestAppHandle): Promise<string> {
  const cpfIndex = new HmacIndex('a'.repeat(32));
  await handle.users.create({
    id: USER_ID,
    name: 'Ana',
    email: 'ana@example.com',
    cpfEncrypted: Buffer.alloc(0),
    cpfHash: cpfIndex.compute('28227930000'),
    passwordHash: 'h',
    role: 'user',
    consentAt: new Date(),
  });
  await handle.transactions.bulkInsert([
    {
      id: 't1',
      userId: USER_ID,
      description: 'Venda do produto X',
      occurredAt: new Date('2022-10-10T00:00:00.000Z'),
      points: 10_000,
      amountCents: 1_000_000,
      status: 'approved',
      importBatchId: 'b1',
    },
    {
      id: 't2',
      userId: USER_ID,
      description: 'Venda do produto Y',
      occurredAt: new Date('2022-11-15T00:00:00.000Z'),
      points: 7_500,
      amountCents: 750_000,
      status: 'rejected',
      importBatchId: 'b1',
    },
    {
      id: 't3',
      userId: USER_ID,
      description: 'Venda do produto Z',
      occurredAt: new Date('2022-12-01T00:00:00.000Z'),
      points: 5_000,
      amountCents: 500_000,
      status: 'pending',
      importBatchId: 'b1',
    },
  ]);
  return handle.tokens.sign({ sub: USER_ID, role: 'user' }).token;
}

describe('GET /api/me/transactions', () => {
  let handle: TestAppHandle;
  let token: string;

  beforeEach(async () => {
    handle = buildTestApp();
    token = await seed(handle);
  });

  it('returns all of the user transactions paginated', async () => {
    const res = await request(handle.app)
      .get('/api/me/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.data).toHaveLength(3);
  });

  it('filters by status', async () => {
    const res = await request(handle.app)
      .get('/api/me/transactions?status=approved')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].status).toBe('approved');
  });

  it('filters by date range', async () => {
    const res = await request(handle.app)
      .get('/api/me/transactions?fromDate=2022-11-01&toDate=2022-11-30')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].id).toBe('t2');
  });
});

describe('GET /api/me/wallet', () => {
  let handle: TestAppHandle;
  let token: string;

  beforeEach(async () => {
    handle = buildTestApp();
    token = await seed(handle);
  });

  it('sums only approved points', async () => {
    const res = await request(handle.app)
      .get('/api/me/wallet')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ balancePoints: 10_000 });
  });

  it('returns 401 without a token', async () => {
    const res = await request(handle.app).get('/api/me/wallet');
    expect(res.status).toBe(401);
  });
});
