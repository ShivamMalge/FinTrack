import { Request, Response, NextFunction } from 'express';
import { registerService, loginService } from './service';
import { successResponse, errorResponse } from '../../utils/apiResponse';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await registerService(req.body);
    res.status(201).json(successResponse({ user }));
  } catch (error: any) {
    if (error.message === 'CONFLICT') {
      res.status(409).json(errorResponse('CONFLICT', 'Email already exists'));
    } else {
      next(error);
    }
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, token } = await loginService(req.body);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    res.status(200).json(successResponse({ user }));
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') {
      res.status(401).json(errorResponse('UNAUTHENTICATED', 'Invalid credentials'));
    } else {
      next(error);
    }
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.status(200).json(successResponse({ success: true }));
};

export const me = (req: Request, res: Response) => {
  res.status(200).json(successResponse({ user: req.user }));
};
