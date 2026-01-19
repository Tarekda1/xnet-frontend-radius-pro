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
FROM nginxinc/nginx-unprivileged:stable-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Entrypoint to generate /env.js at runtime
USER root
RUN apk add --no-cache gettext wget \
  && chmod -R g=u /usr/share/nginx/html \
  && chown -R 101:101 /usr/share/nginx/html
COPY docker/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh \
  && chmod +x /entrypoint.sh \
  && chown 101:101 /entrypoint.sh
USER 101

# Expose port
EXPOSE 8080

# Healthcheck (also used by docker-compose)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget --spider -q http://127.0.0.1:8080/healthz || exit 1

ENTRYPOINT ["sh", "/entrypoint.sh"]