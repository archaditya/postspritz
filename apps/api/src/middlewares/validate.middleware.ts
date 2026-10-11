import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodIssue } from 'zod';

export interface ValidationSchemas {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

/**
 * Composite Validator Middleware:
 * Atomically validates body, query, and params in one pass.
 * Collects all issues across all three locations and returns structured 422 errors.
 */
export const validate = (schemas: ValidationSchemas) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const allIssues: ZodIssue[] = [];

    if (schemas.params) {
      try {
        req.params = (await schemas.params.parseAsync(req.params)) as any;
      } catch (err: any) {
        if (err instanceof ZodError) {
          allIssues.push(
            ...err.issues.map((i) => ({
              ...i,
              path: ['params', ...i.path]
            }))
          );
        } else {
          return next(err);
        }
      }
    }

    if (schemas.query) {
      try {
        req.query = (await schemas.query.parseAsync(req.query)) as any;
      } catch (err: any) {
        if (err instanceof ZodError) {
          allIssues.push(
            ...err.issues.map((i) => ({
              ...i,
              path: ['query', ...i.path]
            }))
          );
        } else {
          return next(err);
        }
      }
    }

    if (schemas.body) {
      try {
        req.body = await schemas.body.parseAsync(req.body);
      } catch (err: any) {
        if (err instanceof ZodError) {
          allIssues.push(
            ...err.issues.map((i) => ({
              ...i,
              path: ['body', ...i.path]
            }))
          );
        } else {
          return next(err);
        }
      }
    }

    if (allIssues.length > 0) {
      const compositeError = new ZodError(allIssues);
      return next(compositeError);
    }

    next();
  };
};

export const validateBody = (schema: AnyZodObject) => validate({ body: schema });
export const validateQuery = (schema: AnyZodObject) => validate({ query: schema });
export const validateParams = (schema: AnyZodObject) => validate({ params: schema });
export const validateRequest = validateBody;
