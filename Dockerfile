# syntax=docker/dockerfile:1.4
FROM oven/bun:1.1.38-alpine AS base

WORKDIR /app

FROM base AS build
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=build /temp/dev/node_modules node_modules
COPY . .

FROM base AS release
COPY --from=build /temp/prod/node_modules node_modules
COPY --from=prerelease /app/ .

# Include migration files and config
COPY drizzle /app/drizzle
COPY drizzle.config.ts /app/drizzle.config.ts

USER bun
CMD ["sh", "-c", "bunx drizzle-kit migrate && bun src/main.ts"]
