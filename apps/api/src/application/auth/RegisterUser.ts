import { randomUUID } from 'node:crypto';
import type { ICpfCipher } from '@/domain/ports/ICpfCipher.js';
import type { ICpfIndex } from '@/domain/ports/ICpfIndex.js';
import type { IPasswordHasher } from '@/domain/ports/IPasswordHasher.js';
import type { ITokenSigner } from '@/domain/ports/ITokenSigner.js';
import type { IUserRepository } from '@/domain/repositories/IUserRepository.js';
import { ConflictError, UnprocessableError, ValidationError } from '@/shared/errors.js';
import { isValidCpf, normalizeCpf } from '@/shared/cpf.js';
import { type IClock } from '@/shared/clock.js';
import type { AuthResponseDto } from '@nex/shared';

export interface RegisterUserInput {
  name: string;
  email: string;
  cpf: string;
  password: string;
  consent: boolean;
}

export interface RegisterUserDeps {
  users: IUserRepository;
  passwords: IPasswordHasher;
  cpfCipher: ICpfCipher;
  cpfIndex: ICpfIndex;
  tokens: ITokenSigner;
  clock: IClock;
}

const MIN_PASSWORD_LENGTH = 8;

export class RegisterUser {
  constructor(private readonly deps: RegisterUserDeps) {}

  async execute(input: RegisterUserInput): Promise<AuthResponseDto> {
    if (!input.consent) {
      throw new UnprocessableError(
        'consent to data processing is required to register',
        { field: 'consent' },
      );
    }
    if (input.password.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError('password must be at least 8 characters', {
        field: 'password',
      });
    }

    const email = input.email.trim().toLowerCase();
    const cpfDigits = normalizeCpf(input.cpf);
    if (!isValidCpf(cpfDigits)) {
      throw new ValidationError('invalid CPF', { field: 'cpf' });
    }
    const cpfHash = this.deps.cpfIndex.compute(cpfDigits);

    const [byEmail, byCpf] = await Promise.all([
      this.deps.users.findByEmail(email),
      this.deps.users.findByCpfHash(cpfHash),
    ]);
    if (byEmail) throw new ConflictError('email already registered', { field: 'email' });
    if (byCpf) throw new ConflictError('CPF already registered', { field: 'cpf' });

    const passwordHash = await this.deps.passwords.hash(input.password);
    const cpfEncrypted = this.deps.cpfCipher.encrypt(cpfDigits);

    const user = await this.deps.users.create({
      id: randomUUID(),
      name: input.name.trim(),
      email,
      cpfEncrypted,
      cpfHash,
      passwordHash,
      role: 'user',
      consentAt: this.deps.clock.now(),
    });

    const { token, expiresIn } = this.deps.tokens.sign({
      sub: user.id,
      role: user.role,
    });

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
      expiresIn,
    };
  }
}
