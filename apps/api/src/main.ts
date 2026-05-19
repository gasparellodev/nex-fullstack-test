import 'reflect-metadata';
import 'dotenv/config';
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
import { createSequelize } from '@/infrastructure/db/sequelize.js';
import { buildApp } from '@/infrastructure/http/server.js';
import { CsvParser } from '@/infrastructure/parsers/CsvParser.js';
import { ParserRegistry } from '@/infrastructure/parsers/ParserRegistry.js';
import { XlsxParser } from '@/infrastructure/parsers/XlsxParser.js';
import { SequelizeAuditLogRepository } from '@/infrastructure/repositories/SequelizeAuditLogRepository.js';
import { SequelizeImportBatchRepository } from '@/infrastructure/repositories/SequelizeImportBatchRepository.js';
import { SequelizeTransactionRepository } from '@/infrastructure/repositories/SequelizeTransactionRepository.js';
import { SequelizeUserRepository } from '@/infrastructure/repositories/SequelizeUserRepository.js';
import { AdminImportsController } from '@/presentation/controllers/AdminImportsController.js';
import { AdminTransactionsController } from '@/presentation/controllers/AdminTransactionsController.js';
import { LgpdController } from '@/presentation/controllers/LgpdController.js';
import { AuthController } from '@/presentation/controllers/AuthController.js';
import { MeController } from '@/presentation/controllers/MeController.js';
import { SystemClock } from '@/shared/clock.js';
import { loadEnv } from '@/shared/env.js';
import { createLogger } from '@/shared/logger.js';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env.API_LOG_LEVEL, env.NODE_ENV !== 'production');

  const sequelize = createSequelize({
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    database: env.MYSQL_DATABASE,
    username: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    logging: env.NODE_ENV !== 'production' && env.API_LOG_LEVEL === 'debug',
  });
  await sequelize.authenticate();
  logger.info('database connection established');

  const users = new SequelizeUserRepository();
  const transactions = new SequelizeTransactionRepository();
  const importBatches = new SequelizeImportBatchRepository();
  const auditLogs = new SequelizeAuditLogRepository();

  const passwords = new BcryptHasher(12);
  const cpfCipher = new AesGcmCipher(env.LGPD_DATA_KEY);
  const cpfIndex = new HmacIndex(env.LGPD_HMAC_PEPPER);
  const tokens = new JwtSigner({ secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN });
  const clock = new SystemClock();

  const parsers = new ParserRegistry().register('.xlsx', new XlsxParser()).register('.csv', new CsvParser());

  const registerUser = new RegisterUser({ users, passwords, cpfCipher, cpfIndex, tokens, clock });
  const authenticateUser = new AuthenticateUser({ users, passwords, tokens });
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
    withTransaction: async (work) =>
      sequelize.transaction(async (transaction) => work({ transaction })),
  });

  const app = buildApp({
    authController: new AuthController(registerUser, authenticateUser),
    meController: new MeController(users, listUserTransactions, getWalletBalance),
    lgpdController: new LgpdController(exportUserData, deleteUserAccount),
    adminImportsController: new AdminImportsController(importSpreadsheet),
    adminTransactionsController: new AdminTransactionsController(listAdminTransactions),
    tokens,
    logger,
    corsOrigin: env.API_CORS_ORIGIN,
    rateLimitAuth: env.RATE_LIMIT_AUTH,
    rateLimitGlobal: env.RATE_LIMIT_GLOBAL,
  });

  app.listen(env.API_PORT, () => {
    logger.info({ port: env.API_PORT }, 'api listening');
  });
}

bootstrap().catch((err: unknown) => {
  console.error('bootstrap failed:', err);
  process.exit(1);
});
