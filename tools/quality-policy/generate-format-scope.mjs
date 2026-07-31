#!/usr/bin/env node

/**
 * @file Generates the formatter disposition from a local scope profile and filesystem discovery.
 * Documentation: documentation/conventions/quality-gates.md
 */

import fs from "node:fs";
import path from "node:path";
import { readVersionedProfile } from "./profile-schema.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const OUTPUT_PATH = path.join(ROOT, "tools", "quality-policy", "format-scope.json");
const PROFILE_PATH = "tools/quality-policy/project-format-scope.json";

/**
 * Build the canonical format-scope classification for every maintained filesystem file.
 * @param {string} [projectRoot]
 * @returns {{path: string, owner: string, reason?: string, alternateValidation?: string}[]}
 */
export function buildFormatScope(projectRoot = ROOT) {
  const profile = readProfile(projectRoot);
  const discovered = discoverMaintainedFiles(projectRoot);
  /** @type {{path: string, owner: string, reason?: string, alternateValidation?: string}[]} */
  const rows = [];
  for (const relativePath of discovered) {
    if (profile.historicalExclusionPatterns.some((pattern) => new RegExp(pattern).test(relativePath))) continue;
    const entry = classify(relativePath, profile);
    rows.push({ path: relativePath, ...entry });
  }
  return rows.sort((left, right) => left.path.localeCompare(right.path));
}

/** @param {string} projectRoot @returns {FormatScopeProfile} */
function readProfile(projectRoot) {
  const profile = readVersionedProfile(path.join(projectRoot, PROFILE_PATH), [
    "historicalExclusionPatterns",
    "gitkeepPaths",
    "rules"
  ]);
  if (!Array.isArray(profile.historicalExclusionPatterns) || !Array.isArray(profile.rules)) {
    throw new Error("Invalid format-scope profile: expected historicalExclusionPatterns and rules arrays.");
  }
  return profile;
}

/** @param {string} relativePath @param {FormatScopeProfile} profile @returns {{owner: string, reason?: string, alternateValidation?: string}} */
function classify(relativePath, profile) {
  if (profile.gitkeepPaths.includes(relativePath)) {
    return { owner: "unsupported", reason: "Empty placeholder file", alternateValidation: "none needed" };
  }
  const rule = profile.rules.find((candidate) => new RegExp(candidate.pattern).test(relativePath));
  if (!rule)
    return {
      owner: "unsupported",
      reason: "Unclassified file requires an explicit disposition",
      alternateValidation: "reviewed on change"
    };
  /** @type {{owner: "prettier" | "unsupported", reason?: string, alternateValidation?: string}} */
  const classification = { owner: rule.owner };
  if (rule.reason !== undefined) classification.reason = rule.reason;
  if (rule.alternateValidation !== undefined) classification.alternateValidation = rule.alternateValidation;
  return classification;
}

/** @param {string} projectRoot @returns {string[]} */
function discoverMaintainedFiles(projectRoot) {
  const excludedDirectories = new Set([".git", ".kilo", ".vscode", "artifacts", "coverage", "node_modules"]);
  /** @type {string[]} */
  const paths = [];
  /** @param {string} currentDirectory */
  function visit(currentDirectory) {
    for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      const absolutePath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        if (!excludedDirectories.has(entry.name)) visit(absolutePath);
        continue;
      }
      if (entry.isFile()) paths.push(path.relative(projectRoot, absolutePath).replaceAll(path.sep, "/"));
    }
  }
  visit(projectRoot);
  return [...new Set(paths)].sort();
}

/** @typedef {{ pattern: string, owner: "prettier" | "unsupported", reason?: string, alternateValidation?: string }} FormatRule */
/** @typedef {{ historicalExclusionPatterns: string[], gitkeepPaths: string[], rules: FormatRule[] }} FormatScopeProfile */

function main() {
  const rows = buildFormatScope();
  /** @type {Record<string, number>} */
  const byOwner = {};
  for (const row of rows) byOwner[row.owner] = (byOwner[row.owner] || 0) + 1;
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ rows, countByOwner: byOwner }, null, 2) + "\n");
  console.log(`format-scope: wrote ${rows.length} rows (${JSON.stringify(byOwner)}) to ${OUTPUT_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
