import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { derivePaymentStatus } from "./payment-summary.ts";

const at = (m: number) => new Date(Date.UTC(2026, 9, 22, 0, m));

describe("derivePaymentStatus", () => {
  it("is NOT_STARTED without attempts", () => {
    assert.equal(derivePaymentStatus([]), "NOT_STARTED");
  });
  it("PAID wins over a newer non-paid attempt", () => {
    const s = derivePaymentStatus([
      { status: "PAID", createdAt: at(1) },
      { status: "PENDING", createdAt: at(9) },
    ]);
    assert.equal(s, "PAID");
  });
  it("otherwise uses the most recent attempt regardless of array order", () => {
    const s = derivePaymentStatus([
      { status: "PENDING", createdAt: at(9) },
      { status: "EXPIRED", createdAt: at(1) },
    ]);
    assert.equal(s, "PENDING");
  });
});
