export type AppErrorCode =
  | 'validation_failed'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'unprocessable'
  | 'internal_error';

export abstract class AppError extends Error {
  abstract readonly status: number;
  abstract readonly code: AppErrorCode;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    if (details !== undefined) this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  readonly status = 400;
  readonly code = 'validation_failed';
}

export class UnauthorizedError extends AppError {
  readonly status = 401;
  readonly code = 'unauthorized';
}

export class ForbiddenError extends AppError {
  readonly status = 403;
  readonly code = 'forbidden';
}

export class NotFoundError extends AppError {
  readonly status = 404;
  readonly code = 'not_found';
}

export class ConflictError extends AppError {
  readonly status = 409;
  readonly code = 'conflict';
}

export class UnprocessableError extends AppError {
  readonly status = 422;
  readonly code = 'unprocessable';
}
