import type { UserRole } from '@nex/shared';
import type { User } from '@/domain/entities/User.js';

export interface CreateUserInput {
  id: string;
  name: string;
  email: string;
  cpfEncrypted: Buffer;
  cpfHash: string;
  passwordHash: string;
  role: UserRole;
  consentAt: Date;
}

export interface IUserRepository {
  create(input: CreateUserInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByCpfHash(cpfHash: string): Promise<User | null>;
  /** Anonymise the user in place (LGPD right of erasure). */
  anonymise(id: string, anonymisedEmail: string): Promise<void>;
}
