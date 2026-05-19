import { randomUUID } from 'node:crypto';
import type { IAuditLogRepository } from '@/domain/repositories/IAuditLogRepository.js';
import type { IUserRepository } from '@/domain/repositories/IUserRepository.js';
import { NotFoundError } from '@/shared/errors.js';

export interface DeleteUserAccountDeps {
  users: IUserRepository;
  auditLogs: IAuditLogRepository;
}

const TOMBSTONE_DOMAIN = 'nex.invalid';

export class DeleteUserAccount {
  constructor(private readonly deps: DeleteUserAccountDeps) {}

  async execute(userId: string): Promise<{ anonymisedEmail: string }> {
    const user = await this.deps.users.findById(userId);
    if (!user) throw new NotFoundError('user not found');

    const anonymisedEmail = `deleted-${userId}@${TOMBSTONE_DOMAIN}`;
    await this.deps.users.anonymise(userId, anonymisedEmail);
    await this.deps.auditLogs.log({
      id: randomUUID(),
      actorId: userId,
      action: 'lgpd.delete',
      targetUserId: userId,
      metadata: { anonymisedEmail },
    });
    return { anonymisedEmail };
  }
}
