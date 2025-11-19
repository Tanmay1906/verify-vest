import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export type JwtUser = {
  id: string;
  role: string;
  walletAddress?: string | null;
  email?: string | null;
  name?: string | null;
};

export function signJwt(user: JwtUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: Request & { user?: JwtUser }, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtUser;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

export function requireRole(roles: string[]) {
  return (req: Request & { user?: JwtUser }, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}
