# Next.js App Router — production (standalone Node server).

FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app/next-app

# Retry flaky registry downloads inside Docker (common on Windows Desktop).
ENV NPM_CONFIG_LOGLEVEL=info \
    NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_PROGRESS=true

# Install deps in a cached layer (only re-runs when lockfile changes).
COPY next-app/package.json next-app/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --no-audit --no-fund

# Source + build args
COPY next-app/ ./
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ARG API_PROXY_TARGET=http://127.0.0.1:3000
ENV API_PROXY_TARGET=${API_PROXY_TARGET}
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache gettext wget
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5173
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/next-app/.next/standalone ./
COPY --from=builder /app/next-app/.next/static ./.next/static
COPY --from=builder /app/next-app/public ./public
COPY public/env.template.js ./public/env.template.js

COPY docker/entrypoint-next.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh \
  && chmod +x /entrypoint.sh \
  && chown -R node:node /app

USER node
EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:5173/healthz || exit 1

ENTRYPOINT ["sh", "/entrypoint.sh"]
