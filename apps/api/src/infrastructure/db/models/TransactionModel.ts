import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import type { TransactionStatus } from '@nex/shared';
import { UserModel } from '@/infrastructure/db/models/UserModel.js';

@Table({ tableName: 'transactions', paranoid: false })
export class TransactionModel extends Model {
  @PrimaryKey
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.CHAR(36), allowNull: false, field: 'user_id' })
  declare userId: string;

  @BelongsTo(() => UserModel)
  declare user?: UserModel;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare description: string;

  @Column({ type: DataType.DATEONLY, allowNull: false, field: 'occurred_at' })
  declare occurredAt: Date;

  @Column({ type: DataType.BIGINT, allowNull: false })
  declare points: number;

  @Column({ type: DataType.BIGINT, allowNull: false, field: 'amount_cents' })
  declare amountCents: number;

  @Column({
    type: DataType.ENUM('approved', 'rejected', 'pending'),
    allowNull: false,
  })
  declare status: TransactionStatus;

  @Column({ type: DataType.CHAR(36), allowNull: false, field: 'import_batch_id' })
  declare importBatchId: string;
}
