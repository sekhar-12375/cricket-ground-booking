import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.AUTH_SECRET || 'cricket-ground-booking-super-secure-jwt-secret-key-2026';

export interface AuthPayload {
  userId: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch (err) {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'You are not authorized to access this resource. Please log in.',
      errorCode: 'UNAUTHORIZED'
    });
    return;
  }
  next();
}

export function requireUserRole(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'USER') {
    res.status(403).json({
      success: false,
      message: 'Forbidden. User role required.',
      errorCode: 'FORBIDDEN_USER_ONLY'
    });
    return;
  }
  next();
}

export function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Forbidden. Admin credentials required.',
      errorCode: 'FORBIDDEN_ADMIN_ONLY'
    });
    return;
  }
  next();
}
