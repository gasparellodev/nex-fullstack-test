import { describe, expect, it } from 'vitest';
import { HmacIndex } from '@/infrastructure/crypto/HmacIndex.js';

describe('HmacIndex', () => {
  const pepper = 'a'.repeat(32);

  it('produces 64 hex characters', () => {
    const hash = new HmacIndex(pepper).compute('52998224725');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for identical inputs', () => {
    const idx = new HmacIndex(pepper);
    expect(idx.compute('52998224725')).toBe(idx.compute('52998224725'));
  });

  it('differs for different inputs', () => {
    const idx = new HmacIndex(pepper);
    expect(idx.compute('52998224725')).not.toBe(idx.compute('52998224726'));
  });

  it('differs for different peppers', () => {
    const a = new HmacIndex(pepper).compute('52998224725');
    const b = new HmacIndex('b'.repeat(32)).compute('52998224725');
    expect(a).not.toBe(b);
  });

  it('rejects short peppers', () => {
    expect(() => new HmacIndex('short')).toThrow();
  });
});
