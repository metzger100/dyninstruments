#!/usr/bin/env node

/**
 * @file Machine-readable disposition of every maintained file: `prettier` or `unsupported`
 * (with an exact reason and alternate validation owner). Discovers files via
 * `git ls-files --cached --others --exclude-standard` (tracked plus untracked-but-not-ignored)
 * rather than a hand-maintained glob list, so a new file is classified automatically and the
 * format-scope contract test fails closed on anything genuinely unmatched.
 *
 * Historical/generated exclusions (release ZIPs/notes, completed plans, `.gitkeep` placeholders)
 * are a separate, narrow exclusion list, not "unsupported maintained files" — they are not
 * maintained inputs at all.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const OUTPUT_PATH = path.join(ROOT, "tools", "quality-policy", "format-scope.json");

const HISTORICAL_EXCLUSION_PATTERNS = [/^releases\//, /^exec-plans\/completed\//];
const GITKEEP_PATHS = new Set(["exec-plans/active/.gitkeep", "releases/.gitkeep"]);

const PRETTIER_EXACT_FILES = new Set([
  "package.json",
  "package-lock.json",
  ".prettierrc.json",
  ".stylelintrc.json",
  ".markdownlint-cli2.jsonc",
  "jscpd.config.json",
  "eslint.config.mjs",
  "tsconfig.checkjs.json",
  "tsconfig.tests.json",
  "tsconfig.tools.json",
  "vitest.config.js",
  "plugin.js",
  "plugin.mjs",
  "plugin.css"
]);

/** @type {{test: (p: string) => boolean}[]} */
const PRETTIER_DIR_RULES = [
  { test: (p) => /^\.github\/workflows\/.*\.yml$/.test(p) },
  { test: (p) => /^types\/.*\.d\.ts$/.test(p) },
  { test: (p) => /^schemas\/[^/]+\.json$/.test(p) },
  { test: (p) => /^(runtime|cluster|config|shared|widgets|tests|tools)\/.*\.js$/.test(p) },
  { test: (p) => /^(tools|tests)\/.*\.mjs$/.test(p) },
  { test: (p) => /^(shared|widgets)\/.*\.css$/.test(p) },
  { test: (p) => /^tests\/css\/.*\.css$/.test(p) },
  { test: (p) => /^[^/]+\.md$/.test(p) },
  { test: (p) => /^documentation\/.*\.md$/.test(p) },
  { test: (p) => /^\.agents\/skills\/.*\.md$/.test(p) },
  { test: (p) => /^exec-plans\/active\/.*\.md$/.test(p) },
  { test: (p) => /^\.githooks\/.*\.md$/.test(p) }
];

const QUALITY_POLICY_JSON_REASON =
  "quality-policy data file read directly by its owning tools/quality-policy/*.mjs checker; reformatting is a reviewed policy-data decision, not an automated one";

/**
 * @param {string} relativePath
 * @returns {{owner: "prettier" | "unsupported", reason?: string, alternateValidation?: string} | null}
 */
function classify(relativePath) {
  if (GITKEEP_PATHS.has(relativePath)) {
    return { owner: "unsupported", reason: "empty placeholder file", alternateValidation: "none needed" };
  }
  if (relativePath === "tools/quality-policy/shared-instructions.md") {
    return {
      owner: "unsupported",
      reason: "extracted byte-for-byte verification artifact; whitespace is part of the checked content",
      alternateValidation: "shared-instructions-block contract test"
    };
  }
  if (PRETTIER_EXACT_FILES.has(relativePath)) return { owner: "prettier" };
  if (PRETTIER_DIR_RULES.some((rule) => rule.test(relativePath))) return { owner: "prettier" };

  if (relativePath === "plugin.json") {
    return {
      owner: "unsupported",
      reason: "AvNav plugin manifest validated by Ajv against the base plugin schema",
      alternateValidation: "npm run schema:check"
    };
  }
  if (/^layouts\/.*\.json$/.test(relativePath)) {
    return {
      owner: "unsupported",
      reason: "user-facing layout data validated by Ajv against layout.schema.json",
      alternateValidation: "npm run schema:check"
    };
  }
  if (relativePath === "tests/layouts/gpspage-all-widgets.json") {
    return {
      owner: "unsupported",
      reason: "showcase-layout test fixture; content is asserted directly by its owning test",
      alternateValidation: "tests/layouts/gpspage-all-widgets.test.js"
    };
  }
  if (relativePath === "skills-lock.json") {
    return {
      owner: "unsupported",
      reason: "vendored skill-lock manifest with a pinned SHA-256 per entry; reformatting is a reviewed decision",
      alternateValidation: "the skill-lock shape/hash contract test"
    };
  }
  if (relativePath === "linkinator.config.json") {
    return {
      owner: "unsupported",
      reason: "consumed directly by the docs:links tooling; not yet brought under Prettier",
      alternateValidation: "npm run docs:links"
    };
  }
  if (/^tools\/quality-policy\/.*\.json$/.test(relativePath)) {
    return { owner: "unsupported", reason: QUALITY_POLICY_JSON_REASON, alternateValidation: "npm run check:core" };
  }
  if (relativePath === ".codex/config.toml") {
    return {
      owner: "unsupported",
      reason: "Prettier has no built-in TOML support and no TOML plugin is in this inventory",
      alternateValidation: "reviewed on change; byte-identical across the paired repository"
    };
  }
  if (relativePath.endsWith(".zip") || relativePath.endsWith(".woff2") || relativePath.endsWith(".dat")) {
    return {
      owner: "unsupported",
      reason: "binary asset; not formattable",
      alternateValidation: "reviewed on change"
    };
  }
  if (relativePath.endsWith(".sh") || relativePath === ".githooks/pre-push") {
    return {
      owner: "unsupported",
      reason: "no maintained shell formatter in this inventory",
      alternateValidation: "bash -n syntax check"
    };
  }
  if (
    relativePath === ".gitignore" ||
    relativePath === ".gitattributes" ||
    relativePath === ".prettierignore" ||
    relativePath === ".stylelintignore" ||
    relativePath === ".nvmrc"
  ) {
    return {
      owner: "unsupported",
      reason: "plain dotfile with no maintained formatter target",
      alternateValidation: "reviewed on change"
    };
  }
  if (relativePath.endsWith(".txt")) {
    return {
      owner: "unsupported",
      reason: "vendored third-party asset license text; not a maintained input",
      alternateValidation: "reviewed on change"
    };
  }
  if (relativePath.endsWith(".json") || relativePath.endsWith(".jsonc")) {
    return { owner: "unsupported", reason: QUALITY_POLICY_JSON_REASON, alternateValidation: "npm run check:core" };
  }
  return { owner: "unsupported", reason: "unclassified — requires an explicit disposition" };
}

/**
 * Build the canonical format-scope classification for every tracked/untracked-but-not-ignored file.
 * @param {string} [projectRoot]
 * @returns {{path: string, owner: string, reason?: string, alternateValidation?: string}[]}
 */
export function buildFormatScope(projectRoot = ROOT) {
  const discovered = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: projectRoot,
    encoding: "utf8"
  })
    .split("\n")
    .filter(Boolean)
    .filter((relativePath) => fs.existsSync(path.join(projectRoot, relativePath)));
  const tracked = [...new Set(discovered)].sort();
  /** @type {{path: string, owner: string, reason?: string, alternateValidation?: string}[]} */
  const rows = [];
  for (const relativePath of tracked) {
    if (HISTORICAL_EXCLUSION_PATTERNS.some((pattern) => pattern.test(relativePath))) continue;
    const entry = classify(relativePath);
    if (entry === null) continue;
    rows.push({ path: relativePath, ...entry });
  }
  return rows.sort((a, b) => a.path.localeCompare(b.path));
}

function main() {
  const rows = buildFormatScope();
  const unclassified = rows.filter((row) => row.owner === "unsupported" && !row.reason);
  if (unclassified.length > 0) {
    console.error("format-scope: unclassified files require an explicit disposition:");
    for (const row of unclassified) console.error(`  ${row.path}`);
    process.exitCode = 1;
    return;
  }
  /** @type {Record<string, number>} */
  const byOwner = {};
  for (const row of rows) byOwner[row.owner] = (byOwner[row.owner] || 0) + 1;
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ rows, countByOwner: byOwner }, null, 2) + "\n");
  console.log(`format-scope: wrote ${rows.length} rows (${JSON.stringify(byOwner)}) to ${OUTPUT_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
