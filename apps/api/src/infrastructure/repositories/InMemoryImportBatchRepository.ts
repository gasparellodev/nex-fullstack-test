import { ImportBatch } from '@/domain/entities/ImportBatch.js';
import type {
  CreateImportBatchInput,
  IImportBatchRepository,
} from '@/domain/repositories/IImportBatchRepository.js';

export class InMemoryImportBatchRepository implements IImportBatchRepository {
  private readonly items = new Map<string, ImportBatch>();

  async create(input: CreateImportBatchInput): Promise<ImportBatch> {
    const batch = new ImportBatch({ ...input, createdAt: new Date() });
    this.items.set(batch.id, batch);
    return batch;
  }

  async findByFileSha256(sha256: string): Promise<ImportBatch | null> {
    for (const b of this.items.values()) if (b.fileSha256 === sha256) return b;
    return null;
  }

  async findById(id: string): Promise<ImportBatch | null> {
    return this.items.get(id) ?? null;
  }

  size(): number {
    return this.items.size;
  }
}
