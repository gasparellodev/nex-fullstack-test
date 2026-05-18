import type { Transaction as SequelizeTransaction } from 'sequelize';
import { AuditLog } from '@/domain/entities/AuditLog.js';
import type {
  CreateAuditLogInput,
  IAuditLogRepository,
} from '@/domain/repositories/IAuditLogRepository.js';
import type { UnitOfWork } from '@/domain/repositories/ITransactionRepository.js';
import { AuditLogModel } from '@/infrastructure/db/models/AuditLogModel.js';

function txFromUow(uow?: UnitOfWork): SequelizeTransaction | undefined {
  return (uow as { transaction?: SequelizeTransaction } | undefined)?.transaction;
}

export class SequelizeAuditLogRepository implements IAuditLogRepository {
  async log(input: CreateAuditLogInput, uow?: UnitOfWork): Promise<AuditLog> {
    const tx = txFromUow(uow);
    const row = await AuditLogModel.create(
      {
        id: input.id,
        actorId: input.actorId,
        action: input.action,
        targetUserId: input.targetUserId ?? null,
        metadata: input.metadata,
      },
      tx ? { transaction: tx } : {},
    );
    return new AuditLog({
      id: row.id,
      actorId: row.actorId,
      action: row.action,
      targetUserId: row.targetUserId,
      metadata: row.metadata,
      createdAt: row.get('createdAt') as Date,
    });
  }
}
