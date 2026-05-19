# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NODE_ENV=development
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

RUN pnpm install --filter @nex/web... --frozen-lockfile=false

COPY packages/shared packages/shared
COPY apps/web apps/web

# ---- dev ----
FROM base AS dev
WORKDIR /app/apps/web
EXPOSE 5173
CMD ["pnpm", "dev"]

# ---- build ----
FROM base AS build
RUN pnpm --filter @nex/web build

FROM nginx:1.27-alpine AS prod
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
