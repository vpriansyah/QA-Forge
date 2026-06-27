# ═══════════════════════════════════════════════════════════
# QA Forge — Backend Production Dockerfile (Multi-Stage)
# ═══════════════════════════════════════════════════════════

# ─── Stage 1: Dependencies ───────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && cp -R node_modules /prod_modules
RUN npm ci

# ─── Stage 2: Build ──────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ─── Stage 3: Production Runtime ─────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Security: run as non-root user
RUN addgroup --system --gid 1001 qaforge && \
    adduser --system --uid 1001 qaforge

# Copy production dependencies
COPY --from=deps /prod_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Generate Prisma client for production
RUN npx prisma generate

# Change ownership
RUN chown -R qaforge:qaforge /app

USER qaforge

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
