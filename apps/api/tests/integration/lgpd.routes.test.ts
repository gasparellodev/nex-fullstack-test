import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildTestApp, type TestAppHandle } from '@tests/helpers/buildTestApp.js';
import { AesGcmCipher } from '@/infrastructure/crypto/AesGcmCipher.js';
import { HmacIndex } from '@/infrastructure/crypto/HmacIndex.js';

const USER_ID = 'user-uuid';
const cpfIndex = new HmacIndex('a'.repeat(32));
const cpfCipher = new AesGcmCipher('0'.repeat(64));

async function seed(handle: TestAppHandle): Promise<string> {
  await handle.users.create({
    id: USER_ID,
    name: 'Ana',
    email: 'ana@example.com',
    cpfEncrypted: cpfCipher.encrypt('28227930000'),
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
  ]);
  return handle.tokens.sign({ sub: USER_ID, role: 'user' }).token;
}

describe('POST /api/me/export', () => {
  let handle: TestAppHandle;
  let token: string;

  beforeEach(async () => {
    handle = buildTestApp();
    token = await seed(handle);
  });

  it('returns the user data and transactions decrypted', async () => {
    const res = await request(handle.app)
      .post('/api/me/export')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.cpf).toBe('282.279.300-00');
    expect(res.body.transactions).toHaveLength(1);
    expect(res.headers['content-disposition']).toContain('attachment');
  });

  it('writes an lgpd.export audit log entry', async () => {
    await request(handle.app)
      .post('/api/me/export')
      .set('Authorization', `Bearer ${token}`);
    const entries = handle.auditLogs.all().filter((l) => l.action === 'lgpd.export');
    expect(entries).toHaveLength(1);
  });
});

describe('DELETE /api/me', () => {
  let handle: TestAppHandle;
  let token: string;

  beforeEach(async () => {
    handle = buildTestApp();
    token = await seed(handle);
  });

  it('anonymises the user and writes an audit log entry', async () => {
    const res = await request(handle.app)
      .delete('/api/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.anonymisedEmail).toBe(`deleted-${USER_ID}@nex.invalid`);

    const remaining = await handle.users.findByEmail('ana@example.com');
    expect(remaining).toBeNull();

    const entries = handle.auditLogs.all().filter((l) => l.action === 'lgpd.delete');
    expect(entries).toHaveLength(1);
  });
});
