import { describe, expect, it } from "vitest";
import { MAX_MINOR_UNITS, decimalsForCurrency, formatMoney, toMinorUnits } from "@/lib/money";
import { transactionSchema } from "@/lib/validations/transaction";
import { recurringSchema } from "@/lib/validations/recurring";
import { registerSchema } from "@/lib/validations/auth";
import { ipFromHeaders } from "@/lib/rate-limit";

describe("money", () => {
  it("converts to whole minor units", () => {
    expect(toMinorUnits(12.34, "INR")).toBe(1234);
    expect(toMinorUnits(1234, "JPY")).toBe(1234);
    expect(decimalsForCurrency("KWD")).toBe(3);
  });
  it("groups rupees the Indian way", () => {
    expect(formatMoney(1123456800, "INR")).toContain("1,12,34,568");
  });
  it("knows the largest amount the database can hold", () => {
    expect(MAX_MINOR_UNITS).toBe(2147483647);
  });
});

const baseTx = {
  type: "EXPENSE",
  amount: 1000,
  currency: "INR",
  accountId: "a",
  categoryId: "c",
  title: "Lunch",
  date: new Date(),
  status: "COMPLETED",
  tagIds: [],
};

describe("amount limits", () => {
  it("accepts a normal amount and rejects one the database cannot store", () => {
    expect(transactionSchema.safeParse(baseTx).success).toBe(true);
    const tooBig = transactionSchema.safeParse({ ...baseTx, amount: MAX_MINOR_UNITS + 1 });
    expect(tooBig.success).toBe(false);
    expect(JSON.stringify(tooBig.error?.issues)).toContain("too large");
  });
  it("rejects zero and negative", () => {
    expect(transactionSchema.safeParse({ ...baseTx, amount: 0 }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...baseTx, amount: -5 }).success).toBe(false);
  });
});

const baseRule = {
  title: "Salary",
  amount: 5000000,
  type: "INCOME",
  accountId: "a",
  categoryId: "c",
  frequency: "MONTHLY",
  interval: 1,
  startDate: new Date(),
  isSubscription: false,
  dayRule: "LAST_WORKING_DAY",
  amountVaries: false,
  skipFirst: false,
};

describe("recurring rules", () => {
  it("accepts a salary with a bonus", () => {
    expect(recurringSchema.safeParse({ ...baseRule, bonusAmount: 100000, bonusEveryMonths: 3 }).success).toBe(true);
  });
  it("needs both bonus fields or neither", () => {
    expect(recurringSchema.safeParse({ ...baseRule, bonusAmount: 100000 }).success).toBe(false);
    expect(recurringSchema.safeParse({ ...baseRule, bonusEveryMonths: 3 }).success).toBe(false);
  });
  it("allows a bonus only on monthly income", () => {
    expect(recurringSchema.safeParse({ ...baseRule, type: "EXPENSE", bonusAmount: 1, bonusEveryMonths: 3 }).success).toBe(false);
    expect(recurringSchema.safeParse({ ...baseRule, frequency: "WEEKLY", dayRule: "DAY", bonusAmount: 1, bonusEveryMonths: 3 }).success).toBe(false);
  });
  it("allows month-end rules only for monthly repeats", () => {
    expect(recurringSchema.safeParse({ ...baseRule, frequency: "WEEKLY" }).success).toBe(false);
  });
});

const baseSignup = { name: "Alex", email: "alex@gmail.com", password: "Abcdef1!xyz", currency: "INR", dateOfBirth: "1995-03-14" };

describe("sign-up", () => {
  it("accepts an adult with no phone, or a valid phone for the currency", () => {
    expect(registerSchema.safeParse(baseSignup).success).toBe(true);
    expect(registerSchema.safeParse({ ...baseSignup, phone: "9999999999" }).success).toBe(true);
  });
  it("rejects someone under 18, a missing birth date and a bad phone", () => {
    const year = new Date().getFullYear() - 10;
    expect(registerSchema.safeParse({ ...baseSignup, dateOfBirth: `${year}-05-05` }).success).toBe(false);
    expect(registerSchema.safeParse({ ...baseSignup, dateOfBirth: "" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...baseSignup, phone: "12345" }).success).toBe(false);
  });
});

describe("ipFromHeaders", () => {
  it("takes the first forwarded address", () => {
    const h = (map: Record<string, string>) => ({ get: (k: string) => map[k] ?? null });
    expect(ipFromHeaders(h({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(ipFromHeaders(h({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(ipFromHeaders(h({}))).toBe("unknown");
  });
});
