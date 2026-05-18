import { createHmac } from 'node:crypto';
import type { ICpfIndex } from '@/domain/ports/ICpfIndex.js';

/**
 * Deterministic HMAC-SHA256 over the input, hex-encoded.
 * Used as the `cpf_hash` unique column so the API can look up users by CPF
 * without ever storing the plaintext in MySQL.
 */
export class HmacIndex implements ICpfIndex {
  constructor(private readonly pepper: string) {
    if (pepper.length < 16) {
      throw new Error('HmacIndex pepper must be at least 16 characters');
    }
  }

  compute(input: string): string {
    return createHmac('sha256', this.pepper).update(input, 'utf8').digest('hex');
  }
}
