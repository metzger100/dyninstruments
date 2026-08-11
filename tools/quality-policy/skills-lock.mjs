#!/usr/bin/env node

/**
 * @file Regenerates the local agent-skill digest lock.
 * Documentation: documentation/conventions/quality-gates.md
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const LOCK_PATH = "skills-lock.json";

/** @param {string} filePath @returns {string} */
function digest(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

/** @param {{root?: string, write?: boolean, print?: boolean}} [options] */
export function runSkillsLock({ root = ROOT, write = false, print = true } = {}) {
  const lockPath = path.join(root, LOCK_PATH);
  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  if (!lock || typeof lock.skills !== "object" || Array.isArray(lock.skills)) {
    throw new Error("skills-lock.json must contain an object-valued skills map");
  }
  const next = structuredClone(lock);
  for (const [name, entry] of Object.entries(next.skills)) {
    if (!entry || typeof entry.source !== "string") throw new Error(`skills-lock entry ${name} has no source`);
    const skillPath = path.join(root, entry.source, "SKILL.md");
    if (!fs.existsSync(skillPath) || !fs.statSync(skillPath).isFile()) {
      throw new Error(`skills-lock entry ${name} points to a missing skill file: ${entry.source}/SKILL.md`);
    }
    entry.sourceType = "local";
    entry.computedHash = digest(skillPath);
  }
  const expected = `${JSON.stringify(next, null, 2)}\n`;
  const current = fs.readFileSync(lockPath, "utf8");
  const matches = current === expected;
  if (write) fs.writeFileSync(lockPath, expected, "utf8");
  const ok = write || matches;
  if (print) console.log(`SUMMARY_JSON=${JSON.stringify({ ok, write, entries: Object.keys(next.skills).length })}`);
  return { ok, lock: next };
}

if (import.meta.url === pathToFileURL(path.resolve(process.argv[1] || "")).href) {
  const write = process.argv.includes("--write");
  process.exitCode = runSkillsLock({ write }).ok ? 0 : 1;
}
