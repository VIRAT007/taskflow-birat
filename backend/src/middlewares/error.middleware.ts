import type { ErrorRequestHandler } from 'express';

import { isHttpError } from '../lib/httpError';
import { logger } from '../lib/logger';

export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  void next;
  const requestId = req.requestId ?? 'unknown';
  const route = `${req.method} ${req.originalUrl}`;
  const userId = req.user?.user_id;
  const log = req.log ?? logger.child({ requestId });

  // express.json / body-parser: invalid JSON is a SyntaxError with status 400
  const maybeJsonBodyErr = err as unknown as { statusCode?: number };
  if (err instanceof SyntaxError && maybeJsonBodyErr.statusCode === 400) {
    log.warn({ err: { name: err.name, message: err.message }, route, userId }, 'invalid_json_body');
    res.status(400).json({
      requestId,
      error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' },
    });
    return;
  }

  if (isHttpError(err) && err.statusCode >= 400 && err.statusCode < 500) {
    log.warn(
      {
        err: { name: err.name, code: err.code, message: err.message },
        route,
        userId,
      },
      'client_error',
    );
    const errorObj: Record<string, unknown> = {
      code: err.code,
      message: err.message,
    };
    if (err.details !== undefined) {
      errorObj['details'] = err.details;
    }
    res.status(err.statusCode).json({ requestId, error: errorObj });
    return;
  }

  log.error({ err, route, userId }, 'unhandled_error');

  res.status(500).json({
    requestId,
    error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' },
  });
};
