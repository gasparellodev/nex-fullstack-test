import type { TransactionStatus } from '@nex/shared';

export interface TransactionProps {
  id: string;
  userId: string;
  description: string;
  occurredAt: Date;
  points: number;
  amountCents: number;
  status: TransactionStatus;
  importBatchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Transaction {
  readonly id: string;
  readonly userId: string;
  readonly description: string;
  readonly occurredAt: Date;
  readonly points: number;
  readonly amountCents: number;
  readonly status: TransactionStatus;
  readonly importBatchId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: TransactionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.description = props.description;
    this.occurredAt = props.occurredAt;
    this.points = props.points;
    this.amountCents = props.amountCents;
    this.status = props.status;
    this.importBatchId = props.importBatchId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
