import type { AuditAction } from '@nex/shared';

export interface AuditLogProps {
  id: string;
  actorId: string;
  action: AuditAction;
  targetUserId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export class AuditLog {
  readonly id: string;
  readonly actorId: string;
  readonly action: AuditAction;
  readonly targetUserId: string | null;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;

  constructor(props: AuditLogProps) {
    this.id = props.id;
    this.actorId = props.actorId;
    this.action = props.action;
    this.targetUserId = props.targetUserId;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
  }
}
