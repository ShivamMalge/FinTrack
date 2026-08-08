import { Request, Response, NextFunction } from 'express';
import { getAllUsersService } from './service';
import { successResponse } from '../../utils/apiResponse';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await getAllUsersService();
    res.status(200).json(successResponse({ users }));
  } catch (error: any) {
    next(error);
  }
};
