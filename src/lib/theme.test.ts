import { describe, expect, it } from "vitest";
import {
  BOARD_BACKGROUND_STORAGE_KEY,
  THEME_STORAGE_KEY,
  buildBoardBackgroundStorageKey,
  buildThemeStorageKey,
  isBoardBackgroundId,
} from "./theme";

describe("theme helpers", () => {
  it("builds user-scoped storage keys", () => {
    expect(buildThemeStorageKey("Tony@Empresa.com")).toBe(
      "crm-simple:tony@empresa.com:theme",
    );
    expect(buildBoardBackgroundStorageKey("Tony@Empresa.com")).toBe(
      "crm-simple:tony@empresa.com:board-background",
    );
  });

  it("falls back to shared keys when there is no user", () => {
    expect(buildThemeStorageKey()).toBe(THEME_STORAGE_KEY);
    expect(buildBoardBackgroundStorageKey()).toBe(BOARD_BACKGROUND_STORAGE_KEY);
  });

  it("validates board background ids", () => {
    expect(isBoardBackgroundId("green")).toBe(true);
    expect(isBoardBackgroundId("white")).toBe(true);
    expect(isBoardBackgroundId("unknown")).toBe(false);
  });
});
