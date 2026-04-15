#!/bin/sh
set -e
cd /app

echo "Running Prisma migrations..."
npm run db:migrate:deploy

if [ "${RUN_SEED}" = "true" ]; then
  echo "Running database seed..."
  npm run db:seed
fi

exec node dist/server.js
