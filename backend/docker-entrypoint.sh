#!/bin/sh
set -e
cd /app

AP="${TASKFLOW_API_PORT:-3000}"
printf 'TASKFLOW API (from host): http://localhost:%s\n' "$AP"

echo "Running Prisma migrations..."
npm run db:migrate:deploy

if [ "${RUN_SEED}" = "true" ]; then
  echo "Running database seed..."
  npm run db:seed
fi

exec node dist/server.js
