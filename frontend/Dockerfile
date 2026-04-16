# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts components.json ./
COPY public ./public
COPY src ./src

ARG VITE_SAME_ORIGIN_API=true
ENV VITE_SAME_ORIGIN_API=${VITE_SAME_ORIGIN_API}

RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Script is generated here so line endings stay LF (Windows CRLF breaks nginx entrypoint).
RUN printf '%s\n' \
  '#!/bin/sh' \
  'set -e' \
  'FP="${TASKFLOW_FRONTEND_PORT:-5173}"' \
  'AP="${TASKFLOW_API_PORT:-3000}"' \
  'echo ""' \
  'echo "== TASKFLOW =="' \
  'echo "App (open in browser): http://localhost:${FP}"' \
  'echo "API (direct): http://localhost:${AP}"' \
  'echo ""' \
  > /docker-entrypoint.d/40-taskflow-banner.sh \
  && chmod +x /docker-entrypoint.d/40-taskflow-banner.sh

EXPOSE 80
