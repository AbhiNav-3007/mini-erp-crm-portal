# Dockerfile for Node.js Express Backend
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build TypeScript
COPY . .
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

# Copy compiled assets from builder
COPY --from=builder /app/dist ./dist
COPY schema.sql ./

EXPOSE 5001

CMD ["npm", "start"]
