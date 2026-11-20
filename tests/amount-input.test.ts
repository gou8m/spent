import { describe, expect, it } from "vitest";
import { caretAfter, countSignificant, formatAmountText, groupDigits, sanitizeAmount } from "@/lib/amount-input";

describe("groupDigits", () => {
  it("groups rupees 3 then 2", () => {
    expect(groupDigits("1", "INR")).toBe("1");
    expect(groupDigits("1234", "INR")).toBe("1,234");
    expect(groupDigits("123456", "INR")).toBe("1,23,456");
    expect(groupDigits("11234568", "INR")).toBe("1,12,34,568");
  });
  it("groups other currencies in threes", () => {
    expect(groupDigits("1234567", "USD")).toBe("1,234,567");
    expect(groupDigits("999", "GBP")).toBe("999");
  });
});

describe("sanitizeAmount", () => {
  it("drops commas and junk, keeps one point and the currency's decimals", () => {
    expect(sanitizeAmount("1,23,456.789", "INR")).toBe("123456.78");
    expect(sanitizeAmount("12a.5.6", "USD")).toBe("12.56");
    expect(sanitizeAmount("1,234.5", "USD")).toBe("1234.5");
  });
  it("has no decimals for yen", () => {
    expect(sanitizeAmount("1,234.56", "JPY")).toBe("1234");
  });
  it("handles a leading point and leading zeros", () => {
    expect(sanitizeAmount(".5", "INR")).toBe("0.5");
    expect(sanitizeAmount("0007", "INR")).toBe("7");
    expect(sanitizeAmount("", "INR")).toBe("");
  });
  it("caps the whole part at 12 digits", () => {
    expect(sanitizeAmount("1234567890123456", "USD")).toHaveLength(12);
  });
});

describe("formatAmountText and caret", () => {
  it("shows commas while keeping the typed point", () => {
    expect(formatAmountText("11234568.5", "INR")).toBe("1,12,34,568.5");
    expect(formatAmountText("1234.", "USD")).toBe("1,234.");
    expect(formatAmountText("", "INR")).toBe("");
  });
  it("keeps the caret after the same digit", () => {
    expect(countSignificant("1,23")).toBe(3);
    expect(caretAfter("12,34,567", 3)).toBe(4);
    expect(caretAfter("12,34,567", 0)).toBe(0);
    expect(caretAfter("12,34,567", 99)).toBe(9);
  });
});
