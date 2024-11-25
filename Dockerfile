# syntax=docker/dockerfile:1.4
FROM node:20-alpine3.20 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:20-alpine3.20 AS runtime
WORKDIR /app
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/package.json package.json
COPY --from=build /app/dist /app/dist

# Include migration files and config
COPY drizzle /app/drizzle
COPY drizzle.config.ts /app/drizzle.config.ts

CMD ["sh", "-c", "npx drizzle-kit migrate && node dist/src/main.js"]
