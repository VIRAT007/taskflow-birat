import { afterAll, beforeEach } from 'vitest';

import { disconnectPrisma, prisma } from '../../src/lib/prisma';

beforeEach(async () => {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await disconnectPrisma();
});
