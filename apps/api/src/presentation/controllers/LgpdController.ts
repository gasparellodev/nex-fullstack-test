import type { NextFunction, Request, Response } from 'express';
import type { ExportUserData } from '@/application/lgpd/ExportUserData.js';
import type { DeleteUserAccount } from '@/application/lgpd/DeleteUserAccount.js';
import { UnauthorizedError } from '@/shared/errors.js';

export class LgpdController {
  constructor(
    private readonly exportUserData: ExportUserData,
    private readonly deleteUserAccount: DeleteUserAccount,
  ) {}

  export = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError('authentication required');
      const result = await this.exportUserData.execute(req.auth.sub);
      res
        .header('Content-Disposition', `attachment; filename="nex-export-${req.auth.sub}.json"`)
        .json(result);
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError('authentication required');
      const result = await this.deleteUserAccount.execute(req.auth.sub);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
