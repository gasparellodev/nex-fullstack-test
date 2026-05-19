import { randomUUID } from 'node:crypto';
import type { ICpfCipher } from '@/domain/ports/ICpfCipher.js';
import type { IAuditLogRepository } from '@/domain/repositories/IAuditLogRepository.js';
import type { ITransactionRepository } from '@/domain/repositories/ITransactionRepository.js';
import type { IUserRepository } from '@/domain/repositories/IUserRepository.js';
import { NotFoundError } from '@/shared/errors.js';
import { formatCpf } from '@/shared/cpf.js';

export interface ExportUserDataDeps {
  users: IUserRepository;
  transactions: ITransactionRepository;
  auditLogs: IAuditLogRepository;
  cpfCipher: ICpfCipher;
}

export interface ExportUserDataResult {
  exportedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    cpf: string;
    role: string;
    consentAt: string;
  };
  transactions: {
    id: string;
    description: string;
    occurredAt: string;
    points: number;
    amountCents: number;
    status: string;
  }[];
}

const PAGE_SIZE = 1000;

export class ExportUserData {
  constructor(private readonly deps: ExportUserDataDeps) {}

  async execute(userId: string): Promise<ExportUserDataResult> {
    const user = await this.deps.users.findById(userId);
    if (!user) throw new NotFoundError('user not found');

    const collected: ExportUserDataResult['transactions'] = [];
    let page = 1;
    while (true) {
      const { data, total } = await this.deps.transactions.listForUser(userId, {
        page,
        pageSize: PAGE_SIZE,
      });
      for (const t of data) {
        collected.push({
          id: t.id,
          description: t.description,
          occurredAt: t.occurredAt.toISOString().slice(0, 10),
          points: t.points,
          amountCents: t.amountCents,
          status: t.status,
        });
      }
      if (collected.length >= total || data.length === 0) break;
      page += 1;
    }

    await this.deps.auditLogs.log({
      id: randomUUID(),
      actorId: userId,
      action: 'lgpd.export',
      targetUserId: userId,
      metadata: { transactions: collected.length },
    });

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: formatCpf(this.deps.cpfCipher.decrypt(user.cpfEncrypted)),
        role: user.role,
        consentAt: user.consentAt.toISOString(),
      },
      transactions: collected,
    };
  }
}
