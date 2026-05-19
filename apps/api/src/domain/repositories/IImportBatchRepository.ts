import type { ImportBatch, ImportBatchProps } from '@/domain/entities/ImportBatch.js';
import type { UnitOfWork } from '@/domain/repositories/ITransactionRepository.js';

export type CreateImportBatchInput = Omit<ImportBatchProps, 'createdAt'>;

export interface IImportBatchRepository {
  create(input: CreateImportBatchInput, uow?: UnitOfWork): Promise<ImportBatch>;
  findByFileSha256(sha256: string): Promise<ImportBatch | null>;
  findById(id: string): Promise<ImportBatch | null>;
}
