# syntax=docker/dockerfile:1

FROM node:24-alpine AS builder

WORKDIR /repo

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @pomodoro/shared build \
 && pnpm --filter @pomodoro/api build

RUN pnpm --filter @pomodoro/api --prod deploy --legacy /out

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY --from=builder --chown=node:node /out ./
COPY --from=builder --chown=node:node /repo/apps/api/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main"]
