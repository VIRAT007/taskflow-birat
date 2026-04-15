import { config } from 'dotenv';
import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

config({ path: resolve(process.cwd(), '.env.test') });
process.env['NODE_ENV'] = 'test';

if (!process.env['DATABASE_URL']?.trim()) {
  throw new Error(
    'Missing DATABASE_URL for integration tests. Copy backend/.env.test.example to backend/.env.test (gitignored) and point it at an isolated database or Postgres schema.',
  );
}

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    globals: false,
    include: ['tests/integration/**/*.test.ts'],
    globalSetup: ['./tests/integration/global-setup.ts'],
    setupFiles: ['./tests/integration/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    passWithNoTests: false,
  },
});
