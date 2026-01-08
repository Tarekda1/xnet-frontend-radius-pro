# Multi-stage Dockerfile for React + Vite + TypeScript

# Build stage
FROM node:20-alpine AS builder

# Add dependencies for npm performance
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Build-time env (Vite only reads VITE_* at build time)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Install dependencies separately to improve build caching
COPY package.json package-lock.json* ./
RUN npm ci || npm install

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