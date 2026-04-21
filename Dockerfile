# ─────────────────────────────────────────────────────────────────────────────
# FIX: Usar node:20-slim como base del builder para tener glibc moderno
# argon2 requiere GLIBC_2.34+ que bun:debian no tiene
# ─────────────────────────────────────────────────────────────────────────────

ARG BUN_VERSION=1.1.34
ARG NODE_VERSION=20

# ── STAGE 1: deps (node para compilar nativos, bun para instalar) ─────────────
FROM node:${NODE_VERSION}-slim AS deps
WORKDIR /app

# Instalar bun encima de node
RUN npm install -g bun@1.1.34

COPY package.json bun.lock* ./
# Instalar con bun pero compilar nativos con node/gcc
RUN bun install --frozen-lockfile

# ── STAGE 2: migrate ─────────────────────────────────────────────────────────
FROM deps AS migrate
COPY drizzle.config.ts .
COPY drizzle ./drizzle
COPY src ./src

# ── STAGE 3: builder ─────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN bun run db:generate
RUN bun run build

# ── STAGE 4: runner ──────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-slim AS runner
WORKDIR /app

RUN npm install -g bun@1.1.34

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/drizzle ./drizzle

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

CMD ["bun", "server.js"]
