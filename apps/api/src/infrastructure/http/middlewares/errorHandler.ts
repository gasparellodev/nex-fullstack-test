import type { ErrorRequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import type { Logger } from 'pino';
import { AppError, ValidationError } from '@/shared/errors.js';

export function buildErrorHandler(logger: Logger): ErrorRequestHandler {
  return (err, req, res, _next) => {
    if (err instanceof ZodError) {
      const ve = new ValidationError('invalid request payload', {
        fields: err.issues.map((i) => ({ path: i.path, message: i.message })),
      });
      respond(res, ve);
      return;
    }

    if (err instanceof AppError) {
      respond(res, err);
      return;
    }

    logger.error({ err, path: req.path }, 'unhandled error');
    res.status(500).json({
      code: 'internal_error',
      message: 'unexpected server error',
    });
  };
}

function respond(res: Response, err: AppError): void {
  res.status(err.status).json({
    code: err.code,
    message: err.message,
    ...(err.details !== undefined ? { details: err.details } : {}),
  });
}
