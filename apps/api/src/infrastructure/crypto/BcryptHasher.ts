import bcrypt from 'bcryptjs';
import type { IPasswordHasher } from '@/domain/ports/IPasswordHasher.js';

export class BcryptHasher implements IPasswordHasher {
  constructor(private readonly cost = 12) {}

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.cost);
  }

  verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
