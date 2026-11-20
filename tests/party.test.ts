import { describe, expect, it } from "vitest";
import { looksLikeBank, looksLikeSame, normalizeName } from "@/lib/party";

describe("looksLikeBank", () => {
  it("recognises bank names without asking", () => {
    for (const name of ["IOB", "SBI", "sbi card", "HDFC Bank", "ICICI", "Axis Bank", "Bank of Baroda", "Yes Bank", "Union Bank of India", "Kotak Mahindra", "Canara Bank", "Indian Bank"]) {
      expect(looksLikeBank(name), name).toBe(true);
    }
  });
  it("does not mistake people and shops for banks", () => {
    for (const name of ["Bob", "Axis cafe", "Ramesh", "Swiggy", "Union Square Cafe", "Central Park Grocers", "Yes Mart", "Indian Oil"]) {
      expect(looksLikeBank(name), name).toBe(false);
    }
  });
  it("ignores case, punctuation and spacing", () => {
    expect(looksLikeBank("  H.D.F.C  bank ")).toBe(true);
    expect(looksLikeBank("")).toBe(false);
  });
});

describe("names", () => {
  it("treats the same name written differently as one", () => {
    expect(normalizeName("  Ramesh K. ")).toBe("ramesh k");
    expect(looksLikeSame("ramesh", "ramesh k")).toBe(true);
    expect(looksLikeSame("anitha", "anita")).toBe(true);
    expect(looksLikeSame("ravi", "rahul")).toBe(false);
  });
});
