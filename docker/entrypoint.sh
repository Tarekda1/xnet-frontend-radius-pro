#!/bin/sh
set -eu

# Prefer API_URL (runtime), fall back to VITE_API_URL if someone still sets it.
API_URL="${API_URL:-${VITE_API_URL:-}}"
export API_URL

# Optional: NAS config for CoA actions (runtime), with fallback to VITE_*.
DEFAULT_NAS_IP="${DEFAULT_NAS_IP:-${VITE_DEFAULT_NAS_IP:-}}"
DEFAULT_NAS_SECRET="${DEFAULT_NAS_SECRET:-${VITE_DEFAULT_NAS_SECRET:-}}"
DEFAULT_NAS_COA_PORT="${DEFAULT_NAS_COA_PORT:-${VITE_DEFAULT_NAS_COA_PORT:-1700}}"
export DEFAULT_NAS_IP DEFAULT_NAS_SECRET DEFAULT_NAS_COA_PORT

# Optional: app metadata (runtime), with fallback to VITE_*.
APP_VERSION="${APP_VERSION:-${VITE_APP_VERSION:-}}"
APP_BUILD_TIME="${APP_BUILD_TIME:-${VITE_APP_BUILD_TIME:-}}"
APP_GIT_SHA="${APP_GIT_SHA:-${VITE_APP_GIT_SHA:-}}"
export APP_VERSION APP_BUILD_TIME APP_GIT_SHA

# Optional: error reporting (runtime), with fallback to VITE_*.
SENTRY_DSN="${SENTRY_DSN:-${VITE_SENTRY_DSN:-}}"
SENTRY_ENVIRONMENT="${SENTRY_ENVIRONMENT:-${VITE_SENTRY_ENVIRONMENT:-}}"
export SENTRY_DSN SENTRY_ENVIRONMENT

# Feature flags (runtime), with fallback to VITE_*.
FEATURE_FLAGS="${FEATURE_FLAGS:-${VITE_FEATURE_FLAGS:-}}"
export FEATURE_FLAGS

TEMPLATE="/usr/share/nginx/html/env.template.js"
OUT="/usr/share/nginx/html/env.js"

if [ -f "$TEMPLATE" ]; then
  # Generate env.js from template; allow missing vars (they become empty strings).
  envsubst '${API_URL} ${FEATURE_FLAGS} ${DEFAULT_NAS_IP} ${DEFAULT_NAS_SECRET} ${DEFAULT_NAS_COA_PORT} ${SENTRY_DSN} ${SENTRY_ENVIRONMENT} ${APP_VERSION} ${APP_BUILD_TIME} ${APP_GIT_SHA}' < "$TEMPLATE" > "$OUT"
else
  # Ensure env.js exists (so index.html doesn't 404 on /env.js)
  echo "window.__ENV__ = window.__ENV__ || {};" > "$OUT"
fi

exec nginx -g "daemon off;"

