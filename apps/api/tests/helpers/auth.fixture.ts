import { AuthenticateUser } from '@/application/auth/AuthenticateUser.js';
import { RegisterUser } from '@/application/auth/RegisterUser.js';
import { AesGcmCipher } from '@/infrastructure/crypto/AesGcmCipher.js';
import { BcryptHasher } from '@/infrastructure/crypto/BcryptHasher.js';
import { HmacIndex } from '@/infrastructure/crypto/HmacIndex.js';
import { JwtSigner } from '@/infrastructure/crypto/JwtSigner.js';
import { InMemoryUserRepository } from '@/infrastructure/repositories/InMemoryUserRepository.js';
import { FixedClock } from '@/shared/clock.js';

export interface AuthFixture {
  users: InMemoryUserRepository;
  register: RegisterUser;
  authenticate: AuthenticateUser;
  tokens: JwtSigner;
  clock: FixedClock;
}

export function buildAuthFixture(now = new Date('2026-05-18T12:00:00.000Z')): AuthFixture {
  const users = new InMemoryUserRepository();
  const passwords = new BcryptHasher(4);
  const cpfCipher = new AesGcmCipher('0'.repeat(64));
  const cpfIndex = new HmacIndex('a'.repeat(32));
  const tokens = new JwtSigner({
    secret: 'unit-test-secret-must-be-at-least-32-chars',
    expiresIn: '15m',
  });
  const clock = new FixedClock(now);

  return {
    users,
    register: new RegisterUser({ users, passwords, cpfCipher, cpfIndex, tokens, clock }),
    authenticate: new AuthenticateUser({ users, passwords, tokens }),
    tokens,
    clock,
  };
}

export const VALID_CPF_A = '52998224725';
export const VALID_CPF_B = '39053344705';
