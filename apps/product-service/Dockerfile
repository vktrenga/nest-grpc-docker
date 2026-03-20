# ---------- BUILD ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (cached layer)
COPY package*.json ./
RUN npm ci

# Copy source
COPY apps/product-service ./apps/product-service
COPY libs ./libs
COPY tsconfig*.json ./

# Build (no npx)
RUN npm run build product-service


# ---------- PRODUCTION ----------
FROM node:20-alpine

WORKDIR /app

# Install ONLY production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "dist/apps/product-service/src/main.js"]
