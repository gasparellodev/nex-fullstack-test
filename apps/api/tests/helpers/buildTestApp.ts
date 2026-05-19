import type { Express } from 'express';
import pino from 'pino';
import { AuthenticateUser } from '@/application/auth/AuthenticateUser.js';
import { RegisterUser } from '@/application/auth/RegisterUser.js';
import { AesGcmCipher } from '@/infrastructure/crypto/AesGcmCipher.js';
import { BcryptHasher } from '@/infrastructure/crypto/BcryptHasher.js';
import { HmacIndex } from '@/infrastructure/crypto/HmacIndex.js';
import { JwtSigner } from '@/infrastructure/crypto/JwtSigner.js';
import { buildApp } from '@/infrastructure/http/server.js';
import { InMemoryUserRepository } from '@/infrastructure/repositories/InMemoryUserRepository.js';
import { AuthController } from '@/presentation/controllers/AuthController.js';
import { MeController } from '@/presentation/controllers/MeController.js';
import { SystemClock } from '@/shared/clock.js';

export interface TestAppHandle {
  app: Express;
  users: InMemoryUserRepository;
  tokens: JwtSigner;
}

export interface BuildTestAppOptions {
  rateLimitAuth?: number;
  rateLimitGlobal?: number;
}

export function buildTestApp(opts: BuildTestAppOptions = {}): TestAppHandle {
  const users = new InMemoryUserRepository();
  const passwords = new BcryptHasher(4);
  const cpfCipher = new AesGcmCipher('0'.repeat(64));
  const cpfIndex = new HmacIndex('a'.repeat(32));
  const tokens = new JwtSigner({
    secret: 'test-secret-must-be-at-least-32-characters-long',
    expiresIn: '15m',
  });
  const clock = new SystemClock();

  const register = new RegisterUser({ users, passwords, cpfCipher, cpfIndex, tokens, clock });
  const authenticate = new AuthenticateUser({ users, passwords, tokens });
  const logger = pino({ level: 'silent' });

  const app = buildApp({
    authController: new AuthController(register, authenticate),
    meController: new MeController(users),
    tokens,
    logger,
    corsOrigin: 'http://localhost:5173',
    rateLimitAuth: opts.rateLimitAuth ?? 100,
    rateLimitGlobal: opts.rateLimitGlobal ?? 1000,
  });

  return { app, users, tokens };
}
