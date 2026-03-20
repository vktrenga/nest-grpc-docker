# ---------- BUILD ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only package files first (for caching)
COPY package*.json ./
RUN npm install

# Copy only required source
COPY apps/product-service ./apps/product-service
COPY libs ./libs
COPY tsconfig*.json ./

# Build
RUN npx nest build product-service

# ---------- PRODUCTION ----------
FROM node:20-alpine

WORKDIR /app

# Copy only production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built output
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/libs ./libs

ENV NODE_ENV=production


CMD ["node", "dist/apps/product-service/src/main.js"]
