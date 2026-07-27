#!/usr/bin/env node
/**
 * @file complexity-capture-integrity - Portable, git-free digest proof for the committed historical complexity capture
 * Documentation: documentation/conventions/quality-gates.md
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const findingsPath = path.join(root, "tools/quality-policy/historical-complexity-findings.json");
const CAPTURED_FINDINGS_SHA256 = "6cb1b99a13afea4bc95111d76bef23cd8b6f23ae23cbf038049835046d0dd207";

/** @returns {string} */
function computeDigest() {
  return createHash("sha256").update(fs.readFileSync(findingsPath)).digest("hex");
}

const actualDigest = computeDigest();
if (actualDigest !== CAPTURED_FINDINGS_SHA256) {
  console.error(
    "Historical complexity capture differs from its independently anchored digest. " +
      "This check runs without Git history; regenerate and compare the capture with " +
      "'node tools/quality-policy/historical-complexity-capture.mjs --check' (a maintainer-only audit " +
      "command that does require full Git history) to diagnose drift, then update this script's " +
      "CAPTURED_FINDINGS_SHA256 only after confirming the regenerated capture is legitimate."
  );
  process.exit(1);
}

console.log(`Historical complexity capture digest verified (${actualDigest}).`);
console.log(`SUMMARY_JSON=${JSON.stringify({ ok: true, digest: actualDigest })}`);
