import { describe, expect, it } from "vitest";
import { checkOutsidePayment, dayIndex, latestAllowedDay, previewOutsidePayment, toUtcMidnight } from "@/lib/loan-payment";
import { computeLoan, type LoanTerms } from "@/lib/loan-math";
import { looksLikeMerchant } from "@/lib/party";

const day = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

// ₹50,000 taken on 12 Mar 2023 at 12% a year, nothing paid yet (a loan added by hand).
const terms: LoanTerms = {
  principal: 5000000,
  startDate: day(2023, 3, 12),
  interestRate: 12,
  interestPeriod: "YEAR",
  interestStoppedAt: null,
  closedKind: null,
  closedAt: null,
};
const now = day(2026, 11, 20);

describe("a standalone loan", () => {
  it("counts interest from its start date", () => {
    const state = computeLoan(terms, [], now);
    expect(state.interestAccrued).toBeGreaterThan(2_000_000); // more than ₹20,000 over 3 years 8 months
    expect(state.outstanding).toBe(state.principalOutstanding + state.interestOutstanding);
    expect(state.status).toBe("OPEN");
  });
});

describe("payments made outside Spent", () => {
  it("accepts a normal payment and splits it interest first", () => {
    const owed = computeLoan(terms, [], now);
    const payment = { date: now, amount: 1000000 };
    expect(checkOutsidePayment(terms, [], payment, "INR", now)).toBeNull();
    const preview = previewOutsidePayment(terms, [], payment, now);
    expect(preview.toInterest).toBe(1000000);
    expect(preview.toPrincipal).toBe(0);
    expect(preview.state.outstanding).toBe(owed.outstanding - 1000000);
  });
  it("settles the loan when it pays everything", () => {
    const owed = computeLoan(terms, [], now).outstanding;
    const preview = previewOutsidePayment(terms, [], { date: now, amount: owed }, now);
    expect(preview.state.status).toBe("SETTLED");
    expect(preview.state.outstanding).toBe(0);
  });
  it("refuses more than is owed, future dates, dates before the loan and nonsense", () => {
    const owed = computeLoan(terms, [], now).outstanding;
    expect(checkOutsidePayment(terms, [], { date: now, amount: owed + 1 }, "INR", now)).toMatch(/more than/);
    expect(checkOutsidePayment(terms, [], { date: day(2026, 11, 25), amount: 100 }, "INR", now)).toMatch(/future/);
    expect(checkOutsidePayment(terms, [], { date: day(2023, 1, 1), amount: 100 }, "INR", now)).toMatch(/before the loan/);
    expect(checkOutsidePayment(terms, [], { date: now, amount: 0 }, "INR", now)).toMatch(/above 0/);
    expect(checkOutsidePayment(terms, [], { date: now, amount: 2_147_483_648 }, "INR", now)).toMatch(/too large/);
    expect(checkOutsidePayment({ ...terms, closedKind: "WAIVED", closedAt: now }, [], { date: now, amount: 100 }, "INR", now)).toMatch(/closed/);
  });
  it("counts earlier payments when checking a later one", () => {
    const first = { date: day(2024, 3, 12), amount: 2000000, transactionId: "manual:a" };
    const owedAfter = computeLoan(terms, [first], now).outstanding;
    expect(checkOutsidePayment(terms, [first], { date: now, amount: owedAfter }, "INR", now)).toBeNull();
    expect(checkOutsidePayment(terms, [first], { date: now, amount: owedAfter + 1 }, "INR", now)).toMatch(/more than/);
  });
});

describe("calendar days", () => {
  it("are counted in UTC and normalised to UTC midnight", () => {
    expect(toUtcMidnight(new Date("2026-03-12T18:30:00Z")).toISOString()).toBe("2026-03-12T00:00:00.000Z");
    expect(dayIndex(new Date("2026-03-12T00:00:00Z")) - dayIndex(new Date("2026-03-11T00:00:00Z"))).toBe(1);
  });
  it("let a person ahead of UTC pay on their own today", () => {
    // 02:00 in India on 20 Nov is still 19 Nov in UTC.
    const lateEveningUtc = new Date("2026-11-19T20:30:00Z");
    expect(dayIndex(new Date("2026-11-20T00:00:00Z"))).toBeLessThanOrEqual(latestAllowedDay(lateEveningUtc));
    expect(dayIndex(new Date("2026-11-22T00:00:00Z"))).toBeGreaterThan(latestAllowedDay(lateEveningUtc));
    expect(checkOutsidePayment(terms, [], { date: day(2026, 11, 20), amount: 100 }, "INR", lateEveningUtc)).toBeNull();
  });
});

describe("known merchants are not asked about", () => {
  it("recognises brands and kinds of business", () => {
    for (const name of ["Amazon", "IRCTC", "Swiggy", "Krishna Medical", "Big Bazaar Supermart", "Uber"]) expect(looksLikeMerchant(name), name).toBe(true);
  });
  it("leaves personal-looking names to be asked", () => {
    for (const name of ["Rahul Kiranam", "Sandhya Aunty", "Suresh"]) expect(looksLikeMerchant(name), name).toBe(false);
  });
});
