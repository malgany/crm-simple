"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  type ThemeMode,
  isThemeMode,
} from "@/lib/theme";

type ThemeContextValue = {
  isMounted: boolean;
  setTheme: (theme: ThemeMode) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): ThemeMode {
  if (typeof document === "undefined") {
    return DEFAULT_THEME;
  }

  const htmlTheme = document.documentElement.getAttribute(THEME_ATTRIBUTE);

  return isThemeMode(htmlTheme) ? htmlTheme : DEFAULT_THEME;
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme = isThemeMode(storedTheme) ? storedTheme : getInitialTheme();

    setThemeState(nextTheme);
    applyTheme(nextTheme);
    setIsMounted(true);
  }, []);

  const setTheme = (nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      isMounted,
      setTheme,
      theme,
      toggleTheme: () => setTheme(theme === "light" ? "dark" : "light"),
    }),
    [isMounted, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  }

  return context;
}
