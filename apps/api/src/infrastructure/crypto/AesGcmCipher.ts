import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { ICpfCipher } from '@/domain/ports/ICpfCipher.js';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

/**
 * AES-256-GCM cipher producing self-contained blobs:
 *
 *   [ 12-byte IV ][ 16-byte auth tag ][ N-byte ciphertext ]
 *
 * A fresh IV is generated for every `encrypt` call to keep the keystream
 * unique per message. `decrypt` throws if the tag does not authenticate.
 */
export class AesGcmCipher implements ICpfCipher {
  private readonly key: Buffer;

  constructor(keyHex: string) {
    if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
      throw new Error('AesGcmCipher key must be 64 hex characters (32 bytes)');
    }
    this.key = Buffer.from(keyHex, 'hex');
  }

  encrypt(plain: string): Buffer {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]);
  }

  decrypt(blob: Buffer): string {
    if (blob.length < IV_BYTES + TAG_BYTES) {
      throw new Error('AesGcmCipher: ciphertext blob too short');
    }
    const iv = blob.subarray(0, IV_BYTES);
    const tag = blob.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const ciphertext = blob.subarray(IV_BYTES + TAG_BYTES);

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }
}
