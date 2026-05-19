import { describe, expect, it } from 'vitest';
import { BcryptHasher } from '@/infrastructure/crypto/BcryptHasher.js';

describe('BcryptHasher', () => {
  const hasher = new BcryptHasher(4); // lower cost for unit-test speed

  it('produces a hash distinct from the plain text', async () => {
    const hash = await hasher.hash('s3cret-pa$$');
    expect(hash).not.toBe('s3cret-pa$$');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('verifies a correct password', async () => {
    const hash = await hasher.hash('right-password');
    expect(await hasher.verify('right-password', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hasher.hash('right-password');
    expect(await hasher.verify('wrong-password', hash)).toBe(false);
  });
});
