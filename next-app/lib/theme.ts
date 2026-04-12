export const THEME_STORAGE_KEY = "theme";

export type ThemePreference = "light" | "dark";

export function getThemeIsDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark";
}

/** Syncs `class="dark"`, `data-theme`, and `localStorage` (matches electronic-shop `data-theme` + Tailwind dark variant). */
export function applyTheme(dark: boolean): void {
  const root = document.documentElement;
  if (dark) {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
  }
}
