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

TEMPLATE="/usr/share/nginx/html/env.template.js"
OUT="/usr/share/nginx/html/env.js"

if [ -f "$TEMPLATE" ]; then
  # Generate env.js from template; allow missing vars (they become empty strings).
  envsubst '${API_URL} ${DEFAULT_NAS_IP} ${DEFAULT_NAS_SECRET} ${DEFAULT_NAS_COA_PORT}' < "$TEMPLATE" > "$OUT"
else
  # Ensure env.js exists (so index.html doesn't 404 on /env.js)
  echo "window.__ENV__ = window.__ENV__ || {};" > "$OUT"
fi

exec nginx -g "daemon off;"

