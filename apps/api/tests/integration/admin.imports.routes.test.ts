import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildTestApp, type TestAppHandle } from '@tests/helpers/buildTestApp.js';
import { HmacIndex } from '@/infrastructure/crypto/HmacIndex.js';

const HEADER = 'CPF,Descrição da transação,Data da transação,Valor em pontos,Valor,Status';
const CSV = `${HEADER}
282.279.300-00,Venda do produto X,10-10-2022,"10,000","10.000,00",Aprovado
282.279.300-00,Venda do produto Y,10-10-2022,"10,000","10.000,00",Reprovado
529.982.247-25,Venda do produto Z,10-10-2022,"10,000","10.000,00",Em avaliação
`;

const ADMIN_ID = 'admin-uuid';

async function seedAdminAndUser(handle: TestAppHandle): Promise<string> {
  const cpfIndex = new HmacIndex('a'.repeat(32));
  await handle.users.create({
    id: ADMIN_ID,
    name: 'Admin',
    email: 'admin@nex.com',
    cpfEncrypted: Buffer.alloc(0),
    cpfHash: cpfIndex.compute('39053344705'),
    passwordHash: 'hash',
    role: 'admin',
    consentAt: new Date(),
  });
  await handle.users.create({
    id: 'user-1',
    name: 'Ana',
    email: 'ana@example.com',
    cpfEncrypted: Buffer.alloc(0),
    cpfHash: cpfIndex.compute('28227930000'),
    passwordHash: 'hash',
    role: 'user',
    consentAt: new Date(),
  });
  return handle.tokens.sign({ sub: ADMIN_ID, role: 'admin' }).token;
}

describe('POST /api/admin/imports', () => {
  let handle: TestAppHandle;

  beforeEach(() => {
    handle = buildTestApp();
  });

  it('returns 401 without a token', async () => {
    const res = await request(handle.app)
      .post('/api/admin/imports')
      .attach('file', Buffer.from(CSV), 'import.csv');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin token', async () => {
    const cpfIndex = new HmacIndex('a'.repeat(32));
    await handle.users.create({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@example.com',
      cpfEncrypted: Buffer.alloc(0),
      cpfHash: cpfIndex.compute('28227930000'),
      passwordHash: 'h',
      role: 'user',
      consentAt: new Date(),
    });
    const token = handle.tokens.sign({ sub: 'user-1', role: 'user' }).token;

    const res = await request(handle.app)
      .post('/api/admin/imports')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(CSV), 'import.csv');
    expect(res.status).toBe(403);
  });

  it('imports a CSV and reports skipped rows', async () => {
    const token = await seedAdminAndUser(handle);

    const res = await request(handle.app)
      .post('/api/admin/imports')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(CSV), 'import.csv');

    expect(res.status).toBe(200);
    expect(res.body.importedRows).toBe(2);
    expect(res.body.totalRows).toBe(3);
    expect(res.body.skippedRows).toHaveLength(1);
    expect(handle.transactions.size()).toBe(2);
  });

  it('is idempotent on retry with the same body', async () => {
    const token = await seedAdminAndUser(handle);
    const first = await request(handle.app)
      .post('/api/admin/imports')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(CSV), 'import.csv');
    const second = await request(handle.app)
      .post('/api/admin/imports')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(CSV), 'import.csv');

    expect(second.body.batchId).toBe(first.body.batchId);
    expect(second.body.importedRows).toBe(0);
    expect(handle.transactions.size()).toBe(2);
  });

  it('rejects unsupported extensions', async () => {
    const token = await seedAdminAndUser(handle);
    const res = await request(handle.app)
      .post('/api/admin/imports')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(CSV), 'import.txt');
    expect(res.status).toBe(422);
  });
});
