import { describe, expect, it } from "vitest";
import {
  buildWhatsappUrl,
  formatPhone,
  normalizeOptionalText,
  normalizePhone,
} from "./utils";

describe("phone helpers", () => {
  it("normalizes phone digits", () => {
    expect(normalizePhone("(65) 99999-1111")).toBe("65999991111");
  });

  it("builds whatsapp url assuming Brazil for 10 or 11 digits", () => {
    expect(buildWhatsappUrl("(65) 99999-1111")).toBe(
      "https://wa.me/5565999991111",
    );
  });

  it("formats common Brazilian phone masks", () => {
    expect(formatPhone("65999991111")).toBe("(65) 99999-1111");
  });

  it("turns blank optional text into null", () => {
    expect(normalizeOptionalText("   ")).toBeNull();
  });
});
