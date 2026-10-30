# syntax=docker/dockerfile:1

FROM node:26-bookworm-slim AS build
# Node 26+ slim images omit Corepack; install pnpm directly.
RUN npm install -g pnpm@9.15.0 \
  && apt-get update \
  && apt-get install -y --no-install-recommends openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
COPY apps/api/package.json apps/api/nest-cli.json apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/prisma.config.ts ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/src ./apps/api/src

RUN pnpm install --frozen-lockfile --filter @finance/api...
RUN pnpm --filter @finance/shared build
WORKDIR /app/apps/api
# prisma.config.ts requires DATABASE_URL at load time; generate does not connect.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
RUN pnpm exec prisma generate && pnpm run build

FROM node:26-bookworm-slim AS runtime
RUN npm install -g pnpm@9.15.0 \
  && apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/api/package.json /app/apps/api/nest-cli.json /app/apps/api/prisma.config.ts ./apps/api/
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /app/apps/api
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
