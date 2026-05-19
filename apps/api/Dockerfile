# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NODE_ENV=development
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy workspace manifests first for better caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

RUN pnpm install --filter @nex/api... --frozen-lockfile=false

COPY packages/shared packages/shared
COPY apps/api apps/api

# ---- dev target ----
FROM base AS dev
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["pnpm", "dev"]

# ---- build / prod ----
FROM base AS build
RUN pnpm --filter @nex/api build

FROM node:20-bookworm-slim AS prod
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
