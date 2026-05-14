import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' | 'all' = 'all') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      let data;
      if (source === 'body') {
        data = req.body;
      } else if (source === 'query') {
        data = req.query;
      } else if (source === 'params') {
        data = req.params;
      } else {
        data = {
          ...req.body,
          ...req.query,
          ...req.params,
        };
      }
      schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

