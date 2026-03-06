export const DEFAULT_THEME = "light";
export const THEME_ATTRIBUTE = "data-theme";
export const THEME_STORAGE_KEY = "crm-simple-theme";

export type ThemeMode = "light" | "dark";

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark";
}

export const themeInitScript = `
(() => {
  const storageKey = "${THEME_STORAGE_KEY}";
  const attribute = "${THEME_ATTRIBUTE}";
  const fallback = "${DEFAULT_THEME}";
  const stored = window.localStorage.getItem(storageKey);
  const theme = stored === "dark" || stored === "light" ? stored : fallback;
  document.documentElement.setAttribute(attribute, theme);
})();
`;
