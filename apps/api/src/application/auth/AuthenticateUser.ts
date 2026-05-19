import type { IPasswordHasher } from '@/domain/ports/IPasswordHasher.js';
import type { ITokenSigner } from '@/domain/ports/ITokenSigner.js';
import type { IUserRepository } from '@/domain/repositories/IUserRepository.js';
import { UnauthorizedError } from '@/shared/errors.js';
import type { AuthResponseDto } from '@nex/shared';

export interface AuthenticateUserInput {
  email: string;
  password: string;
}

export interface AuthenticateUserDeps {
  users: IUserRepository;
  passwords: IPasswordHasher;
  tokens: ITokenSigner;
}

const GENERIC_AUTH_ERROR = 'invalid email or password';

export class AuthenticateUser {
  constructor(private readonly deps: AuthenticateUserDeps) {}

  async execute(input: AuthenticateUserInput): Promise<AuthResponseDto> {
    const email = input.email.trim().toLowerCase();
    const user = await this.deps.users.findByEmail(email);
    if (!user || user.isDeleted) {
      throw new UnauthorizedError(GENERIC_AUTH_ERROR);
    }
    const ok = await this.deps.passwords.verify(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError(GENERIC_AUTH_ERROR);

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
