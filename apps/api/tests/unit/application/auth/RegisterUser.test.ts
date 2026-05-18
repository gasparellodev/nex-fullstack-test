import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildAuthFixture,
  VALID_CPF_A,
  VALID_CPF_B,
  type AuthFixture,
} from '@tests/helpers/auth.fixture.js';
import { ConflictError, UnprocessableError, ValidationError } from '@/shared/errors.js';

describe('RegisterUser', () => {
  let f: AuthFixture;

  beforeEach(() => {
    f = buildAuthFixture();
  });

  function input(overrides: Partial<Parameters<typeof f.register.execute>[0]> = {}) {
    return {
      name: 'Ana Silva',
      email: 'ANA@example.com',
      cpf: VALID_CPF_A,
      password: 'correct-horse',
      consent: true,
      ...overrides,
    };
  }

  it('creates the user, hashes the password, encrypts the CPF and returns a token', async () => {
    const result = await f.register.execute(input());

    expect(result.user).toMatchObject({
      name: 'Ana Silva',
      email: 'ana@example.com',
      role: 'user',
    });
    expect(result.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(result.expiresIn).toBe('15m');

    const stored = await f.users.findByEmail('ana@example.com');
    expect(stored?.passwordHash).not.toBe('correct-horse');
    expect(stored?.passwordHash.startsWith('$2')).toBe(true);
    expect(stored?.cpfEncrypted.length).toBeGreaterThan(0);
    expect(stored?.cpfHash).toMatch(/^[0-9a-f]{64}$/);
    expect(stored?.consentAt).toEqual(f.clock.now());
  });

  it('rejects registration without consent', async () => {
    await expect(f.register.execute(input({ consent: false }))).rejects.toBeInstanceOf(
      UnprocessableError,
    );
  });

  it('rejects a short password', async () => {
    await expect(f.register.execute(input({ password: 'short' }))).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('rejects an invalid CPF', async () => {
    await expect(
      f.register.execute(input({ cpf: '111.111.111-11' })),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects duplicate email (case-insensitive)', async () => {
    await f.register.execute(input());
    await expect(
      f.register.execute(input({ email: 'Ana@Example.com', cpf: VALID_CPF_B })),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects duplicate CPF', async () => {
    await f.register.execute(input());
    await expect(
      f.register.execute(input({ email: 'other@example.com' })),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
