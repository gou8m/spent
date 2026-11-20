import { describe, expect, it } from "vitest";
import { computeBalances, computeShares, simplifyDebts, type SplitEntry } from "@/lib/split";
import { convertMinor } from "@/lib/money";

const sum = (xs: { owed: number }[]) => xs.reduce((n, s) => n + s.owed, 0);
const ids = (n: number) => Array.from({ length: n }, (_, i) => `m${i}`);

// A small deterministic random source, so a failing case can be replayed.
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

describe("computeShares", () => {
  it("splits equally and gives the leftover to the payer first", () => {
    const r = computeShares(1000, "EQUAL", ids(3).map((memberId) => ({ memberId })), "m2");
    expect(r.ok && r.shares.map((s) => s.owed)).toEqual([333, 333, 334]);
  });

  it("always adds up to the total, whatever the split", () => {
    const next = rng(7);
    for (let k = 0; k < 500; k++) {
      const n = 1 + Math.floor(next() * 8);
      const total = 1 + Math.floor(next() * 1_000_000);
      const members = ids(n);
      const equal = computeShares(total, "EQUAL", members.map((memberId) => ({ memberId })), members[0]);
      expect(equal.ok && sum(equal.shares)).toBe(total);

      const shares: SplitEntry[] = members.map((memberId) => ({ memberId, value: 1 + Math.floor(next() * 5) }));
      const bySh = computeShares(total, "SHARES", shares, members[0]);
      expect(bySh.ok && sum(bySh.shares)).toBe(total);

      // Percentages that add up to 100 with two decimals.
      const cuts = Array.from({ length: n - 1 }, () => Math.floor(next() * 10000)).sort((a, b) => a - b);
      const pct = [...cuts, 10000].map((c, i) => (c - (i ? [...cuts, 10000][i - 1] : 0)) / 100);
      const byPct = computeShares(total, "PERCENT", members.map((memberId, i) => ({ memberId, value: pct[i] })), members[0]);
      expect(byPct.ok && sum(byPct.shares)).toBe(total);
    }
  });

  it("never gives a member a negative or fractional amount", () => {
    const r = computeShares(101, "SHARES", [{ memberId: "a", value: 1 }, { memberId: "b", value: 0 }, { memberId: "c", value: 3 }], "a");
    expect(r.ok && r.shares.every((s) => Number.isInteger(s.owed) && s.owed >= 0)).toBe(true);
    expect(r.ok && r.shares[1].owed).toBe(0);
  });

  it("checks exact amounts and percentages", () => {
    expect(computeShares(100, "EXACT", [{ memberId: "a", value: 60 }, { memberId: "b", value: 30 }])).toMatchObject({ ok: false });
    expect(computeShares(100, "EXACT", [{ memberId: "a", value: 60 }, { memberId: "b", value: 40 }])).toMatchObject({ ok: true });
    expect(computeShares(100, "PERCENT", [{ memberId: "a", value: 60 }, { memberId: "b", value: 30 }])).toMatchObject({ ok: false });
    expect(computeShares(0, "EQUAL", [{ memberId: "a" }])).toMatchObject({ ok: false });
    expect(computeShares(100, "EQUAL", [])).toMatchObject({ ok: false });
    expect(computeShares(100, "EQUAL", [{ memberId: "a" }, { memberId: "a" }])).toMatchObject({ ok: false });
  });
});

describe("balances and settling", () => {
  it("nets what each person paid against what they owe, and settle-ups reduce it", () => {
    const shares = ids(3).map((memberId) => ({ memberId, owed: 100 }));
    const net = computeBalances(ids(3), [{ paidById: "m0", total: 300, shares }], []);
    expect(net).toEqual({ m0: 200, m1: -100, m2: -100 });
    const after = computeBalances(ids(3), [{ paidById: "m0", total: 300, shares }], [{ fromMemberId: "m1", toMemberId: "m0", amount: 100 }]);
    expect(after).toEqual({ m0: 100, m1: 0, m2: -100 });
  });

  it("simplifies to at most members minus one payments that clear everyone", () => {
    const next = rng(11);
    for (let k = 0; k < 300; k++) {
      const n = 2 + Math.floor(next() * 7);
      const members = ids(n);
      const expenses = Array.from({ length: 1 + Math.floor(next() * 6) }, () => {
        const total = 100 + Math.floor(next() * 100000);
        const payer = members[Math.floor(next() * n)];
        const r = computeShares(total, "SHARES", members.map((memberId) => ({ memberId, value: Math.floor(next() * 4) + (memberId === payer ? 1 : 0) })), payer);
        if (!r.ok) throw new Error("setup");
        return { paidById: payer, total, shares: r.shares };
      });
      const net = computeBalances(members, expenses, []);
      expect(Object.values(net).reduce((a, b) => a + b, 0)).toBe(0);
      const transfers = simplifyDebts(net);
      expect(transfers.length).toBeLessThanOrEqual(n - 1);
      const settled = computeBalances(members, expenses, transfers.map((t) => ({ fromMemberId: t.from, toMemberId: t.to, amount: t.amount })));
      expect(Object.values(settled).every((v) => v === 0)).toBe(true);
    }
  });
});

describe("convertMinor", () => {
  it("converts at a rate between currencies with different decimals", () => {
    expect(convertMinor(50000, "USD", "INR", 96)).toBe(4_800_000); // $500.00 at 96 = Rs 48,000.00
    expect(convertMinor(4_800_000, "INR", "JPY", 1.7)).toBe(81600);
    expect(convertMinor(12345, "INR", "INR", 5)).toBe(12345);
  });
});
