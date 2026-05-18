import { beforeEach, describe, expect, it } from 'vitest';
import { ImportSpreadsheet } from '@/application/transactions/ImportSpreadsheet.js';
import { HmacIndex } from '@/infrastructure/crypto/HmacIndex.js';
import { CsvParser } from '@/infrastructure/parsers/CsvParser.js';
import { ParserRegistry } from '@/infrastructure/parsers/ParserRegistry.js';
import { InMemoryAuditLogRepository } from '@/infrastructure/repositories/InMemoryAuditLogRepository.js';
import { InMemoryImportBatchRepository } from '@/infrastructure/repositories/InMemoryImportBatchRepository.js';
import { InMemoryTransactionRepository } from '@/infrastructure/repositories/InMemoryTransactionRepository.js';
import { InMemoryUserRepository } from '@/infrastructure/repositories/InMemoryUserRepository.js';
import { SystemClock } from '@/shared/clock.js';

const HEADER = 'CPF,Descrição da transação,Data da transação,Valor em pontos,Valor,Status';
const CSV = `${HEADER}
282.279.300-00,Venda do produto X,10-10-2022,"10,000","10.000,00",Aprovado
282.279.300-00,Venda do produto Y,10-10-2022,"10,000","10.000,00",Reprovado
529.982.247-25,Venda do produto Z,10-10-2022,"10,000","10.000,00",Em avaliação
`;

interface Fixture {
  users: InMemoryUserRepository;
  transactions: InMemoryTransactionRepository;
  importBatches: InMemoryImportBatchRepository;
  auditLogs: InMemoryAuditLogRepository;
  importSpreadsheet: ImportSpreadsheet;
}

async function build(): Promise<Fixture> {
  const users = new InMemoryUserRepository();
  const transactions = new InMemoryTransactionRepository();
  const importBatches = new InMemoryImportBatchRepository();
  const auditLogs = new InMemoryAuditLogRepository();
  const cpfIndex = new HmacIndex('a'.repeat(32));
  const parsers = new ParserRegistry().register('.csv', new CsvParser());

  // Seed the user whose CPF appears twice in the CSV.
  await users.create({
    id: 'user-1',
    name: 'Ana',
    email: 'ana@example.com',
    cpfEncrypted: Buffer.alloc(0),
    cpfHash: cpfIndex.compute('28227930000'),
    passwordHash: 'hash',
    role: 'user',
    consentAt: new Date(),
  });

  return {
    users,
    transactions,
    importBatches,
    auditLogs,
    importSpreadsheet: new ImportSpreadsheet({
      users,
      transactions,
      importBatches,
      auditLogs,
      cpfIndex,
      parsers,
      clock: new SystemClock(),
    }),
  };
}

describe('ImportSpreadsheet', () => {
  let f: Fixture;

  beforeEach(async () => {
    f = await build();
  });

  it('imports rows for known CPFs and skips unknown ones', async () => {
    const result = await f.importSpreadsheet.execute({
      adminId: 'admin-1',
      filename: 'import.csv',
      buffer: Buffer.from(CSV),
    });

    expect(result.importedRows).toBe(2);
    expect(result.totalRows).toBe(3);
    expect(result.skippedRows).toHaveLength(1);
    expect(result.skippedRows[0]).toMatchObject({ reason: 'user_not_found' });
    expect(f.transactions.size()).toBe(2);
  });

  it('writes an audit log entry on a successful import', async () => {
    await f.importSpreadsheet.execute({
      adminId: 'admin-1',
      filename: 'import.csv',
      buffer: Buffer.from(CSV),
    });

    const logs = f.auditLogs.all();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ action: 'import.run', actorId: 'admin-1' });
  });

  it('is idempotent on the same file (SHA-256 match)', async () => {
    const first = await f.importSpreadsheet.execute({
      adminId: 'admin-1',
      filename: 'import.csv',
      buffer: Buffer.from(CSV),
    });
    const second = await f.importSpreadsheet.execute({
      adminId: 'admin-1',
      filename: 'import.csv',
      buffer: Buffer.from(CSV),
    });

    expect(second.batchId).toBe(first.batchId);
    expect(second.importedRows).toBe(0);
    expect(f.transactions.size()).toBe(2); // no duplicates
    expect(f.auditLogs.all()).toHaveLength(1);
  });

  it('rejects unsupported extensions before parsing', async () => {
    await expect(
      f.importSpreadsheet.execute({
        adminId: 'admin-1',
        filename: 'import.txt',
        buffer: Buffer.from(CSV),
      }),
    ).rejects.toThrow(/unsupported file extension/);
  });

  it('rejects files larger than 5 MB', async () => {
    const huge = Buffer.alloc(6 * 1024 * 1024, 'x');
    await expect(
      f.importSpreadsheet.execute({
        adminId: 'admin-1',
        filename: 'big.csv',
        buffer: huge,
      }),
    ).rejects.toThrow(/larger than 5MB/);
  });
});
