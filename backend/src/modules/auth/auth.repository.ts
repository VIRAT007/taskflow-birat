import { prisma } from '../../lib/prisma';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

export function createAuthRepository() {
  return {
    async findByEmail(email: string) {
      return prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, password: true },
      });
    },

    async createUser(data: CreateUserData) {
      return prisma.user.create({
        data,
        select: { id: true, name: true, email: true },
      });
    },
  };
}

export type AuthRepository = ReturnType<typeof createAuthRepository>;
