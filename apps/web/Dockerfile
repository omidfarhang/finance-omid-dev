# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build
# Match root packageManager via Corepack (avoids npm allowScripts noise for global pnpm).
RUN corepack enable && corepack prepare pnpm@12.16.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY scripts/inject-primeng-license.mjs ./scripts/
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
COPY apps/web ./apps/web

# Community/commercial PrimeUI key — bake into the SPA at build time (offline verify).
ARG PRIMENG_LICENSE=
ENV PRIMENG_LICENSE=$PRIMENG_LICENSE

RUN pnpm install --frozen-lockfile --filter @finance/web...
RUN pnpm --filter @finance/shared build
RUN pnpm --filter @finance/web build

FROM nginx:1.27-alpine AS runtime
COPY apps/web/docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/apps/web/dist/web/browser /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
