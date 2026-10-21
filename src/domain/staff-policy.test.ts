import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { can, PERMISSIONS } from "./staff-policy.ts";

describe("can", () => {
  it("gives students nothing", () => {
    for (const p of PERMISSIONS) assert.equal(can("STUDENT", p), false);
  });
  it("gives admission staff every permission (PROPOSED single staff role)", () => {
    for (const p of PERMISSIONS) assert.equal(can("ADMISSION_STAFF", p), true);
  });
  it("denies by default for unknown, empty or prototype-like roles", () => {
    for (const role of [undefined, null, "", "admin", "ADMIN", "toString", "__proto__", "constructor"]) {
      for (const p of PERMISSIONS) assert.equal(can(role, p), false, String(role));
    }
  });
});
