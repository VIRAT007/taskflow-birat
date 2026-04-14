import type { RequestHandler } from 'express';

import { NotFoundError } from '../lib/httpError';

export const notFoundMiddleware: RequestHandler = (_req, _res, next) => {
  next(new NotFoundError('Not Found'));
};
