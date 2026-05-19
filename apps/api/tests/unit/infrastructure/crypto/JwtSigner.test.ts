import { describe, expect, it } from 'vitest';
import { JwtSigner } from '@/infrastructure/crypto/JwtSigner.js';
import { UnauthorizedError } from '@/shared/errors.js';

const secret = 'unit-test-secret-must-be-at-least-32-chars';

describe('JwtSigner', () => {
  it('signs and verifies a payload', () => {
    const signer = new JwtSigner({ secret, expiresIn: '5m' });
    const { token } = signer.sign({ sub: 'user-1', role: 'user' });
    expect(signer.verify(token)).toEqual({ sub: 'user-1', role: 'user' });
  });

  it('rejects a tampered token', () => {
    const signer = new JwtSigner({ secret, expiresIn: '5m' });
    const { token } = signer.sign({ sub: 'user-1', role: 'user' });
    const tampered = token.slice(0, -2) + (token.endsWith('A') ? 'B' : 'A');
    expect(() => signer.verify(tampered)).toThrow(UnauthorizedError);
  });

  it('rejects an expired token', async () => {
    const signer = new JwtSigner({ secret, expiresIn: '1ms' });
    const { token } = signer.sign({ sub: 'user-1', role: 'admin' });
    await new Promise((r) => setTimeout(r, 20));
    expect(() => signer.verify(token)).toThrow(UnauthorizedError);
  });

  it('rejects a token signed with a different secret', () => {
    const signedElsewhere = new JwtSigner({
      secret: 'completely-different-secret-also-32',
      expiresIn: '5m',
    }).sign({ sub: 'user-1', role: 'user' });
    const verifier = new JwtSigner({ secret, expiresIn: '5m' });
    expect(() => verifier.verify(signedElsewhere.token)).toThrow(UnauthorizedError);
  });
});
