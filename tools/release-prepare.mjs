import { spawnSync } from "node:child_process";

import { isRuntimePath } from "./release-zip-builder.mjs";
import { getUnexpectedDirtyPaths } from "./release-git.mjs";

const HELP = `Usage: npm run release:prepare

Prints JSON release evidence from Git history and requires a clean worktree.
No tracked or untracked worktree changes are allowed.

Examples:
  npm run release:prepare
  npm run release:prepare -- --help`;

/**
 * @typedef {(args: string[]) => string} RunGit
 */

/**
 * @typedef {object} ChangeSummary
 * @property {number} runtimeFilesChanged
 * @property {number} devOnlyFilesChanged
 * @property {number} newFiles
 * @property {number} deletedFiles
 */

/**
 * @typedef {object} SemverReview
 * @property {string} mode
 * @property {string} range
 * @property {null} automaticSuggestion
 * @property {string[]} decisionInputs
 * @property {string[]} reviewCommands
 */

/**
 * @typedef {object} ReleasePreparePayload
 * @property {string} plugin
 * @property {{ tag: string, date: string } | null} lastRelease
 * @property {string[]} commitsSinceLastRelease
 * @property {ChangeSummary} changeSummary
 * @property {string[]} runtimeChangedPaths
 * @property {string[]} changedPaths
 * @property {SemverReview} semverReview
 * @property {string} [help]
 */

/**
 * @typedef {object} ReleasePrepareOptions
 * @property {RunGit} [runGit]
 * @property {string} [pluginName]
 */

/**
 * @param {ReleasePrepareOptions} [options]
 * @returns {ReleasePreparePayload}
 */
export function buildReleasePreparePayload(options = {}) {
  const runGit = options.runGit || defaultRunGit;
  const pluginName = options.pluginName || "dyninstruments";

  const lastTag = readLatestTag(runGit);
  const lastRelease = lastTag
    ? {
        tag: lastTag,
        date: readTagDate(runGit, lastTag)
      }
    : null;

  const commitLines = readCommits(runGit, lastTag);
  const changedFiles = readChangedFiles(runGit, lastTag);

  const runtimeChangedPaths = [];
  const changedPaths = [];
  let runtimeFilesChanged = 0;
  let devOnlyFilesChanged = 0;
  let newFiles = 0;
  let deletedFiles = 0;

  for (const entry of changedFiles) {
    const normalizedPath = normalizeChangedPath(entry.path);
    changedPaths.push(normalizedPath);
    const runtime = isRuntimePath(normalizedPath);

    if (runtime) {
      runtimeFilesChanged += 1;
      runtimeChangedPaths.push(normalizedPath);
    } else {
      devOnlyFilesChanged += 1;
    }

    if (entry.status === "A") newFiles += 1;
    if (entry.status === "D") deletedFiles += 1;
  }

  const uniqueRuntimePaths = Array.from(new Set(runtimeChangedPaths)).sort((a, b) => a.localeCompare(b));
  const uniqueChangedPaths = Array.from(new Set(changedPaths)).sort((a, b) => a.localeCompare(b));

  return {
    plugin: pluginName,
    lastRelease,
    commitsSinceLastRelease: commitLines,
    changeSummary: {
      runtimeFilesChanged,
      devOnlyFilesChanged,
      newFiles,
      deletedFiles
    },
    runtimeChangedPaths: uniqueRuntimePaths,
    changedPaths: uniqueChangedPaths,
    semverReview: buildSemverReview(lastTag)
  };
}

/**
 * @param {string[]} [argv]
 * @returns {{ help: boolean, unknown: string[] }}
 */
export function parseReleasePrepareArgs(argv = []) {
  const unknown = argv.filter((arg) => arg !== "--help" && arg !== "-h");
  return {
    help: argv.includes("--help") || argv.includes("-h"),
    unknown
  };
}

/** @param {RunGit} runGit */
export function ensureCleanReleasePreparation(runGit) {
  const dirtyPaths = getUnexpectedDirtyPaths(runGit);
  if (dirtyPaths.length > 0) {
    throw new Error(
      "release:prepare aborted: working tree has release-relevant uncommitted changes:\n" +
        dirtyPaths.map((filePath) => `- ${filePath}`).join("\n")
    );
  }
}

/**
 * @param {string[]} [argv]
 * @param {ReleasePrepareOptions} [options]
 * @returns {ReleasePreparePayload | { help: string }}
 */
export function runReleasePrepare(argv = process.argv.slice(2), options = {}) {
  const args = parseReleasePrepareArgs(argv);
  if (args.help) return { help: HELP };
  if (args.unknown.length > 0) {
    throw new Error(`release:prepare: unknown argument '${args.unknown[0]}'\n\n${HELP}`);
  }

  const runGit = options.runGit || defaultRunGit;
  ensureCleanReleasePreparation(runGit);
  return buildReleasePreparePayload({ ...options, runGit });
}

const MANUAL_VALIDATION_CHECKLIST_PATH = "documentation/guides/manual-avnav-validation.md";

export function main(argv = process.argv.slice(2)) {
  try {
    const result = runReleasePrepare(argv);
    if (result.help) {
      process.stdout.write(result.help + "\n");
      return;
    }
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    console.error(`Manual AvNav validation checklist (not run automatically): ${MANUAL_VALIDATION_CHECKLIST_PATH}`);
  } catch (error) {
    console.error(/** @type {any} */ (error).message || String(error));
    process.exit(1);
  }
}

/** @param {RunGit} runGit @returns {string | null} */
function readLatestTag(runGit) {
  try {
    const out = runGit(["describe", "--tags", "--abbrev=0", "--match", "v*"]).trim();
    return out || null;
  } catch {
    return null;
  }
}

/** @param {RunGit} runGit @param {string} tag @returns {string} */
function readTagDate(runGit, tag) {
  return runGit(["log", "-1", "--format=%cs", tag]).trim();
}

/** @param {RunGit} runGit @param {string | null} lastTag @returns {string[]} */
function readCommits(runGit, lastTag) {
  const args = ["log", "--reverse", "--oneline"];
  if (lastTag) {
    args.push(`${lastTag}..HEAD`);
  } else {
    args.push("--root");
  }
  const out = runGit(args).trim();
  if (!out) return [];
  return out.split(/\r?\n/).filter(Boolean);
}

/**
 * @param {RunGit} runGit
 * @param {string | null} lastTag
 * @returns {{ status: string, path: string }[]}
 */
function readChangedFiles(runGit, lastTag) {
  const args = ["diff", "--name-status", "--find-renames"];
  if (lastTag) {
    args.push(`${lastTag}..HEAD`);
  } else {
    args.push("--root", "HEAD");
  }

  const out = runGit(args).trim();
  if (!out) return [];

  return out
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseNameStatusLine)
    .filter((entry) => entry !== null);
}

/** @param {string} line @returns {{ status: string, path: string } | null} */
function parseNameStatusLine(line) {
  const parts = line.split("\t");
  if (parts.length < 2) return null;

  const statusCode = parts[0];
  const status = statusCode.charAt(0);

  if (status === "R" || status === "C") {
    return {
      status,
      path: parts[parts.length - 1]
    };
  }

  return {
    status,
    path: parts[1]
  };
}

/** @param {string | null} lastTag @returns {SemverReview} */
function buildSemverReview(lastTag) {
  const range = lastTag ? `${lastTag}..HEAD` : "repository history";
  const reviewCommands = lastTag
    ? [
        `git log --reverse --oneline ${range}`,
        `git diff --stat --find-renames ${range}`,
        `git diff --name-status --find-renames ${range}`,
        `git diff --find-renames ${range}`
      ]
    : [
        "git log --reverse --oneline --root",
        "git diff --stat --find-renames --root HEAD",
        "git diff --name-status --find-renames --root HEAD",
        "git diff --find-renames --root HEAD"
      ];

  return {
    mode: "manual-codebase-review",
    range,
    automaticSuggestion: null,
    decisionInputs: [
      "Read commit messages as natural-language descriptions, not Conventional Commit syntax.",
      "Inspect changed files and relevant diffs.",
      "Research touched runtime/config/widget/documentation areas in the codebase.",
      "Classify SemVer from actual user-facing impact and compatibility."
    ],
    reviewCommands
  };
}

/** @param {string} filePath @returns {string} */
function normalizeChangedPath(filePath) {
  return String(filePath || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .trim();
}

/** @param {string[]} args @returns {string} */
function defaultRunGit(args) {
  const result = spawnSync("git", args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.status === 0) {
    return result.stdout || "";
  }

  const detail = [result.stdout, result.stderr]
    .filter((value) => typeof value === "string" && value.trim() !== "")
    .join("\n")
    .trim();
  throw new Error(`git ${args.join(" ")} failed${detail ? `\n${detail}` : ""}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
