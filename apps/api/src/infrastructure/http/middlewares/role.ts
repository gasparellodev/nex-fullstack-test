import type { RequestHandler } from 'express';
import type { UserRole } from '@nex/shared';
import { ForbiddenError, UnauthorizedError } from '@/shared/errors.js';

export function requireRole(...allowed: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) return next(new UnauthorizedError('authentication required'));
    if (!allowed.includes(req.auth.role)) {
      return next(new ForbiddenError('insufficient role'));
    }
    next();
  };
}
