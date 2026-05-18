import type { RequestHandler } from 'express';
import type { ITokenSigner, TokenPayload } from '@/domain/ports/ITokenSigner.js';
import { UnauthorizedError } from '@/shared/errors.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: TokenPayload;
    }
  }
}

const BEARER_PREFIX = 'Bearer ';

export function buildAuthMiddleware(tokens: ITokenSigner): RequestHandler {
  return (req, _res, next) => {
    try {
      const header = req.headers.authorization ?? '';
      if (!header.startsWith(BEARER_PREFIX)) {
        throw new UnauthorizedError('missing bearer token');
      }
      const token = header.slice(BEARER_PREFIX.length).trim();
      if (!token) throw new UnauthorizedError('missing bearer token');
      req.auth = tokens.verify(token);
      next();
    } catch (err) {
      next(err);
    }
  };
}
