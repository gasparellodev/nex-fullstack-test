import { describe, expect, it } from 'vitest';
import { LoginSchema, RegisterSchema } from './schemas';

describe('LoginSchema', () => {
  it('accepts a valid payload', () => {
    expect(LoginSchema.parse({ email: 'a@b.com', password: 'x' })).toEqual({
      email: 'a@b.com',
      password: 'x',
    });
  });

  it('rejects malformed email', () => {
    expect(() => LoginSchema.parse({ email: 'not-an-email', password: 'x' })).toThrow();
  });
});

describe('RegisterSchema', () => {
  const base = {
    name: 'Ana Silva',
    email: 'ana@example.com',
    cpf: '282.279.300-00',
    password: 'correct-horse',
    passwordConfirmation: 'correct-horse',
    consent: true,
  };

  it('accepts a valid payload and normalises the CPF', () => {
    const result = RegisterSchema.parse(base);
    expect(result.cpf).toBe('28227930000');
  });

  it('rejects invalid CPF', () => {
    expect(() => RegisterSchema.parse({ ...base, cpf: '111.111.111-11' })).toThrow();
  });

  it('requires matching passwords', () => {
    expect(() =>
      RegisterSchema.parse({ ...base, passwordConfirmation: 'different' }),
    ).toThrow();
  });

  it('requires consent', () => {
    expect(() => RegisterSchema.parse({ ...base, consent: false })).toThrow();
  });
});
