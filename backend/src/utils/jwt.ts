import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secret';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

export interface JwtPayload {
  id: string;
  role: string;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN as any });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch (err) {
    return null;
  }
};
