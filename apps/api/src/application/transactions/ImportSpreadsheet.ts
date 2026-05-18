import { createHash, randomUUID } from 'node:crypto';
import type { IAuditLogRepository } from '@/domain/repositories/IAuditLogRepository.js';
import type { IImportBatchRepository } from '@/domain/repositories/IImportBatchRepository.js';
import type {
  ITransactionRepository,
  UnitOfWork,
} from '@/domain/repositories/ITransactionRepository.js';
import type { IUserRepository } from '@/domain/repositories/IUserRepository.js';
import type { ICpfIndex } from '@/domain/ports/ICpfIndex.js';
import type { IClock } from '@/shared/clock.js';
import { UnprocessableError } from '@/shared/errors.js';
import type { ParserRegistry } from '@/infrastructure/parsers/ParserRegistry.js';
import type { ImportResultDto, ImportSkippedRow } from '@nex/shared';

export interface ImportSpreadsheetInput {
  adminId: string;
  filename: string;
  buffer: Buffer;
}

export interface ImportSpreadsheetDeps {
  users: IUserRepository;
  transactions: ITransactionRepository;
  importBatches: IImportBatchRepository;
  auditLogs: IAuditLogRepository;
  cpfIndex: ICpfIndex;
  parsers: ParserRegistry;
  clock: IClock;
  /** Wraps a function in a database transaction. Optional in tests. */
  withTransaction?: <T>(work: (uow: UnitOfWork) => Promise<T>) => Promise<T>;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 50_000;

export class ImportSpreadsheet {
  constructor(private readonly deps: ImportSpreadsheetDeps) {}

  async execute(input: ImportSpreadsheetInput): Promise<ImportResultDto> {
    if (input.buffer.byteLength > MAX_FILE_BYTES) {
      throw new UnprocessableError('file is larger than 5MB', { field: 'file' });
    }

    const fileSha256 = createHash('sha256').update(input.buffer).digest('hex');
    const previous = await this.deps.importBatches.findByFileSha256(fileSha256);
    if (previous) {
      return {
        batchId: previous.id,
        filename: previous.filename,
        totalRows: previous.totalRows,
        importedRows: 0,
        skippedRows: previous.skippedRows,
      };
    }

    const parser = this.deps.parsers.forFilename(input.filename);
    const parsed = parser.parse(input.buffer);
    if (parsed.totalRows > MAX_ROWS) {
      throw new UnprocessableError(`file has too many rows (max ${MAX_ROWS})`, {
        field: 'file',
      });
    }

    const skipped: ImportSkippedRow[] = parsed.skipped.map((s) => ({
      row: s.rowIndex,
      cpfMasked: s.cpfMasked,
      reason: s.reason,
    }));

    const toInsert: Parameters<ITransactionRepository['bulkInsert']>[0] = [];
    const importedBatchId = randomUUID();

    for (const row of parsed.rows) {
      const cpfHash = this.deps.cpfIndex.compute(row.cpfDigits);
      const user = await this.deps.users.findByCpfHash(cpfHash);
      if (!user) {
        skipped.push({
          row: row.rowIndex,
          cpfMasked: maskFromDigits(row.cpfDigits),
          reason: 'user_not_found',
        });
        continue;
      }
      toInsert.push({
        id: randomUUID(),
        userId: user.id,
        description: row.description,
        occurredAt: row.occurredAt,
        points: row.points,
        amountCents: row.amountCents,
        status: row.status,
        importBatchId: importedBatchId,
      });
    }

    const importedRows = toInsert.length;

    const runInTransaction =
      this.deps.withTransaction ??
      (async <T>(work: (uow: UnitOfWork) => Promise<T>): Promise<T> => work({}));

    const batch = await runInTransaction(async (uow) => {
      const created = await this.deps.importBatches.create(
        {
          id: importedBatchId,
          adminId: input.adminId,
          filename: input.filename,
          fileSha256,
          totalRows: parsed.totalRows,
          importedRows,
          skippedRows: skipped,
        },
        uow,
      );
      if (toInsert.length > 0) await this.deps.transactions.bulkInsert(toInsert, uow);
      await this.deps.auditLogs.log(
        {
          id: randomUUID(),
          actorId: input.adminId,
          action: 'import.run',
          metadata: {
            batchId: created.id,
            filename: input.filename,
            totalRows: parsed.totalRows,
            importedRows,
            skippedRows: skipped.length,
          },
        },
        uow,
      );
      return created;
    });

    return {
      batchId: batch.id,
      filename: batch.filename,
      totalRows: batch.totalRows,
      importedRows,
      skippedRows: skipped,
    };
  }
}

function maskFromDigits(cpf: string): string {
  if (cpf.length !== 11) return '***.***.***-**';
  return `***.***.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}
