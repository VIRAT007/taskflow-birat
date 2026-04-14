import type { RequestHandler } from 'express';

import { ValidationError } from '../../lib/httpError';
import { createAuthRepository } from './auth.repository';
import { createAuthService } from './auth.service';
import { loginSchema, registerSchema } from './auth.schema';

const repository = createAuthRepository();
const authService = createAuthService(repository);

export const register: RequestHandler = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      next(new ValidationError('Validation failed', parsed.error.flatten()));
      return;
    }
    const result = await authService.register(parsed.data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      next(new ValidationError('Validation failed', parsed.error.flatten()));
      return;
    }
    const result = await authService.login(parsed.data);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
