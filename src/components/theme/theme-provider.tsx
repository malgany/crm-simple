"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  ACTIVE_USER_STORAGE_KEY,
  BOARD_BACKGROUND_ATTRIBUTE,
  BOARD_BACKGROUND_OPTIONS,
  BOARD_BACKGROUND_STORAGE_KEY,
  DEFAULT_BOARD_BACKGROUND,
  DEFAULT_THEME,
  LEGACY_THEME_STORAGE_KEY,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  buildBoardBackgroundStorageKey,
  buildThemeStorageKey,
  type BoardBackgroundId,
  type BoardBackgroundOption,
  isBoardBackgroundId,
  isThemeMode,
  normalizeThemeUserEmail,
  type ThemeMode,
} from "@/lib/theme";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type ThemeContextValue = {
  boardBackground: BoardBackgroundId;
  boardBackgroundOptions: readonly BoardBackgroundOption[];
  isMounted: boolean;
  setBoardBackground: (background: BoardBackgroundId) => void;
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

function getInitialBoardBackground(): BoardBackgroundId {
  if (typeof document === "undefined") {
    return DEFAULT_BOARD_BACKGROUND;
  }

  const htmlBoardBackground = document.documentElement.getAttribute(
    BOARD_BACKGROUND_ATTRIBUTE,
  );

  return isBoardBackgroundId(htmlBoardBackground)
    ? htmlBoardBackground
    : DEFAULT_BOARD_BACKGROUND;
}

function readStoredTheme(userEmail?: string | null) {
  if (typeof window === "undefined") {
    return null;
  }

  const storedTheme =
    window.localStorage.getItem(buildThemeStorageKey(userEmail)) ||
    window.localStorage.getItem(THEME_STORAGE_KEY) ||
    window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);

  return isThemeMode(storedTheme) ? storedTheme : null;
}

function readStoredBoardBackground(userEmail?: string | null) {
  if (typeof window === "undefined") {
    return null;
  }

  const storedBoardBackground = window.localStorage.getItem(
    buildBoardBackgroundStorageKey(userEmail),
  );

  return isBoardBackgroundId(storedBoardBackground) ? storedBoardBackground : null;
}

function syncActiveUserStorage(userEmail?: string | null) {
  const normalizedUserEmail = normalizeThemeUserEmail(userEmail);

  if (normalizedUserEmail) {
    window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, normalizedUserEmail);
    return;
  }

  window.localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
}

function applyTheme(theme: ThemeMode, userEmail?: string | null) {
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
  window.localStorage.setItem(buildThemeStorageKey(userEmail), theme);
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function applyBoardBackground(
  boardBackground: BoardBackgroundId,
  userEmail?: string | null,
) {
  document.documentElement.setAttribute(BOARD_BACKGROUND_ATTRIBUTE, boardBackground);
  window.localStorage.setItem(
    buildBoardBackgroundStorageKey(userEmail),
    boardBackground,
  );
  window.localStorage.setItem(BOARD_BACKGROUND_STORAGE_KEY, boardBackground);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);
  const [boardBackground, setBoardBackgroundState] =
    useState<BoardBackgroundId>(getInitialBoardBackground);
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return normalizeThemeUserEmail(
      window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY),
    );
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const syncPreferences = (nextUserEmail?: string | null) => {
      const normalizedUserEmail = normalizeThemeUserEmail(nextUserEmail);
      const nextTheme = readStoredTheme(normalizedUserEmail) ?? getInitialTheme();
      const nextBoardBackground =
        readStoredBoardBackground(normalizedUserEmail) ?? getInitialBoardBackground();

      setUserEmail(normalizedUserEmail);
      setThemeState(nextTheme);
      setBoardBackgroundState(nextBoardBackground);
      applyTheme(nextTheme, normalizedUserEmail);
      applyBoardBackground(nextBoardBackground, normalizedUserEmail);
      syncActiveUserStorage(normalizedUserEmail);
      setIsMounted(true);
    };

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      syncPreferences(data.session?.user.email ?? null);
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncPreferences(session?.user.email ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setTheme = (nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme, userEmail);
  };

  const setBoardBackground = (nextBoardBackground: BoardBackgroundId) => {
    setBoardBackgroundState(nextBoardBackground);
    applyBoardBackground(nextBoardBackground, userEmail);
  };

  const value: ThemeContextValue = {
    boardBackground,
    boardBackgroundOptions: BOARD_BACKGROUND_OPTIONS,
    isMounted,
    setBoardBackground,
    setTheme,
    theme,
    toggleTheme: () => setTheme(theme === "light" ? "dark" : "light"),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  }

  return context;
}
