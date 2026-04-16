# ─────────────────────────────────────────────────────────────────────────────
# Multistage Dockerfile — Boutique Hotels (Next.js 15 + BUN)
# Stages: base → deps → builder → runner
# ─────────────────────────────────────────────────────────────────────────────

ARG BUN_VERSION=1.1.34

# ── STAGE 1: base ────────────────────────────────────────────────────────────
FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# ── STAGE 2: deps (install all dependencies) ─────────────────────────────────
FROM base AS deps
COPY package.json bun.lock* ./ 
RUN bun install --frozen-lockfile

# ── STAGE 3: builder ─────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
# Generate Drizzle types before build
RUN bun run db:generate
# Build Next.js app (standalone output for smaller image)
RUN bun run build

# ── STAGE 4: runner (production image) ───────────────────────────────────────
FROM base AS runner
WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy only what's needed to run
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Drizzle migrations folder (needed at runtime by migrate container)
COPY --from=builder /app/drizzle ./drizzle

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# BUN runs the Next.js standalone server directly
CMD ["bun", "server.js"]
