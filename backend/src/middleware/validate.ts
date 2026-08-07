import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { errorResponse } from '../utils/apiResponse';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        const message = error.issues?.[0]?.message || error.errors?.[0]?.message || 'Validation failed';
        return res.status(400).json(errorResponse('VALIDATION_ERROR', message));
      }
      next(error);
    }
  };
};
