import type { RequestHandler } from 'express';

/** Browsers treat localhost vs 127.0.0.1 (and different ports) as different origins. */
const LOCAL_DEV_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function extraOrigins(): string[] {
  const raw = process.env['CORS_ORIGINS'];
  if (!raw?.trim()) {
    return [];
  }
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

function isAllowedOrigin(origin: string): boolean {
  if (LOCAL_DEV_ORIGIN.test(origin)) {
    return true;
  }
  return extraOrigins().includes(origin);
}

export const corsMiddleware: RequestHandler = (req, res, next) => {
  const origin = req.header('Origin');
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
};
