import { randomUUID } from 'node:crypto';

import type { RequestHandler } from 'express';

import { logger } from '../lib/logger';

function readIncomingRequestId(header: unknown): string | undefined {
  if (typeof header === 'string' && header.trim().length > 0) {
    return header.trim();
  }
  if (Array.isArray(header) && typeof header[0] === 'string' && header[0].trim().length > 0) {
    return header[0].trim();
  }
  return undefined;
}

export const requestContextMiddleware: RequestHandler = (req, res, next) => {
  const requestId = readIncomingRequestId(req.headers['x-request-id']) ?? randomUUID();
  req.requestId = requestId;
  req.log = logger.child({ requestId });
  res.setHeader('x-request-id', requestId);
  next();
};
