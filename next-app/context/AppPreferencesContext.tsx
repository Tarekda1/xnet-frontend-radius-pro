import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type UiDensity = "comfortable" | "compact";

const DENSITY_KEY = "app.ui.density";
const HEALTH_STRIP_KEY = "app.ui.showHealthStrip";

type AppPreferencesContextValue = {
  density: UiDensity;
  setDensity: (d: UiDensity) => void;
  showHealthStrip: boolean;
  setShowHealthStrip: (v: boolean) => void;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

const readDensity = (): UiDensity => {
  if (typeof window === "undefined") return "comfortable";
  try {
    const r = localStorage.getItem(DENSITY_KEY);
    if (r === "compact" || r === "comfortable") return r;
  } catch {
    /* ignore */
  }
  return "comfortable";
};

const readShowHealthStrip = (): boolean => {
  if (typeof window === "undefined") return true;
  try {
    const r = localStorage.getItem(HEALTH_STRIP_KEY);
    if (r === "0" || r === "false") return false;
    if (r === "1" || r === "true") return true;
  } catch {
    /* ignore */
  }
  return true;
};

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = useState<UiDensity>(readDensity);
  const [showHealthStrip, setShowHealthStripState] = useState<boolean>(readShowHealthStrip);

  const setDensity = useCallback((d: UiDensity) => {
    setDensityState(d);
    try {
      localStorage.setItem(DENSITY_KEY, d);
    } catch {
      /* ignore */
    }
  }, []);

  const setShowHealthStrip = useCallback((v: boolean) => {
    setShowHealthStripState(v);
    try {
      localStorage.setItem(HEALTH_STRIP_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ density, setDensity, showHealthStrip, setShowHealthStrip }),
    [density, setDensity, showHealthStrip, setShowHealthStrip]
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences(): AppPreferencesContextValue {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) {
    throw new Error("useAppPreferences must be used within AppPreferencesProvider");
  }
  return ctx;
}
