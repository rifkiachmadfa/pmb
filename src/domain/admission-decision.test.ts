import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DECISION_NOTE_MAX_LENGTH,
  evaluateDecision,
  normalizeNote,
  type DecisionFacts,
} from "./admission-decision.ts";

const base: DecisionFacts = {
  registrationStatus: "SUBMITTED",
  currentStatus: "PENDING",
  targetStatus: "ACCEPTED",
  note: null,
  actorAccountId: "staff-1",
  registrationOwnerId: "student-1",
  paymentVerified: false,
};
const facts = (o: Partial<DecisionFacts>): DecisionFacts => ({ ...base, ...o });

describe("evaluateDecision", () => {
  it("allows PENDING -> ACCEPTED and PENDING -> REJECTED without a note", () => {
    for (const target of ["ACCEPTED", "REJECTED"] as const) {
      const r = evaluateDecision(facts({ targetStatus: target }));
      assert.deepEqual(r, { ok: true, fromStatus: "PENDING", toStatus: target, note: null });
    }
  });

  it("does NOT require payment by default (open business question)", () => {
    assert.equal(evaluateDecision(facts({ paymentVerified: false })).ok, true);
  });

  it("requires payment for ACCEPTED only when the option is on; never for REJECTED/PENDING", () => {
    const on = { requirePaidForAcceptance: true };
    assert.deepEqual(evaluateDecision(facts({}), on), { ok: false, reason: "payment_not_verified" });
    assert.equal(evaluateDecision(facts({ paymentVerified: true }), on).ok, true);
    assert.equal(evaluateDecision(facts({ targetStatus: "REJECTED" }), on).ok, true);
  });

  it("rejects an unsubmitted registration", () => {
    assert.deepEqual(evaluateDecision(facts({ registrationStatus: "DRAFT" })), {
      ok: false,
      reason: "registration_not_submitted",
    });
  });

  it("rejects staff deciding their own registration", () => {
    assert.deepEqual(evaluateDecision(facts({ registrationOwnerId: "staff-1" })), {
      ok: false,
      reason: "self_decision_forbidden",
    });
  });

  it("rejects a no-op (same status)", () => {
    assert.deepEqual(evaluateDecision(facts({ targetStatus: "PENDING" })), {
      ok: false,
      reason: "same_status",
    });
  });

  it("requires a real note when correcting an existing decision", () => {
    const correcting = { currentStatus: "ACCEPTED", targetStatus: "REJECTED" } as const;
    for (const note of [null, "", "   ", "abc"]) {
      assert.deepEqual(evaluateDecision(facts({ ...correcting, note })), {
        ok: false,
        reason: "note_required",
      });
    }
    const ok = evaluateDecision(facts({ ...correcting, note: "  Berkas tidak lengkap  " }));
    assert.deepEqual(ok, {
      ok: true,
      fromStatus: "ACCEPTED",
      toStatus: "REJECTED",
      note: "Berkas tidak lengkap",
    });
  });

  it("allows reverting a decision to PENDING only with a reason", () => {
    const a = evaluateDecision(facts({ currentStatus: "ACCEPTED", targetStatus: "PENDING" }));
    assert.deepEqual(a, { ok: false, reason: "note_required" });
    const b = evaluateDecision(
      facts({ currentStatus: "ACCEPTED", targetStatus: "PENDING", note: "Salah klik" }),
    );
    assert.equal(b.ok, true);
  });

  it("rejects an over-long note instead of truncating it", () => {
    const long = "x".repeat(DECISION_NOTE_MAX_LENGTH + 1);
    assert.deepEqual(evaluateDecision(facts({ note: long })), { ok: false, reason: "note_too_long" });
    assert.equal(evaluateDecision(facts({ note: "x".repeat(DECISION_NOTE_MAX_LENGTH) })).ok, true);
  });

  it("is not influenced by payment when the decision is otherwise valid (payment never auto-decides)", () => {
    // A pure function cannot change status; this pins that paymentVerified alone never yields a status.
    const r = evaluateDecision(facts({ paymentVerified: true, targetStatus: "PENDING" }));
    assert.deepEqual(r, { ok: false, reason: "same_status" });
  });
});

describe("normalizeNote", () => {
  it("trims and maps empty to null", () => {
    assert.equal(normalizeNote(undefined), null);
    assert.equal(normalizeNote("   "), null);
    assert.equal(normalizeNote("  a b  "), "a b");
  });
});
