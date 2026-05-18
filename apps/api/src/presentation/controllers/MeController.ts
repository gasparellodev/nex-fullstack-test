import type { Request, Response, NextFunction } from 'express';
import type { IUserRepository } from '@/domain/repositories/IUserRepository.js';
import { NotFoundError, UnauthorizedError } from '@/shared/errors.js';

export class MeController {
  constructor(private readonly users: IUserRepository) {}

  show = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError('authentication required');
      const user = await this.users.findById(req.auth.sub);
      if (!user) throw new NotFoundError('user not found');
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        consentAt: user.consentAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };
}
