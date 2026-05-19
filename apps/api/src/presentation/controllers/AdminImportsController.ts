import type { NextFunction, Request, Response } from 'express';
import type { ImportSpreadsheet } from '@/application/transactions/ImportSpreadsheet.js';
import { UnprocessableError } from '@/shared/errors.js';

export class AdminImportsController {
  constructor(private readonly importSpreadsheet: ImportSpreadsheet) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      if (!file) throw new UnprocessableError('file is required', { field: 'file' });
      if (!req.auth) throw new UnprocessableError('authentication required');

      const result = await this.importSpreadsheet.execute({
        adminId: req.auth.sub,
        filename: file.originalname,
        buffer: file.buffer,
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
