import { DataType, Column, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';
import type { UserRole } from '@nex/shared';

@Table({ tableName: 'users', paranoid: true, deletedAt: 'deleted_at' })
export class UserModel extends Model<
  UserModel,
  Partial<{
    id: string;
    name: string;
    email: string;
    cpfEncrypted: Buffer;
    cpfHash: string;
    passwordHash: string;
    role: UserRole;
    consentAt: Date;
  }>
> {
  @PrimaryKey
  @Column({ type: DataType.CHAR(36), field: 'id' })
  declare id: string;

  @Column({ type: DataType.STRING(120), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(180), allowNull: false, unique: 'users_email_unique' })
  declare email: string;

  @Column({
    type: DataType.BLOB('medium'),
    allowNull: false,
    field: 'cpf_encrypted',
  })
  declare cpfEncrypted: Buffer;

  @Column({
    type: DataType.CHAR(64),
    allowNull: false,
    unique: 'users_cpf_hash_unique',
    field: 'cpf_hash',
  })
  declare cpfHash: string;

  @Column({ type: DataType.STRING(72), allowNull: false, field: 'password_hash' })
  declare passwordHash: string;

  @Default('user')
  @Column({ type: DataType.ENUM('admin', 'user'), allowNull: false })
  declare role: UserRole;

  @Column({ type: DataType.DATE, allowNull: false, field: 'consent_at' })
  declare consentAt: Date;

  @Column({ type: DataType.DATE, allowNull: true, field: 'deleted_at' })
  declare deletedAt: Date | null;
}
