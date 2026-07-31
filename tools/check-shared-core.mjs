#!/usr/bin/env node

/**
 * @file check-shared-core - Verifies the Tier 1 generic-surface manifest against disk
 * Documentation: documentation/conventions/quality-gates.md
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { readJsonPolicy } from "./quality-policy/read-json-policy.mjs";

const MANIFEST_PATH = "tools/quality-policy/shared-core-manifest.json";

/** @typedef {{ path: string, kind: "missing"|"mismatch"|"unlisted", detail?: string }} SharedCoreFinding */
/** @typedef {{ ok: boolean, checkedEntries: number, findings: number }} SharedCoreSummary */
/** @typedef {{ root?: string, print?: boolean, knownTier1Paths?: string[] }} SharedCoreCheckOptions */

/**
 * @param {SharedCoreCheckOptions} [options]
 * @returns {{ summary: SharedCoreSummary, findings: SharedCoreFinding[] }}
 */
export function runSharedCoreCheck(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  const knownTier1Paths = options.knownTier1Paths || [];
  const manifest = readJsonPolicy(path.join(root, MANIFEST_PATH));
  const entries = manifest.entries || {};

  /** @type {SharedCoreFinding[]} */
  const findings = [];

  for (const [relativePath, expectedDigest] of Object.entries(entries)) {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) {
      findings.push({ path: relativePath, kind: "missing" });
      continue;
    }
    const actualDigest = sha256File(absolutePath);
    if (actualDigest !== expectedDigest) {
      findings.push({
        path: relativePath,
        kind: "mismatch",
        detail: `expected ${expectedDigest}, found ${actualDigest}`
      });
    }
  }

  for (const relativePath of knownTier1Paths) {
    if (!Object.prototype.hasOwnProperty.call(entries, relativePath)) {
      findings.push({ path: relativePath, kind: "unlisted" });
    }
  }

  const summary = { ok: findings.length === 0, checkedEntries: Object.keys(entries).length, findings: findings.length };

  if (options.print !== false) printFindings(findings, summary);

  return { summary, findings };
}

/** @param {SharedCoreFinding[]} findings @param {SharedCoreSummary} summary @returns {void} */
function printFindings(findings, summary) {
  const messageByKind = {
    missing: "listed in the manifest but missing on disk",
    mismatch: "digest drift from the manifest",
    unlisted: "a known Tier 1 path missing from the manifest"
  };
  for (const finding of findings) {
    console.error(
      `[shared-core] ${finding.path}: ${messageByKind[finding.kind]}${finding.detail ? ` (${finding.detail})` : ""}`
    );
  }
  const printSummary = summary.ok ? console.log : console.error;
  printSummary("SUMMARY_JSON=" + JSON.stringify(summary));
}

/** @param {string} absolutePath @returns {string} */
function sha256File(absolutePath) {
  return createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");
}

/** @returns {void} */
export function runSharedCoreCheckCli() {
  const { summary } = runSharedCoreCheck({ root: process.cwd(), print: true });
  process.exit(summary.ok ? 0 : 1);
}

/** @returns {boolean} */
function isCliEntrypoint() {
  if (!process.argv[1]) return false;
  return pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
}

if (isCliEntrypoint()) {
  runSharedCoreCheckCli();
}
