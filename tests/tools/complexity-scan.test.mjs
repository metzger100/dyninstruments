/**
 * Self-tests for tools/quality-policy/complexity-scan.mjs, the ESLint-driven complexity scanner
 * behind check:complexity.
 */

import assert from "node:assert/strict";
import { test } from "vitest";

import { scanSource, STRICT_LIMITS } from "../../tools/quality-policy/complexity-scan.mjs";

test("reports no findings for a trivially simple function", () => {
  const findings = scanSource("function add(a, b) {\n  return a + b;\n}\n", "sample.js");
  assert.deepEqual(findings, []);
});

test("flags a function exceeding the max-statements limit", () => {
  const statements = Array.from(
    { length: STRICT_LIMITS["max-statements"] + 5 },
    (_, index) => `  const v${index} = ${index};`
  );
  const code = `function overloaded() {\n${statements.join("\n")}\n}\n`;
  const findings = scanSource(code, "sample.js");
  const finding = findings.find((entry) => entry.metric === "max-statements");
  assert.ok(finding, "expected a max-statements finding");
  assert.equal(finding.identity, "overloaded");
  assert.equal(finding.limit, STRICT_LIMITS["max-statements"]);
  assert.ok(finding.value > finding.limit);
});
