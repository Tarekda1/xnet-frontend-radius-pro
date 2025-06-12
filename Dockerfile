# Multi-stage Dockerfile for React + Vite + TypeScript

# Build stage
FROM node:20-alpine AS builder

# Add dependencies for npm performance
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Configure npm for better performance
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set fetch-retries 3 && \
    npm config set fetch-retry-mintimeout 5000 && \
    npm config set fetch-retry-maxtimeout 60000

# Install dependencies
COPY package*.json ./
RUN npm install --prefer-offline --no-audit --no-fund --production

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine-slim

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
RUN apk add --no-cache wget

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 