import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildTestApp, type TestAppHandle } from '@tests/helpers/buildTestApp.js';
import { HmacIndex } from '@/infrastructure/crypto/HmacIndex.js';

const ADMIN_ID = 'admin-uuid';
const USER_ID = 'user-uuid';
const cpfIndex = new HmacIndex('a'.repeat(32));

async function seed(handle: TestAppHandle): Promise<string> {
  await handle.users.create({
    id: ADMIN_ID,
    name: 'Admin',
    email: 'admin@nex.com',
    cpfEncrypted: Buffer.alloc(0),
    cpfHash: cpfIndex.compute('39053344705'),
    passwordHash: 'h',
    role: 'admin',
    consentAt: new Date(),
  });
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
      importBatchId: 'batch-1',
    },
    {
      id: 't2',
      userId: USER_ID,
      description: 'Venda do produto Y',
      occurredAt: new Date('2022-10-11T00:00:00.000Z'),
      points: 5_000,
      amountCents: 500_000,
      status: 'rejected',
      importBatchId: 'batch-1',
    },
  ]);
  return handle.tokens.sign({ sub: ADMIN_ID, role: 'admin' }).token;
}

describe('GET /api/admin/transactions', () => {
  let handle: TestAppHandle;
  let token: string;

  beforeEach(async () => {
    handle = buildTestApp();
    token = await seed(handle);
  });

  it('returns paginated results with total', async () => {
    const res = await request(handle.app)
      .get('/api/admin/transactions')
      .query({ page: 1, pageSize: 10 })
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.page).toBe(1);
  });

  it('filters by status', async () => {
    const res = await request(handle.app)
      .get('/api/admin/transactions')
      .query({ status: 'approved' })
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].status).toBe('approved');
  });

  it('filters by product (substring)', async () => {
    const res = await request(handle.app)
      .get('/api/admin/transactions')
      .query({ product: 'produto X' })
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].description).toContain('produto X');
  });

  it('filters by amount range', async () => {
    const res = await request(handle.app)
      .get('/api/admin/transactions')
      .query({ fromAmount: '8000', toAmount: '11000' })
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].amountCents).toBe(1_000_000);
  });

  it('rejects unauthenticated callers', async () => {
    const res = await request(handle.app).get('/api/admin/transactions');
    expect(res.status).toBe(401);
  });

  it('writes a report.view audit log entry on each query', async () => {
    await request(handle.app)
      .get('/api/admin/transactions')
      .set('Authorization', `Bearer ${token}`);
    const reports = handle.auditLogs.all().filter((l) => l.action === 'report.view');
    expect(reports).toHaveLength(1);
  });
});
