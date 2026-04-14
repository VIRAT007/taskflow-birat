import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

import { ConflictError, UnauthorizedError } from '../../lib/httpError';
import { getEnv } from '../../lib/env';
import type { AuthRepository } from './auth.repository';
import type { LoginInput, RegisterInput } from './auth.schema';

const BCRYPT_COST = 12;
const JWT_EXPIRES = '24h' as const;

export interface AuthUserPublic {
  id: string;
  name: string;
  email: string;
}

export interface AuthResult {
  token: string;
  user: AuthUserPublic;
}

function signAccessToken(userId: string, email: string): string {
  const { JWT_SECRET } = getEnv();
  return jwt.sign({ user_id: userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function createAuthService(repository: AuthRepository) {
  return {
    async register(input: RegisterInput): Promise<AuthResult> {
      const existing = await repository.findByEmail(input.email);
      if (existing) {
        throw new ConflictError('Email already registered');
      }

      const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

      try {
        const user = await repository.createUser({
          name: input.name,
          email: input.email,
          password: passwordHash,
        });
        return {
          token: signAccessToken(user.id, user.email),
          user,
        };
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          throw new ConflictError('Email already registered');
        }
        throw err;
      }
    },

    async login(input: LoginInput): Promise<AuthResult> {
      const record = await repository.findByEmail(input.email);
      if (!record) {
        throw new UnauthorizedError('Invalid credentials');
      }

      const valid = await bcrypt.compare(input.password, record.password);
      if (!valid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      return {
        token: signAccessToken(record.id, record.email),
        user: { id: record.id, name: record.name, email: record.email },
      };
    },
  };
}
