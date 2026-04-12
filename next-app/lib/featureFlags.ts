type RuntimeEnv = {
  FEATURE_FLAGS?: string;
};

function readRuntimeEnv(): RuntimeEnv {
  try {
    return ((window as any)?.__ENV__ ?? {}) as RuntimeEnv;
  } catch {
    return {};
  }
}

function normalizeToken(t: string) {
  return t.trim().toLowerCase();
}

export function getFeatureFlagState(): {
  enabled: Set<string>;
  disabled: Set<string>;
  raw: string;
} {
  const raw = String(readRuntimeEnv().FEATURE_FLAGS || "").trim();
  const enabled = new Set<string>();
  const disabled = new Set<string>();

  if (!raw) return { enabled, disabled, raw };

  const parts = raw.split(/[,\s]+/).map(normalizeToken).filter(Boolean);
  for (const p of parts) {
    if (!p) continue;
    if (p.startsWith("-") || p.startsWith("!")) {
      disabled.add(p.slice(1));
      continue;
    }
    if (p.startsWith("+")) {
      enabled.add(p.slice(1));
      continue;
    }
    enabled.add(p);
  }

  return { enabled, disabled, raw };
}

export function isFeatureEnabled(flag: string, defaultEnabled = true): boolean {
  const key = normalizeToken(flag);
  if (!key) return defaultEnabled;

  const st = getFeatureFlagState();
  if (st.disabled.has(key)) return false;

  // If any explicit enables exist, treat that as an allow-list for flags mentioned.
  // Otherwise, everything is enabled by default unless explicitly disabled.
  if (st.enabled.size > 0) return st.enabled.has(key);
  return defaultEnabled;
}

