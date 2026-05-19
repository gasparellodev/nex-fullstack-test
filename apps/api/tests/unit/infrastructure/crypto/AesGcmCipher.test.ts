import { describe, expect, it } from 'vitest';
import { AesGcmCipher } from '@/infrastructure/crypto/AesGcmCipher.js';

const KEY_A = '0'.repeat(64);
const KEY_B = '1'.repeat(64);

describe('AesGcmCipher', () => {
  it('round-trips a plaintext', () => {
    const cipher = new AesGcmCipher(KEY_A);
    const blob = cipher.encrypt('52998224725');
    expect(cipher.decrypt(blob)).toBe('52998224725');
  });

  it('produces a different ciphertext every call (fresh IV)', () => {
    const cipher = new AesGcmCipher(KEY_A);
    const a = cipher.encrypt('52998224725');
    const b = cipher.encrypt('52998224725');
    expect(a.equals(b)).toBe(false);
  });

  it('detects tampering via the auth tag', () => {
    const cipher = new AesGcmCipher(KEY_A);
    const blob = cipher.encrypt('52998224725');
    const lastIndex = blob.length - 1;
    blob.writeUInt8(blob.readUInt8(lastIndex) ^ 0x01, lastIndex);
    expect(() => cipher.decrypt(blob)).toThrow();
  });

  it('fails to decrypt with the wrong key', () => {
    const blob = new AesGcmCipher(KEY_A).encrypt('52998224725');
    expect(() => new AesGcmCipher(KEY_B).decrypt(blob)).toThrow();
  });

  it('rejects malformed keys', () => {
    expect(() => new AesGcmCipher('too short')).toThrow();
    expect(() => new AesGcmCipher('Z'.repeat(64))).toThrow();
  });

  it('rejects truncated blobs', () => {
    const cipher = new AesGcmCipher(KEY_A);
    expect(() => cipher.decrypt(Buffer.alloc(5))).toThrow();
  });
});
