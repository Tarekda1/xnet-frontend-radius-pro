export type SavedViewState = Record<string, string>;
export type SavedViewsMap = Record<string, SavedViewState>;

function safeParse(json: string | null): unknown {
  try {
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

export function readSavedViews(storageKey: string): SavedViewsMap {
  if (!storageKey) return {};
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = safeParse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    const map: SavedViewsMap = {};
    for (const [name, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!name || typeof name !== "string") continue;
      if (!value || typeof value !== "object") continue;
      const state: SavedViewState = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (typeof k !== "string") continue;
        if (typeof v !== "string") continue;
        state[k] = v;
      }
      map[name] = state;
    }
    return map;
  } catch {
    return {};
  }
}

export function listSavedViewNames(storageKey: string): string[] {
  return Object.keys(readSavedViews(storageKey)).sort((a, b) => a.localeCompare(b));
}

export function saveView(storageKey: string, name: string, state: SavedViewState): void {
  const n = name.trim();
  if (!storageKey || !n) return;
  const all = readSavedViews(storageKey);
  all[n] = state;
  try {
    localStorage.setItem(storageKey, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function deleteView(storageKey: string, name: string): void {
  const n = name.trim();
  if (!storageKey || !n) return;
  const all = readSavedViews(storageKey);
  if (!(n in all)) return;
  delete all[n];
  try {
    localStorage.setItem(storageKey, JSON.stringify(all));
  } catch {
    // ignore
  }
}

