import type { RequestHandler } from 'express';

export const requestLogMiddleware: RequestHandler = (req, res, next) => {
  res.on('finish', () => {
    const payload = {
      event: 'request_complete',
      requestId: req.requestId,
      route: `${req.method} ${req.originalUrl}`,
      userId: req.user?.user_id,
      statusCode: res.statusCode,
    };
    const log = req.log;
    if (!log) {
      return;
    }
    if (res.statusCode >= 500) {
      log.warn(payload, 'request_completed_with_server_error');
    } else {
      log.info(payload, 'request_completed');
    }
  });
  next();
};
