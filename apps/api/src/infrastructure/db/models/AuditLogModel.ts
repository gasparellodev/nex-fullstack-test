import { Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript';
import type { AuditAction } from '@nex/shared';

@Table({ tableName: 'audit_logs', updatedAt: false })
export class AuditLogModel extends Model {
  @PrimaryKey
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @Column({ type: DataType.CHAR(36), allowNull: false, field: 'actor_id' })
  declare actorId: string;

  @Column({ type: DataType.STRING(80), allowNull: false })
  declare action: AuditAction;

  @Column({ type: DataType.CHAR(36), allowNull: true, field: 'target_user_id' })
  declare targetUserId: string | null;

  @Column({ type: DataType.JSON, allowNull: false })
  declare metadata: Record<string, unknown>;
}
