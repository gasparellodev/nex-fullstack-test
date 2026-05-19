import jwt from 'jsonwebtoken';
import type {
  ITokenSigner,
  SignedToken,
  TokenPayload,
} from '@/domain/ports/ITokenSigner.js';
import { UnauthorizedError } from '@/shared/errors.js';
import type { UserRole } from '@nex/shared';

export interface JwtSignerOptions {
  secret: string;
  expiresIn: string;
}

export class JwtSigner implements ITokenSigner {
  constructor(private readonly options: JwtSignerOptions) {}

  sign(payload: TokenPayload): SignedToken {
    // jwt typings treat `expiresIn` as required when present in the literal,
    // so we build the options object dynamically to satisfy
    // `exactOptionalPropertyTypes`.
    const signOptions = {
      subject: payload.sub,
      algorithm: 'HS256' as const,
      expiresIn: this.options.expiresIn,
    } as jwt.SignOptions;
    const token = jwt.sign({ role: payload.role }, this.options.secret, signOptions);
    return { token, expiresIn: this.options.expiresIn };
  }

  verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.options.secret, {
        algorithms: ['HS256'],
      });
      if (typeof decoded === 'string' || !decoded.sub) {
        throw new UnauthorizedError('invalid token');
      }
      const role = (decoded as jwt.JwtPayload & { role?: UserRole }).role;
      if (role !== 'admin' && role !== 'user') {
        throw new UnauthorizedError('invalid token role');
      }
      return { sub: String(decoded.sub), role };
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError('invalid or expired token');
    }
  }
}
