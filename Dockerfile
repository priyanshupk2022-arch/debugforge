# Multi-Stage Production Dockerfile for ZeroShield
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json tsconfig.json ./
COPY packages/core/package*.json ./packages/core/
COPY packages/cli/package*.json ./packages/cli/
COPY packages/web/package*.json ./packages/web/

RUN npm install

# Copy source code and build
COPY . .
RUN npm run build
RUN npm --prefix packages/web run build

# Production Runner Stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copy compiled artifacts from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/core/package*.json ./packages/core/
COPY --from=builder /app/packages/cli/dist ./packages/cli/dist
COPY --from=builder /app/packages/cli/package*.json ./packages/cli/
COPY --from=builder /app/packages/web/dist ./packages/web/dist
COPY --from=builder /app/node_modules ./node_modules

# Non-root user execution
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/api/health || exit 1

ENTRYPOINT ["node", "packages/cli/dist/index.js", "serve", "--port", "3001"]
