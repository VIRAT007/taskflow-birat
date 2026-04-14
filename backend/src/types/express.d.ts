import type { Logger } from 'pino';

export interface AuthUser {
  user_id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      /** Set by `requestContextMiddleware` when the app uses the default middleware stack. */
      requestId?: string;
      log?: Logger;
    }
  }
}

export {};
