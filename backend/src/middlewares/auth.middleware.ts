import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

import { getEnv } from '../lib/env';
import { UnauthorizedError } from '../lib/httpError';

interface AccessTokenPayload {
  user_id: string;
  email: string;
}

export const authMiddleware: RequestHandler = (req, _res, next) => {
  const raw = req.headers.authorization;
  if (!raw?.startsWith('Bearer ')) {
    next(new UnauthorizedError());
    return;
  }

  const token = raw.slice('Bearer '.length).trim();
  if (!token) {
    next(new UnauthorizedError());
    return;
  }

  try {
    const { JWT_SECRET } = getEnv();
    const decoded = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
    if (typeof decoded.user_id !== 'string' || typeof decoded.email !== 'string') {
      next(new UnauthorizedError());
      return;
    }
    req.user = { user_id: decoded.user_id, email: decoded.email };
    next();
  } catch {
    next(new UnauthorizedError());
  }
};
