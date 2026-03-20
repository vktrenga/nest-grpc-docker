# ---------- BUILD ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps (cached)
COPY package*.json ./
RUN npm ci

# Copy source
COPY apps/auth-service ./apps/auth-service
COPY libs ./libs
COPY tsconfig*.json ./

# Build
RUN npm run build auth-service


# ---------- PRODUCTION ----------
FROM node:20-alpine

WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built output only
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "dist/apps/auth-service/src/main.js"]