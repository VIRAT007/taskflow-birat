import { config } from 'dotenv';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

export default async function globalSetup(): Promise<void> {
  config({ path: resolve(process.cwd(), '.env.test') });
  process.env['NODE_ENV'] = 'test';

  if (!process.env['DATABASE_URL']?.trim()) {
    throw new Error('DATABASE_URL is missing. Copy .env.test.example to .env.test and point it at a test database.');
  }

  // Use `db push` so the test database always matches `schema.prisma` without requiring
  // every schema tweak to have a checked-in migration (migrations are still used in dev/prod).
  execSync('npx prisma db push', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
  });
}
