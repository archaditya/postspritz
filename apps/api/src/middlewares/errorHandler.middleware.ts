import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export interface ValidationErrorDetail {
  location: 'body' | 'query' | 'params' | 'headers' | 'unknown';
  field: string;
  message: string;
  type?: string;
}

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const reqId = (req.headers['x-request-id'] as string) || 'req_' + Date.now().toString(36);
  const timestamp = new Date().toISOString();

  // 1. Zod Schema Validation Errors (FastAPI / Pydantic style 422 Unprocessable Entity)
  if (err instanceof ZodError) {
    const details: ValidationErrorDetail[] = err.issues.map((issue) => {
      const pathParts = issue.path.map(String);
      let location: ValidationErrorDetail['location'] = 'body';

      if (pathParts[0] === 'query') {
        location = 'query';
        pathParts.shift();
      } else if (pathParts[0] === 'params') {
        location = 'params';
        pathParts.shift();
      } else if (pathParts[0] === 'headers') {
        location = 'headers';
        pathParts.shift();
      }

      return {
        location,
        field: pathParts.join('.') || 'root',
        message: issue.message,
        type: issue.code
      };
    });

    logger.warn({ reqId, path: req.path, method: req.method, issues: details }, 'Schema validation error');

    return res.status(422).json({
      success: false,
      statusCode: 422,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Validation failed: ${details.length} issue(s) detected in input parameters`,
        details,
        requestId: reqId,
        timestamp
      }
    });
  }

  // 2. Custom Application Errors (Domain business logic exceptions)
  if (err instanceof AppError) {
    logger.warn({ reqId, path: req.path, method: req.method, err: err.message, statusCode: err.statusCode, code: err.code }, 'Application error');
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      error: {
        code: err.code,
        message: err.message,
        details: err.details || null,
        requestId: reqId,
        timestamp
      }
    });
  }

  // 3. PostgreSQL Specific Error Interception (Safely translate DB constraints without leaking SQL traces)
  if (err.code && typeof err.code === 'string' && err.code.length === 5) {
    let pgStatus = 400;
    let pgCode = 'DATABASE_ERROR';
    let pgMsg = 'Database constraint violation occurred';

    if (err.code === '23505') {
      pgStatus = 409;
      pgCode = 'CONFLICT';
      pgMsg = 'A record with these unique identifiers already exists';
    } else if (err.code === '23503') {
      pgStatus = 400;
      pgCode = 'FOREIGN_KEY_VIOLATION';
      pgMsg = 'Referenced related record does not exist';
    }

    logger.error({ reqId, pgCode: err.code, message: err.message, detail: err.detail }, 'Database operation rejected');

    return res.status(pgStatus).json({
      success: false,
      statusCode: pgStatus,
      error: {
        code: pgCode,
        message: pgMsg,
        requestId: reqId,
        timestamp
      }
    });
  }

  // 4. Unhandled Internal Errors (500 Internal Server Error)
  // NEVER leak stack traces or raw details to client
  logger.error({ reqId, path: req.path, method: req.method, err: err.stack || err.message }, 'Unhandled internal server error');

  return res.status(500).json({
    success: false,
    statusCode: 500,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred. Our team has been notified.',
      requestId: reqId,
      timestamp
    }
  });
};
