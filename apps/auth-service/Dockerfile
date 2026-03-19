# ---------- BUILD ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Step 1: Copy root package + tsconfig
COPY package*.json tsconfig*.json ./
RUN npm install

# Step 2: Copy service + shared libs
COPY apps/auth-service ./apps/auth-service
COPY libs ./libs
# COPY proto ./proto  # uncomment if needed

# Debug: check files
RUN ls -R /app
RUN ls -R /app/apps/auth-service
RUN ls -R /app/libs

# Step 3: Build the service
RUN npx nest build "auth-service"

# Debug: check dist
RUN ls -R /app/dist

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 8080
CMD ["node", "dist/apps/auth-service/src/main.js"]
