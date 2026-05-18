import type { Request, Response, NextFunction } from 'express';
import type { RegisterUser } from '@/application/auth/RegisterUser.js';
import type { AuthenticateUser } from '@/application/auth/AuthenticateUser.js';
import { LoginBodySchema, RegisterBodySchema } from '@/presentation/schemas/auth.schemas.js';

export class AuthController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly authenticateUser: AuthenticateUser,
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = RegisterBodySchema.parse(req.body);
      const result = await this.registerUser.execute(body);
      res.status(201).location('/api/me').json(result);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = LoginBodySchema.parse(req.body);
      const result = await this.authenticateUser.execute(body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
