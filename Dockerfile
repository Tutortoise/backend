# syntax=docker/dockerfile:1.4
FROM oven/bun:1.1.38-alpine AS base

WORKDIR /app

FROM base AS build
WORKDIR /temp/dev
COPY package.json bun.lockb ./
RUN --mount=type=cache,id=bun,target=/bun bun install --frozen-lockfile

WORKDIR /temp/prod
COPY package.json bun.lockb ./
RUN --mount=type=cache,id=bun,target=/bun bun install --frozen-lockfile --production

FROM base AS release
COPY --from=build /temp/prod/node_modules node_modules
COPY . .

USER bun
CMD ["sh", "-c", "bunx drizzle-kit migrate && bun src/main.ts"]
