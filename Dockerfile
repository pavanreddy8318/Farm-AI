# ---------------------------------------------------------------------------
# FarmAI Web App (Node/Express + Vite build)
# Multi-stage build: compile frontend + backend bundle, run minimal runtime.
# ---------------------------------------------------------------------------

# ---------- Stage 1: Dependencies ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY bun.lock* ./
RUN npm ci --no-audit --no-fund

# ---------- Stage 2: Build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build React app (vite) and bundle the Express server (esbuild -> dist/server.cjs)
RUN npm run build

# ---------- Stage 3: Runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/public ./public
# Writable uploads directory (leaf images / object store)
RUN mkdir -p /app/public/uploads

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]
