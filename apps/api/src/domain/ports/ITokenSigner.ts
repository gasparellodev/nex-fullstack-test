import type { UserRole } from '@nex/shared';

export interface TokenPayload {
  sub: string;
  role: UserRole;
}

export interface SignedToken {
  token: string;
  expiresIn: string;
}

export interface ITokenSigner {
  sign(payload: TokenPayload): SignedToken;
  verify(token: string): TokenPayload;
}
