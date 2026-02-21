#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const GUIDE_REL = "documentation/guides/garbage-collection.md";
const FULL_SHA_RE = /^[0-9a-f]{40}$/;
const ISO_UTC_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

export function runGcBaseline(argv = process.argv.slice(2), options = {}) {
  const ctx = createContext(options);
  const command = argv[0] || "--status";

  try {
    if (command === "--help" || command === "help") {
      const lines = usageLines();
      writeLines(lines, "stderr", ctx.print);
      return {
        ok: true,
        exitCode: 0,
        summary: { ok: true, action: "help", guide: GUIDE_REL }
      };
    }

    if (command === "--status" && argv.length === 1) {
      const result = runStatus(ctx);
      writeLines(result.lines, "stdout", ctx.print);
      return result;
    }

    if (command === "--update-head" && argv.length === 1) {
      const result = runUpdateHead(ctx);
      writeLines(result.lines, "stdout", ctx.print);
      return result;
    }

    if (command === "--set" && argv.length === 2) {
      const result = runSet(ctx, argv[1]);
      writeLines(result.lines, "stdout", ctx.print);
      return result;
    }

    const lines = usageLines();
    writeLines(lines, "stderr", ctx.print);
    return {
      ok: false,
      exitCode: 1,
      summary: { ok: false, reason: "invalid-usage", guide: GUIDE_REL }
    };
  }
  catch (error) {
    const failure = normalizeFailure(error);
    const lines = [failure.message];
    if (failure.summary) {
      lines.push("SUMMARY_JSON=" + JSON.stringify(failure.summary));
    }
    writeLines(lines, "stderr", ctx.print);
    return {
      ok: false,
      exitCode: 1,
      summary: failure.summary || { ok: false, guide: GUIDE_REL },
      errorMessage: failure.message
    };
  }
}

export function readBaselineMarker(root = process.cwd()) {
  const guidePath = path.join(root, GUIDE_REL);
  if (!fs.existsSync(guidePath)) {
    throw makeFailure(`[gc-baseline] Missing guide file: ${GUIDE_REL}`, {
      ok: false,
      reason: "missing-guide",
      guide: GUIDE_REL
    });
  }

  const content = fs.readFileSync(guidePath, "utf8");
  const commitMatches = [...content.matchAll(/^Baseline commit \(self-updating\): `([0-9a-f]{40})`$/gm)];
  const updatedMatches = [...content.matchAll(/^Baseline updated \(UTC\): `([^`]+)`$/gm)];

  if (commitMatches.length !== 1) {
    throw makeFailure(
      "[gc-baseline] Guide must contain exactly one marker line:\nBaseline commit (self-updating): `<40-char sha>`",
      {
        ok: false,
        reason: "invalid-commit-marker-count",
        guide: GUIDE_REL,
        found: commitMatches.length
      }
    );
  }
  if (updatedMatches.length !== 1) {
    throw makeFailure(
      "[gc-baseline] Guide must contain exactly one marker line:\nBaseline updated (UTC): `<ISO-8601>`",
      {
        ok: false,
        reason: "invalid-updated-marker-count",
        guide: GUIDE_REL,
        found: updatedMatches.length
      }
    );
  }

  const commit = commitMatches[0][1];
  const updated = updatedMatches[0][1];
  if (!FULL_SHA_RE.test(commit)) {
    throw makeFailure(`[gc-baseline] Invalid baseline commit format '${commit}'. Expected full 40-char SHA.`, {
      ok: false,
      reason: "invalid-commit-format",
      guide: GUIDE_REL,
      baselineCommit: commit
    });
  }
  if (!ISO_UTC_RE.test(updated)) {
    throw makeFailure(`[gc-baseline] Invalid baseline timestamp '${updated}'. Expected ISO-8601 UTC.`, {
      ok: false,
      reason: "invalid-updated-format",
      guide: GUIDE_REL,
      baselineUpdatedUtc: updated
    });
  }

  return { commit, updated, content };
}

export function writeBaselineMarker(root, commit, updatedUtc) {
  if (!FULL_SHA_RE.test(commit)) {
    throw makeFailure(`[gc-baseline] Refusing to write non-SHA baseline '${commit}'.`, {
      ok: false,
      reason: "invalid-write-commit",
      guide: GUIDE_REL,
      baselineCommit: commit
    });
  }
  if (!ISO_UTC_RE.test(updatedUtc)) {
    throw makeFailure(`[gc-baseline] Refusing to write non-ISO timestamp '${updatedUtc}'.`, {
      ok: false,
      reason: "invalid-write-updated",
      guide: GUIDE_REL,
      baselineUpdatedUtc: updatedUtc
    });
  }

  const guidePath = path.join(root, GUIDE_REL);
  const content = fs.readFileSync(guidePath, "utf8");
  let commitReplaced = 0;
  let updatedReplaced = 0;
  const next = content
    .replace(/^Baseline commit \(self-updating\): `([0-9a-f]{40})`$/gm, function () {
      commitReplaced += 1;
      return `Baseline commit (self-updating): \`${commit}\``;
    })
    .replace(/^Baseline updated \(UTC\): `([^`]+)`$/gm, function () {
      updatedReplaced += 1;
      return `Baseline updated (UTC): \`${updatedUtc}\``;
    });

  if (commitReplaced !== 1 || updatedReplaced !== 1) {
    throw makeFailure(
      "[gc-baseline] Could not update guide markers. Expected exactly one commit marker and one updated marker.",
      {
        ok: false,
        reason: "marker-rewrite-failed",
        guide: GUIDE_REL,
        commitReplaced,
        updatedReplaced
      }
    );
  }

  atomicWrite(guidePath, next);
}

function runStatus(ctx) {
  const marker = readBaselineMarker(ctx.root);
  const head = git(ctx, ["rev-parse", "HEAD"]).trim();

  if (!commitExists(ctx, marker.commit)) {
    throw makeFailure(
      `[gc-baseline] Stored baseline commit '${marker.commit}' does not exist in this repository.\nManual reset required: node tools/gc-baseline.mjs --set <commit>`,
      {
        ok: false,
        reason: "missing-baseline-commit",
        guide: GUIDE_REL,
        baselineCommit: marker.commit
      }
    );
  }

  const range = `${marker.commit}..${head}`;
  const rangeFiles = gitLines(ctx, ["diff", "--name-only", range]);
  const trackedWorkingTreeFiles = gitLines(ctx, ["diff", "--name-only", "HEAD"]);
  const untrackedWorkingTreeFiles = gitLines(ctx, ["ls-files", "--others", "--exclude-standard"]);
  const workingTreeFiles = sortedUnique([...trackedWorkingTreeFiles, ...untrackedWorkingTreeFiles]);
  const candidates = sortedUnique([...rangeFiles, ...workingTreeFiles]);

  const lines = [
    `Guide: ${GUIDE_REL}`,
    `Baseline commit: ${marker.commit}`,
    `Baseline updated (UTC): ${marker.updated}`,
    `Current HEAD: ${head}`,
    `Range: ${range}`,
    `Range files: ${rangeFiles.length}`,
    `Working tree files: ${workingTreeFiles.length}`,
    `Candidate files: ${candidates.length}`
  ];
  if (candidates.length) {
    lines.push("Candidate file list:");
    for (const file of candidates) lines.push(`  - ${file}`);
  }

  const summary = {
    ok: true,
    guide: GUIDE_REL,
    baselineCommit: marker.commit,
    baselineUpdatedUtc: marker.updated,
    headCommit: head,
    range,
    rangeFileCount: rangeFiles.length,
    workingTreeFileCount: workingTreeFiles.length,
    candidateFileCount: candidates.length,
    candidateFiles: candidates
  };
  lines.push("SUMMARY_JSON=" + JSON.stringify(summary));

  return { ok: true, exitCode: 0, summary, lines };
}

function runUpdateHead(ctx) {
  const marker = readBaselineMarker(ctx.root);
  if (!commitExists(ctx, marker.commit)) {
    throw makeFailure(
      `[gc-baseline] Stored baseline commit '${marker.commit}' does not exist in this repository.\nManual reset required: node tools/gc-baseline.mjs --set <commit>`,
      {
        ok: false,
        reason: "missing-baseline-commit",
        guide: GUIDE_REL,
        baselineCommit: marker.commit
      }
    );
  }

  const head = git(ctx, ["rev-parse", "HEAD"]).trim();
  writeBaselineMarker(ctx.root, head, ctx.nowIso());
  const summary = {
    ok: true,
    action: "update-head",
    guide: GUIDE_REL,
    baselineCommit: head
  };
  const lines = [
    `[gc-baseline] Updated baseline marker to HEAD ${head}`,
    "SUMMARY_JSON=" + JSON.stringify(summary)
  ];
  return { ok: true, exitCode: 0, summary, lines };
}

function runSet(ctx, rawCommit) {
  const resolved = resolveCommit(ctx, rawCommit);
  if (!resolved) {
    throw makeFailure(`[gc-baseline] Commit '${rawCommit}' is not a valid commit in this repository.`, {
      ok: false,
      reason: "invalid-set-commit",
      guide: GUIDE_REL,
      inputCommit: rawCommit
    });
  }

  readBaselineMarker(ctx.root);
  writeBaselineMarker(ctx.root, resolved, ctx.nowIso());
  const summary = {
    ok: true,
    action: "set",
    guide: GUIDE_REL,
    baselineCommit: resolved
  };
  const lines = [
    `[gc-baseline] Baseline marker set to ${resolved}`,
    "SUMMARY_JSON=" + JSON.stringify(summary)
  ];
  return { ok: true, exitCode: 0, summary, lines };
}

function resolveCommit(ctx, raw) {
  const value = String(raw || "").trim();
  if (!value) return null;
  try {
    const resolved = git(ctx, ["rev-parse", "--verify", `${value}^{commit}`]).trim();
    return FULL_SHA_RE.test(resolved) ? resolved : null;
  }
  catch (error) {
    return null;
  }
}

function commitExists(ctx, commit) {
  try {
    git(ctx, ["cat-file", "-e", `${commit}^{commit}`], { ignoreOutput: true });
    return true;
  }
  catch (error) {
    return false;
  }
}

function git(ctx, args, options = {}) {
  return ctx.gitExec(args, options);
}

function gitLines(ctx, args) {
  const raw = git(ctx, args).trim();
  if (!raw) return [];
  return raw.split(/\r?\n/).filter(Boolean);
}

function createContext(options) {
  const root = path.resolve(options.root || process.cwd());
  const print = options.print !== false;
  return {
    root,
    print,
    gitExec: options.gitExec || createDefaultGitExec(root),
    nowIso: options.nowIso || isoUtcNow
  };
}

function createDefaultGitExec(root) {
  return function defaultGitExec(args, options = {}) {
    return execFileSync("git", args, {
      cwd: root,
      encoding: options.ignoreOutput ? undefined : "utf8",
      stdio: options.ignoreOutput ? "ignore" : ["ignore", "pipe", "pipe"]
    });
  };
}

function atomicWrite(filePath, content) {
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tempPath, content, "utf8");
  fs.renameSync(tempPath, filePath);
}

function sortedUnique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function usageLines() {
  return [
    "Usage:",
    "  node tools/gc-baseline.mjs --status",
    "  node tools/gc-baseline.mjs --update-head",
    "  node tools/gc-baseline.mjs --set <commit>"
  ];
}

function isoUtcNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function writeLines(lines, stream, shouldPrint) {
  if (!shouldPrint) return;
  const writer = stream === "stderr" ? console.error : console.log;
  for (const line of lines) writer(line);
}

function makeFailure(message, summary) {
  const error = new Error(message);
  error.gcBaselineSummary = summary;
  return error;
}

function normalizeFailure(error) {
  if (error && error.gcBaselineSummary) {
    return { message: error.message, summary: error.gcBaselineSummary };
  }
  return {
    message: `[gc-baseline] Unexpected error: ${error && error.message ? error.message : String(error)}`,
    summary: { ok: false, reason: "unexpected-error", guide: GUIDE_REL }
  };
}

function isCliEntrypoint() {
  if (!process.argv[1]) return false;
  return pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
}

if (isCliEntrypoint()) {
  const result = runGcBaseline(process.argv.slice(2), { print: true });
  process.exit(result.exitCode);
}
