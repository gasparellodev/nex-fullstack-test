import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';
import { AuditLogModel } from '@/infrastructure/db/models/AuditLogModel.js';
import { ImportBatchModel } from '@/infrastructure/db/models/ImportBatchModel.js';
import { TransactionModel } from '@/infrastructure/db/models/TransactionModel.js';
import { UserModel } from '@/infrastructure/db/models/UserModel.js';

export interface SequelizeOptions {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  logging?: boolean;
}

export function createSequelize(opts: SequelizeOptions): Sequelize {
  return new Sequelize({
    dialect: 'mysql',
    host: opts.host,
    port: opts.port,
    database: opts.database,
    username: opts.username,
    password: opts.password,
    logging: opts.logging ?? false,
    define: { underscored: true, timestamps: true, freezeTableName: false },
    models: [UserModel, TransactionModel, ImportBatchModel, AuditLogModel],
  });
}
