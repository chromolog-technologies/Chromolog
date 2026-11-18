// Checks that the invoice editor works out GST exactly like the server does.
// Both sides read the same cases (growth-api/tests/fixtures/gst-cases.json). Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calcLines } from "./gst.js";

const cases = JSON.parse(readFileSync(new URL("../../../growth-api/tests/fixtures/gst-cases.json", import.meta.url), "utf8"));

for (const c of cases) {
  test(c.name, () => {
    const r = calcLines(c.items, c.supply_type, c.reverse_charge);
    assert.deepEqual(
      { taxable: r.taxable, cgst: r.cgst, sgst: r.sgst, igst: r.igst, tax: r.tax, total: r.total },
      c.expect,
    );
  });
}
