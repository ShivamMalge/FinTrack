import { Request, Response, NextFunction } from 'express';
import { getSummary } from './service';
import { successResponse } from '../../utils/apiResponse';

export const getSummaryData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { from, to } = req.query as { from?: string, to?: string };
    
    const summary = await getSummary(userId, from, to);
    res.status(200).json(successResponse(summary));
  } catch (error) {
    next(error);
  }
};
