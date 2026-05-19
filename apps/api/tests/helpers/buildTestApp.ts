import type { Express } from 'express';
import pino from 'pino';
import { AuthenticateUser } from '@/application/auth/AuthenticateUser.js';
import { RegisterUser } from '@/application/auth/RegisterUser.js';
import { ImportSpreadsheet } from '@/application/transactions/ImportSpreadsheet.js';
import { ListAdminTransactions } from '@/application/transactions/ListAdminTransactions.js';
import { ListUserTransactions } from '@/application/transactions/ListUserTransactions.js';
import { GetWalletBalance } from '@/application/transactions/GetWalletBalance.js';
import { DeleteUserAccount } from '@/application/lgpd/DeleteUserAccount.js';
import { ExportUserData } from '@/application/lgpd/ExportUserData.js';
import { AesGcmCipher } from '@/infrastructure/crypto/AesGcmCipher.js';
import { BcryptHasher } from '@/infrastructure/crypto/BcryptHasher.js';
import { HmacIndex } from '@/infrastructure/crypto/HmacIndex.js';
import { JwtSigner } from '@/infrastructure/crypto/JwtSigner.js';
import { buildApp } from '@/infrastructure/http/server.js';
import { CsvParser } from '@/infrastructure/parsers/CsvParser.js';
import { ParserRegistry } from '@/infrastructure/parsers/ParserRegistry.js';
import { XlsxParser } from '@/infrastructure/parsers/XlsxParser.js';
import { InMemoryAuditLogRepository } from '@/infrastructure/repositories/InMemoryAuditLogRepository.js';
import { InMemoryImportBatchRepository } from '@/infrastructure/repositories/InMemoryImportBatchRepository.js';
import { InMemoryTransactionRepository } from '@/infrastructure/repositories/InMemoryTransactionRepository.js';
import { InMemoryUserRepository } from '@/infrastructure/repositories/InMemoryUserRepository.js';
import { AdminImportsController } from '@/presentation/controllers/AdminImportsController.js';
import { AdminTransactionsController } from '@/presentation/controllers/AdminTransactionsController.js';
import { LgpdController } from '@/presentation/controllers/LgpdController.js';
import { AuthController } from '@/presentation/controllers/AuthController.js';
import { MeController } from '@/presentation/controllers/MeController.js';
import { SystemClock } from '@/shared/clock.js';

export interface TestAppHandle {
  app: Express;
  users: InMemoryUserRepository;
  transactions: InMemoryTransactionRepository;
  importBatches: InMemoryImportBatchRepository;
  auditLogs: InMemoryAuditLogRepository;
  tokens: JwtSigner;
}

export interface BuildTestAppOptions {
  rateLimitAuth?: number;
  rateLimitGlobal?: number;
}

export function buildTestApp(opts: BuildTestAppOptions = {}): TestAppHandle {
  const users = new InMemoryUserRepository();
  const transactions = new InMemoryTransactionRepository();
  const importBatches = new InMemoryImportBatchRepository();
  const auditLogs = new InMemoryAuditLogRepository();

  const passwords = new BcryptHasher(4);
  const cpfCipher = new AesGcmCipher('0'.repeat(64));
  const cpfIndex = new HmacIndex('a'.repeat(32));
  const tokens = new JwtSigner({
    secret: 'test-secret-must-be-at-least-32-characters-long',
    expiresIn: '15m',
  });
  const clock = new SystemClock();

  const parsers = new ParserRegistry()
    .register('.xlsx', new XlsxParser())
    .register('.csv', new CsvParser());

  const register = new RegisterUser({ users, passwords, cpfCipher, cpfIndex, tokens, clock });
  const authenticate = new AuthenticateUser({ users, passwords, tokens });
  const listAdminTransactions = new ListAdminTransactions({
    transactions,
    auditLogs,
    cpfIndex,
  });
  const listUserTransactions = new ListUserTransactions(transactions);
  const getWalletBalance = new GetWalletBalance(transactions);
  const exportUserData = new ExportUserData({ users, transactions, auditLogs, cpfCipher });
  const deleteUserAccount = new DeleteUserAccount({ users, auditLogs });
  const importSpreadsheet = new ImportSpreadsheet({
    users,
    transactions,
    importBatches,
    auditLogs,
    cpfIndex,
    parsers,
    clock,
  });
  const logger = pino({ level: 'silent' });

  const app = buildApp({
    authController: new AuthController(register, authenticate),
    meController: new MeController(users, listUserTransactions, getWalletBalance),
    lgpdController: new LgpdController(exportUserData, deleteUserAccount),
    adminImportsController: new AdminImportsController(importSpreadsheet),
    adminTransactionsController: new AdminTransactionsController(listAdminTransactions),
    tokens,
    logger,
    corsOrigin: 'http://localhost:5173',
    rateLimitAuth: opts.rateLimitAuth ?? 100,
    rateLimitGlobal: opts.rateLimitGlobal ?? 1000,
  });

  return { app, users, transactions, importBatches, auditLogs, tokens };
}
