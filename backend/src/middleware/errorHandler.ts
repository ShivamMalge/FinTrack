import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/apiResponse';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  if (err.name === 'ZodError') {
    return res.status(400).json(errorResponse('VALIDATION_ERROR', err.errors[0].message));
  }

  return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Internal Server Error'));
};
