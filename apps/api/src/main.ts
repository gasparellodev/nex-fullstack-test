import 'reflect-metadata';
import 'dotenv/config';
import { AuthenticateUser } from '@/application/auth/AuthenticateUser.js';
import { RegisterUser } from '@/application/auth/RegisterUser.js';
import { AesGcmCipher } from '@/infrastructure/crypto/AesGcmCipher.js';
import { BcryptHasher } from '@/infrastructure/crypto/BcryptHasher.js';
import { HmacIndex } from '@/infrastructure/crypto/HmacIndex.js';
import { JwtSigner } from '@/infrastructure/crypto/JwtSigner.js';
import { createSequelize } from '@/infrastructure/db/sequelize.js';
import { buildApp } from '@/infrastructure/http/server.js';
import { SequelizeUserRepository } from '@/infrastructure/repositories/SequelizeUserRepository.js';
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
  const passwords = new BcryptHasher(12);
  const cpfCipher = new AesGcmCipher(env.LGPD_DATA_KEY);
  const cpfIndex = new HmacIndex(env.LGPD_HMAC_PEPPER);
  const tokens = new JwtSigner({ secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN });
  const clock = new SystemClock();

  const registerUser = new RegisterUser({ users, passwords, cpfCipher, cpfIndex, tokens, clock });
  const authenticateUser = new AuthenticateUser({ users, passwords, tokens });

  const app = buildApp({
    authController: new AuthController(registerUser, authenticateUser),
    meController: new MeController(users),
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
