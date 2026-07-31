#!/usr/bin/env node

/**
 * @file check-generic-surface - Genericness token scanner for the Tier 1 shared-core surface
 * Documentation: documentation/conventions/quality-gates.md
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readJsonPolicy } from "./quality-policy/read-json-policy.mjs";

const AGENTS_PATH = "AGENTS.md";
const BEGIN_MARKER = "<!-- BEGIN SHARED_INSTRUCTIONS -->";
const END_MARKER = "<!-- END SHARED_INSTRUCTIONS -->";
const GENERIC_SKILLS = ["preflight", "create-plan", "doc-sync", "scan-smells", "grill-me-repo"];
const GENERIC_RULE_DEFINITIONS_DIR = "tools/check-patterns/generic";

const TIER1_TOOL_MODULES = [
  "tools/check-patterns.mjs",
  "tools/check-patterns/shared.mjs",
  "tools/check-patterns/shared-source-scan.mjs",
  "tools/check-patterns/shared-suppressions.mjs",
  "tools/check-patterns/ast-utils.mjs",
  "tools/check-patterns/duplicate-utils.mjs",
  "tools/check-patterns/atomicity-parser.mjs",
  "tools/check-patterns/rules.mjs",
  "tools/check-patterns/rule-policy.mjs"
];

/** @typedef {{ target: string, token: string }} GenericSurfaceFinding */
/** @typedef {{ ok: boolean, checkedTargets: number, findings: number, warn: boolean }} GenericSurfaceSummary */
/** @typedef {{ root?: string, print?: boolean, warn?: boolean, patternEngineOnly?: boolean }} GenericSurfaceCheckOptions */
/** @typedef {{ name: string, content: string, genericDefinitions?: boolean }} ScanTarget */

/**
 * @param {GenericSurfaceCheckOptions} [options]
 * @returns {{ summary: GenericSurfaceSummary, findings: GenericSurfaceFinding[] }}
 */
export function runGenericSurfaceCheck(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  const warn = Boolean(options.warn);
  const tokens = loadTokens(root);
  const targets = collectTargets(root, options.patternEngineOnly === true);

  /** @type {GenericSurfaceFinding[]} */
  const findings = [];
  for (const target of targets) {
    const haystack = scanContent(target).toLowerCase();
    for (const token of tokens) {
      if (haystack.includes(token.toLowerCase())) findings.push({ target: target.name, token });
    }
  }

  const ok = warn || findings.length === 0;
  const summary = {
    ok,
    checkedTargets: targets.length,
    findings: findings.length,
    warn
  };

  if (options.print !== false) printFindings(findings, summary, warn);

  return { summary, findings };
}

/** @param {GenericSurfaceFinding[]} findings @param {GenericSurfaceSummary} summary @param {boolean} warn @returns {void} */
function printFindings(findings, summary, warn) {
  const prefix = warn ? "[generic-surface-warn]" : "[generic-surface]";
  const print = warn ? console.log : console.error;
  for (const finding of findings) {
    print(`${prefix} ${finding.target}: contains project-specific token '${finding.token}'`);
  }
  const printSummary = summary.ok ? console.log : console.error;
  printSummary("SUMMARY_JSON=" + JSON.stringify(summary));
}

/** @param {string} root @returns {string[]} */
function loadTokens(root) {
  const data = readJsonPolicy(path.join(root, "tools/quality-policy/generic-tokens.json"));
  return [...data.projectTokens, ...data.domainTokens, ...data.hostTokens];
}

/** @param {string} root @param {boolean} patternEngineOnly @returns {ScanTarget[]} */
function collectTargets(root, patternEngineOnly) {
  /** @type {ScanTarget[]} */
  const targets = [];

  if (!patternEngineOnly) {
    targets.push({
      name: "AGENTS.md#SHARED_INSTRUCTIONS",
      content: extractSharedInstructionsBlock(fs.readFileSync(path.join(root, AGENTS_PATH), "utf8"))
    });

    for (const skill of GENERIC_SKILLS) {
      const rel = `.agents/skills/${skill}/SKILL.md`;
      targets.push({ name: rel, content: fs.readFileSync(path.join(root, rel), "utf8") });
    }
  }

  for (const rel of TIER1_TOOL_MODULES) {
    targets.push({ name: rel, content: fs.readFileSync(path.join(root, rel), "utf8") });
  }

  const genericRulesDir = path.join(root, GENERIC_RULE_DEFINITIONS_DIR);
  for (const entry of fs.readdirSync(genericRulesDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".mjs")) continue;
    const rel = `${GENERIC_RULE_DEFINITIONS_DIR}/${entry.name}`;
    targets.push({ name: rel, content: fs.readFileSync(path.join(root, rel), "utf8"), genericDefinitions: true });
  }

  return targets;
}

/** @param {ScanTarget} target @returns {string} */
function scanContent(target) {
  if (!target.genericDefinitions) return target.content;
  return target.content.replace(/name:\s*"[^"]+"/g, 'name: "<canonical-rule-id>"');
}

/** @param {string} content @returns {string} */
function extractSharedInstructionsBlock(content) {
  const begin = content.indexOf(BEGIN_MARKER);
  const end = content.indexOf(END_MARKER);
  if (begin === -1 || end === -1) {
    throw new Error("AGENTS.md is missing the SHARED_INSTRUCTIONS marker pair.");
  }
  return content.slice(begin + BEGIN_MARKER.length, end);
}

/** @param {string[]} [argv] @returns {void} */
export function runGenericSurfaceCheckCli(argv = process.argv.slice(2)) {
  const warn = argv.includes("--warn");
  const patternEngineOnly = argv.includes("--pattern-engine-only");
  const { summary } = runGenericSurfaceCheck({ root: process.cwd(), warn, patternEngineOnly, print: true });
  process.exit(summary.ok ? 0 : 1);
}

/** @returns {boolean} */
function isCliEntrypoint() {
  if (!process.argv[1]) return false;
  return pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
}

if (isCliEntrypoint()) {
  runGenericSurfaceCheckCli();
}
