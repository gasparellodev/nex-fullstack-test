import type { Transaction as SequelizeTransaction } from 'sequelize';
import { ImportBatch } from '@/domain/entities/ImportBatch.js';
import type {
  CreateImportBatchInput,
  IImportBatchRepository,
} from '@/domain/repositories/IImportBatchRepository.js';
import type { UnitOfWork } from '@/domain/repositories/ITransactionRepository.js';
import { ImportBatchModel } from '@/infrastructure/db/models/ImportBatchModel.js';

function txFromUow(uow?: UnitOfWork): SequelizeTransaction | undefined {
  return (uow as { transaction?: SequelizeTransaction } | undefined)?.transaction;
}

function toEntity(model: ImportBatchModel): ImportBatch {
  return new ImportBatch({
    id: model.id,
    adminId: model.adminId,
    filename: model.filename,
    fileSha256: model.fileSha256,
    totalRows: model.totalRows,
    importedRows: model.importedRows,
    skippedRows: model.skippedRows,
    createdAt: model.get('createdAt') as Date,
  });
}

export class SequelizeImportBatchRepository implements IImportBatchRepository {
  async create(input: CreateImportBatchInput, uow?: UnitOfWork): Promise<ImportBatch> {
    const tx = txFromUow(uow);
    const row = await ImportBatchModel.create(input, tx ? { transaction: tx } : {});
    return toEntity(row);
  }

  async findByFileSha256(sha256: string): Promise<ImportBatch | null> {
    const row = await ImportBatchModel.findOne({ where: { fileSha256: sha256 } });
    return row ? toEntity(row) : null;
  }

  async findById(id: string): Promise<ImportBatch | null> {
    const row = await ImportBatchModel.findByPk(id);
    return row ? toEntity(row) : null;
  }
}
