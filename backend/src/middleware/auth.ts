import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { errorResponse } from '../utils/apiResponse';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json(errorResponse('UNAUTHENTICATED', 'Authentication required'));
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json(errorResponse('UNAUTHENTICATED', 'Invalid or expired token'));
  }

  req.user = payload;
  next();
};

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('UNAUTHENTICATED', 'Authentication required'));
    }

    if (req.user.role !== role) {
      return res.status(403).json(errorResponse('FORBIDDEN', 'Insufficient permissions'));
    }

    next();
  };
};
