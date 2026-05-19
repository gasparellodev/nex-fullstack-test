import type { AuditAction } from '@nex/shared';
import type { AuditLog } from '@/domain/entities/AuditLog.js';
import type { UnitOfWork } from '@/domain/repositories/ITransactionRepository.js';

export interface CreateAuditLogInput {
  id: string;
  actorId: string;
  action: AuditAction;
  targetUserId?: string | null;
  metadata: Record<string, unknown>;
}

export interface IAuditLogRepository {
  log(input: CreateAuditLogInput, uow?: UnitOfWork): Promise<AuditLog>;
}
