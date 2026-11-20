import { describe, expect, it } from "vitest";
import { dialCodeFor, normalizePhone } from "@/lib/phone";
import { ageOn, birthDateError, isBirthday, latestAdultBirthDate, parseBirthDate } from "@/lib/age";

describe("normalizePhone", () => {
  it("adds the rupee country code to a local number", () => {
    expect(normalizePhone("9999999999", "INR")).toBe("+91 99999 99999");
    expect(normalizePhone("99999 99999", "INR")).toBe("+91 99999 99999");
    expect(normalizePhone("09999999999", "INR")).toBe("+91 99999 99999");
    expect(normalizePhone("919999999999", "INR")).toBe("+91 99999 99999");
  });
  it("keeps a number that already has its own code, whatever the currency", () => {
    expect(normalizePhone("+91 99999 99999", "USD")).toBe("+91 99999 99999");
    expect(normalizePhone("+919999999999", "GBP")).toBe("+91 99999 99999");
  });
  it("uses the current currency for other countries", () => {
    expect(normalizePhone("5551234567", "USD")).toBe("+1 555 123 4567");
  });
  it("rejects what cannot be a number", () => {
    expect(normalizePhone("1234567890", "INR")).toBeNull();
    expect(normalizePhone("99999", "INR")).toBeNull();
    expect(normalizePhone("abc", "INR")).toBeNull();
    expect(normalizePhone("5551234567", "EUR")).toBeNull();
  });
  it("treats empty as empty", () => {
    expect(normalizePhone("", "INR")).toBe("");
    expect(normalizePhone("   ", "INR")).toBe("");
  });
  it("knows the dial code of a currency", () => {
    expect(dialCodeFor("INR")).toBe("+91");
    expect(dialCodeFor("EUR")).toBeNull();
  });
});

const now = new Date(2026, 10, 20);

describe("birth dates", () => {
  it("accepts real dates only", () => {
    expect(parseBirthDate("1995-03-14")).not.toBeNull();
    expect(parseBirthDate("2026-02-31")).toBeNull();
    expect(parseBirthDate("14/03/1995")).toBeNull();
    expect(parseBirthDate("")).toBeNull();
  });
  it("counts whole years", () => {
    expect(ageOn(parseBirthDate("2008-11-20")!, now)).toBe(18);
    expect(ageOn(parseBirthDate("2008-11-21")!, now)).toBe(17);
  });
  it("requires 18 or over", () => {
    expect(birthDateError("2008-11-20", now)).toBeNull();
    expect(birthDateError("2008-11-21", now)).toMatch(/18/);
    expect(birthDateError("1800-01-01", now)).not.toBeNull();
    expect(birthDateError("nope", now)).not.toBeNull();
    expect(latestAdultBirthDate(now)).toBe("2008-11-20");
  });
  it("recognises a birthday, with 29 February on the 28th in other years", () => {
    expect(isBirthday("1995-11-20", now)).toBe(true);
    expect(isBirthday("1995-11-21", now)).toBe(false);
    expect(isBirthday("1996-02-29", new Date(2027, 1, 28))).toBe(true);
    expect(isBirthday("1996-02-29", new Date(2028, 1, 29))).toBe(true);
    expect(isBirthday("1996-02-29", new Date(2028, 1, 28))).toBe(false);
  });
});
