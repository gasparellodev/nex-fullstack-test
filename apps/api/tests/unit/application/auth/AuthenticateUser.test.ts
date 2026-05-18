import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildAuthFixture,
  VALID_CPF_A,
  type AuthFixture,
} from '@tests/helpers/auth.fixture.js';
import { UnauthorizedError } from '@/shared/errors.js';

describe('AuthenticateUser', () => {
  let f: AuthFixture;

  beforeEach(async () => {
    f = buildAuthFixture();
    await f.register.execute({
      name: 'Ana Silva',
      email: 'ana@example.com',
      cpf: VALID_CPF_A,
      password: 'correct-horse',
      consent: true,
    });
  });

  it('returns user and token for valid credentials', async () => {
    const result = await f.authenticate.execute({
      email: 'ana@example.com',
      password: 'correct-horse',
    });
    expect(result.user.email).toBe('ana@example.com');
    expect(result.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });

  it('is case-insensitive on the email', async () => {
    const result = await f.authenticate.execute({
      email: 'ANA@Example.com',
      password: 'correct-horse',
    });
    expect(result.user.email).toBe('ana@example.com');
  });

  it('rejects wrong password with a generic 401', async () => {
    await expect(
      f.authenticate.execute({ email: 'ana@example.com', password: 'WRONG' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects unknown email with the same generic 401', async () => {
    await expect(
      f.authenticate.execute({ email: 'ghost@example.com', password: 'whatever' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects login on a soft-deleted account', async () => {
    const u = await f.users.findByEmail('ana@example.com');
    await f.users.anonymise(u!.id, 'deleted-x@nex.invalid');
    await expect(
      f.authenticate.execute({ email: 'ana@example.com', password: 'correct-horse' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
