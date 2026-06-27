# ═══════════════════════════════════════════════════════════
# QA Forge — Frontend Production Dockerfile (Multi-Stage)
# ═══════════════════════════════════════════════════════════

# ─── Stage 1: Dependencies ───────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ─── Stage 2: Build ──────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js inlines NEXT_PUBLIC_* at build time — must be set before `npm run build`
ARG NEXT_PUBLIC_API_URL=http://101.32.243.235:4000/api/v1
ARG NEXT_PUBLIC_WS_URL=ws://101.32.243.235:4000
ARG NEXT_PUBLIC_APP_NAME=QA Forge
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Stage 3: Production Runtime ─────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 qaforge && \
    adduser --system --uid 1001 qaforge

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN chown -R qaforge:qaforge /app
USER qaforge

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
