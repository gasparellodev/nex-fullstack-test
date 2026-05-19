import { AuditLog } from '@/domain/entities/AuditLog.js';
import type {
  CreateAuditLogInput,
  IAuditLogRepository,
} from '@/domain/repositories/IAuditLogRepository.js';

export class InMemoryAuditLogRepository implements IAuditLogRepository {
  private readonly items: AuditLog[] = [];

  async log(input: CreateAuditLogInput): Promise<AuditLog> {
    const entry = new AuditLog({
      ...input,
      targetUserId: input.targetUserId ?? null,
      createdAt: new Date(),
    });
    this.items.push(entry);
    return entry;
  }

  all(): AuditLog[] {
    return [...this.items];
  }
}
