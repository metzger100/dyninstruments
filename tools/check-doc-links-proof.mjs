#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { check } from "linkinator";

const config = JSON.parse(fs.readFileSync("linkinator.config.json", "utf8"));

await expectPass({
  "a.md": "# A\n\n[valid](b.md#real-heading)\n[duplicate](b.md#repeat-1)\n[external](https://example.invalid/no-network)\n",
  "b.md": "# Real Heading\n\n# Repeat\n\n# Repeat\n"
}, true, "valid links and duplicate heading slugs");

await expectPass({
  "a.md": "# A\n\n[gone](missing.md)\n"
}, false, "missing local files");

await expectPass({
  "a.md": "# A\n\n[missing](b.md#missing-heading)\n",
  "b.md": "# B\n"
}, false, "missing local heading fragments");

console.log("Linkinator fixture proofs passed: files, fragments, duplicate slugs, and external skips.");

async function expectPass(files, expected, label) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-linkinator-proof-"));
  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content);
  }

  try {
    const result = await check({
      ...config,
      path: ["a.md"],
      serverRoot: root
    });
    if (result.passed !== expected) {
      throw new Error(`Linkinator ${label} proof expected passed=${expected}, received passed=${result.passed}`);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
