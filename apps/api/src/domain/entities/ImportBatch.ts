import type { ImportSkippedRow } from '@nex/shared';

export interface ImportBatchProps {
  id: string;
  adminId: string;
  filename: string;
  fileSha256: string;
  totalRows: number;
  importedRows: number;
  skippedRows: ImportSkippedRow[];
  createdAt: Date;
}

export class ImportBatch {
  readonly id: string;
  readonly adminId: string;
  readonly filename: string;
  readonly fileSha256: string;
  readonly totalRows: number;
  readonly importedRows: number;
  readonly skippedRows: ImportSkippedRow[];
  readonly createdAt: Date;

  constructor(props: ImportBatchProps) {
    this.id = props.id;
    this.adminId = props.adminId;
    this.filename = props.filename;
    this.fileSha256 = props.fileSha256;
    this.totalRows = props.totalRows;
    this.importedRows = props.importedRows;
    this.skippedRows = props.skippedRows;
    this.createdAt = props.createdAt;
  }
}
