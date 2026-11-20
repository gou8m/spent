import { describe, expect, it } from "vitest";
import { amountOn, bonusDue, dateInMonth, firstOccurrence, lastWorkingDayOfMonth, stepForward } from "@/lib/recurrence";

const d = (y: number, m: number, day: number) => new Date(Date.UTC(y, m - 1, day));
const ymd = (x: Date) => x.toISOString().slice(0, 10);

describe("lastWorkingDayOfMonth", () => {
  it("skips weekends at the end of the month", () => {
    expect(ymd(lastWorkingDayOfMonth(d(2026, 11, 1)))).toBe("2026-11-30");
    expect(ymd(lastWorkingDayOfMonth(d(2027, 1, 1)))).toBe("2027-01-29");
    expect(ymd(lastWorkingDayOfMonth(d(2027, 2, 1)))).toBe("2027-02-26");
    expect(ymd(lastWorkingDayOfMonth(d(2026, 10, 1)))).toBe("2026-10-30");
  });
});

describe("dateInMonth", () => {
  it("handles month end including leap years", () => {
    expect(ymd(dateInMonth(d(2028, 2, 10), "MONTH_END", 10))).toBe("2028-02-29");
    expect(ymd(dateInMonth(d(2027, 2, 10), "MONTH_END", 10))).toBe("2027-02-28");
  });
  it("clamps a fixed day to short months", () => {
    expect(ymd(dateInMonth(d(2026, 4, 1), "DAY", 31))).toBe("2026-04-30");
    expect(ymd(dateInMonth(d(2026, 5, 1), "DAY", 31))).toBe("2026-05-31");
  });
});

describe("firstOccurrence", () => {
  it("keeps the start date for the plain rule", () => {
    expect(ymd(firstOccurrence(d(2026, 11, 2), "MONTHLY", "DAY"))).toBe("2026-11-02");
  });
  it("lands salary on the last working day of the start month", () => {
    expect(ymd(firstOccurrence(d(2026, 11, 20), "MONTHLY", "LAST_WORKING_DAY"))).toBe("2026-11-30");
  });
  it("moves to next month when the day has already passed", () => {
    expect(ymd(firstOccurrence(d(2026, 11, 30), "MONTHLY", "LAST_WORKING_DAY"))).toBe("2026-11-30");
    expect(ymd(firstOccurrence(d(2026, 10, 31), "MONTHLY", "LAST_WORKING_DAY"))).toBe("2026-11-30");
    expect(ymd(firstOccurrence(d(2026, 12, 1), "MONTHLY", "MONTH_END"))).toBe("2026-12-31");
  });
});

describe("stepForward", () => {
  it("returns to the anchor day after a short month", () => {
    const feb = stepForward(d(2026, 1, 31), "MONTHLY", 1, 31);
    expect(ymd(feb)).toBe("2026-02-28");
    expect(ymd(stepForward(feb, "MONTHLY", 1, 31))).toBe("2026-03-31");
  });
  it("follows the last working day month after month", () => {
    let date = d(2026, 11, 30);
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      date = stepForward(date, "MONTHLY", 1, 30, "LAST_WORKING_DAY");
      seen.push(ymd(date));
    }
    expect(seen).toEqual(["2026-12-31", "2027-01-29", "2027-02-26"]);
  });
  it("steps weekly and yearly", () => {
    expect(ymd(stepForward(d(2026, 11, 20), "WEEKLY", 2, 20))).toBe("2026-12-04");
    expect(ymd(stepForward(d(2028, 2, 29), "YEARLY", 1, 29))).toBe("2029-02-28");
  });
});

describe("bonus", () => {
  const start = d(2026, 11, 30);
  it("is due every third month counting the start month as the first", () => {
    expect(bonusDue(start, d(2026, 11, 30), 3)).toBe(false);
    expect(bonusDue(start, d(2026, 12, 31), 3)).toBe(false);
    expect(bonusDue(start, d(2027, 1, 29), 3)).toBe(true);
    expect(bonusDue(start, d(2027, 4, 30), 3)).toBe(true);
  });
  it("adds the bonus only in those months", () => {
    const rule = { amount: 100000, startDate: start, bonusAmount: 50000, bonusEveryMonths: 3 };
    expect(amountOn(rule, d(2026, 12, 31))).toBe(100000);
    expect(amountOn(rule, d(2027, 1, 29))).toBe(150000);
    expect(amountOn({ ...rule, bonusAmount: null }, d(2027, 1, 29))).toBe(100000);
  });
});
