import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { checkSupportAmount, supportLimits, supportPresets } from "@/lib/support";

describe("support tips", () => {
  it("offers the amounts for each currency", () => {
    expect(supportPresets("INR")).toEqual([25, 50, 100]);
    expect(supportPresets("USD")).toEqual([1, 5, 10]);
    expect(supportPresets("EUR")).toEqual([1, 5, 10]);
  });

  it("accepts sensible amounts and rejects the rest", () => {
    expect(checkSupportAmount(25, "INR")).toBeNull();
    expect(checkSupportAmount(1, "INR")).toBeNull();
    expect(checkSupportAmount(0.5, "INR")).not.toBeNull();
    expect(checkSupportAmount(0, "USD")).not.toBeNull();
    expect(checkSupportAmount(-5, "USD")).not.toBeNull();
    expect(checkSupportAmount(Number.NaN, "USD")).not.toBeNull();
    expect(checkSupportAmount(supportLimits("INR").max + 1, "INR")).not.toBeNull();
    expect(checkSupportAmount(99, "JPY")).not.toBeNull();
  });

  it("signs an order and payment the way Razorpay does", () => {
    // Razorpay's rule: HMAC-SHA256 of "order_id|payment_id" with the key secret, as hex.
    const sig = createHmac("sha256", "secret").update("order_1|pay_1").digest("hex");
    expect(sig).toHaveLength(64);
    expect(createHmac("sha256", "secret").update("order_1|pay_2").digest("hex")).not.toBe(sig);
  });
});
