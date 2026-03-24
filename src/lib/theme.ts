export const DEFAULT_THEME = "light";
export const DEFAULT_BOARD_BACKGROUND = "green";
export const THEME_ATTRIBUTE = "data-theme";
export const BOARD_BACKGROUND_ATTRIBUTE = "data-board-background";
export const THEME_STORAGE_KEY = "crm-simple-theme:last";
export const LEGACY_THEME_STORAGE_KEY = "crm-simple-theme";
export const BOARD_BACKGROUND_STORAGE_KEY = "crm-simple-board-background:last";
export const ACTIVE_USER_STORAGE_KEY = "crm-simple-active-user";

export type ThemeMode = "light" | "dark";
export type BoardBackgroundId =
  | "green"
  | "blue"
  | "red"
  | "yellow"
  | "teal"
  | "slate"
  | "black"
  | "white"
  | "copper";

export type BoardBackgroundOption = {
  id: BoardBackgroundId;
  label: string;
  preview: string;
};

export const BOARD_BACKGROUND_OPTIONS: readonly BoardBackgroundOption[] = [
  {
    id: "green",
    label: "Verde",
    preview: "linear-gradient(180deg, #23461f 0%, #1b3918 100%)",
  },
  {
    id: "blue",
    label: "Azul",
    preview: "linear-gradient(180deg, #22577a 0%, #173b53 100%)",
  },
  {
    id: "red",
    label: "Vermelho",
    preview: "linear-gradient(180deg, #813531 0%, #652826 100%)",
  },
  {
    id: "yellow",
    label: "Amarelo",
    preview: "linear-gradient(180deg, #8b6b18 0%, #6e5415 100%)",
  },
  {
    id: "teal",
    label: "Petroleo",
    preview: "linear-gradient(180deg, #1f5d57 0%, #174743 100%)",
  },
  {
    id: "slate",
    label: "Grafite",
    preview: "linear-gradient(180deg, #4b5563 0%, #374151 100%)",
  },
  {
    id: "black",
    label: "Preto",
    preview: "linear-gradient(180deg, #111111 0%, #050505 100%)",
  },
  {
    id: "white",
    label: "Branco",
    preview: "linear-gradient(180deg, #f8fafc 0%, #e5e7eb 100%)",
  },
  {
    id: "copper",
    label: "Cobre",
    preview: "linear-gradient(180deg, #7c4a33 0%, #603726 100%)",
  },
] as const;

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function isBoardBackgroundId(
  value: string | null | undefined,
): value is BoardBackgroundId {
  return BOARD_BACKGROUND_OPTIONS.some((option) => option.id === value);
}

export function normalizeThemeUserEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();

  return normalized ? normalized : null;
}

export function buildThemeStorageKey(userEmail?: string | null) {
  const normalizedUserEmail = normalizeThemeUserEmail(userEmail);

  return normalizedUserEmail
    ? `crm-simple:${normalizedUserEmail}:theme`
    : THEME_STORAGE_KEY;
}

export function buildBoardBackgroundStorageKey(userEmail?: string | null) {
  const normalizedUserEmail = normalizeThemeUserEmail(userEmail);

  return normalizedUserEmail
    ? `crm-simple:${normalizedUserEmail}:board-background`
    : BOARD_BACKGROUND_STORAGE_KEY;
}

export const themeInitScript = `
(() => {
  const normalizeUserEmail = (value) => {
    const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
    return normalized || null;
  };
  const themeAttribute = "${THEME_ATTRIBUTE}";
  const boardBackgroundAttribute = "${BOARD_BACKGROUND_ATTRIBUTE}";
  const activeUserStorageKey = "${ACTIVE_USER_STORAGE_KEY}";
  const themeFallbackStorageKey = "${THEME_STORAGE_KEY}";
  const legacyThemeStorageKey = "${LEGACY_THEME_STORAGE_KEY}";
  const boardBackgroundFallbackStorageKey = "${BOARD_BACKGROUND_STORAGE_KEY}";
  const fallbackTheme = "${DEFAULT_THEME}";
  const fallbackBoardBackground = "${DEFAULT_BOARD_BACKGROUND}";
  const validBoardBackgrounds = ${JSON.stringify(BOARD_BACKGROUND_OPTIONS.map((option) => option.id))};
  const activeUserEmail = normalizeUserEmail(
    window.localStorage.getItem(activeUserStorageKey),
  );
  const themeStorageKey = activeUserEmail
    ? "crm-simple:" + activeUserEmail + ":theme"
    : themeFallbackStorageKey;
  const boardBackgroundStorageKey = activeUserEmail
    ? "crm-simple:" + activeUserEmail + ":board-background"
    : boardBackgroundFallbackStorageKey;
  const storedTheme =
    window.localStorage.getItem(themeStorageKey) ||
    window.localStorage.getItem(themeFallbackStorageKey) ||
    window.localStorage.getItem(legacyThemeStorageKey);
  const storedBoardBackground = window.localStorage.getItem(boardBackgroundStorageKey);
  const theme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : fallbackTheme;
  const boardBackground = validBoardBackgrounds.includes(storedBoardBackground)
    ? storedBoardBackground
    : fallbackBoardBackground;
  document.documentElement.setAttribute(themeAttribute, theme);
  document.documentElement.setAttribute(boardBackgroundAttribute, boardBackground);
})();
`;
