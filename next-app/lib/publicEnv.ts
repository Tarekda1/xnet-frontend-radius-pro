/**
 * Build-time public env from `process.env.NEXT_PUBLIC_*` (Next.js inlines these at build).
 * Runtime API URL and NAS defaults come from `window.__ENV__` (see repo `public/env.template.js` + Docker entrypoint).
 */
function readNextPublic(key: `NEXT_PUBLIC_${string}`): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  const v = process.env[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/** Default when `NEXT_PUBLIC_API_URL` / runtime `window.__ENV__.API_URL` are unset (matches production backend). */
export const DEFAULT_PUBLIC_API_URL = "https://api.xnetcloud.tech/api";

/** Older deployments used the app hostname for REST; backend is on api.*. */
export function normalizeLegacyApiHost(url: string): string {
  if (!url || typeof url !== "string") return url;
  return url.replace(/\bradius\.xnetcloud\.tech\b/gi, "api.xnetcloud.tech");
}

export function resolvePublicApiUrl(fallback = DEFAULT_PUBLIC_API_URL): string {
  const raw = readNextPublic("NEXT_PUBLIC_API_URL") ?? fallback;
  return normalizeLegacyApiHost(raw);
}

/** Browser: `window.__ENV__.API_URL` (Docker `env.js`) if set, else build-time `NEXT_PUBLIC_*`. */
export function resolveBrowserApiUrl(): string {
  if (typeof window !== "undefined") {
    const raw = window.__ENV__?.API_URL;
    if (typeof raw === "string") {
      const t = raw.trim();
      if (t.length > 0) return normalizeLegacyApiHost(t);
    }
  }
  return resolvePublicApiUrl();
}

export function resolvePublicWsUrl(): string | undefined {
  const v = readNextPublic("NEXT_PUBLIC_WS_URL");
  return v && v.length > 0 ? v : undefined;
}

export function isDevBuild(): boolean {
  if (typeof process !== "undefined" && process.env?.NODE_ENV !== undefined) {
    return process.env.NODE_ENV !== "production";
  }
  return true;
}
