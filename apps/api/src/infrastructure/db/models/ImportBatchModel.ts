import { Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript';
import type { ImportSkippedRow } from '@nex/shared';

@Table({ tableName: 'import_batches', updatedAt: false })
export class ImportBatchModel extends Model {
  @PrimaryKey
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @Column({ type: DataType.CHAR(36), allowNull: false, field: 'admin_id' })
  declare adminId: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare filename: string;

  @Column({
    type: DataType.CHAR(64),
    allowNull: false,
    unique: 'import_batches_sha256_unique',
    field: 'file_sha256',
  })
  declare fileSha256: string;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'total_rows' })
  declare totalRows: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'imported_rows' })
  declare importedRows: number;

  @Column({ type: DataType.JSON, allowNull: false, field: 'skipped_rows' })
  declare skippedRows: ImportSkippedRow[];
}
