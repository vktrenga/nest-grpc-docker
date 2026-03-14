# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Expose default port (NestJS usually 3000, can be changed as needed)
EXPOSE 3000

# Start all services
CMD ["npm", "run", "run:all"]
