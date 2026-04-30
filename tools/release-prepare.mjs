import { spawnSync } from "node:child_process";

import { isRuntimePath } from "./release-zip-builder.mjs";

export function buildReleasePreparePayload(options = {}) {
  const runGit = options.runGit || defaultRunGit;
  const pluginName = options.pluginName || "dyninstruments";

  const lastTag = readLatestTag(runGit);
  const lastRelease = lastTag ? {
    tag: lastTag,
    date: readTagDate(runGit, lastTag)
  } : null;

  const commitLines = readCommits(runGit, lastTag);
  const changedFiles = readChangedFiles(runGit, lastTag);

  const runtimeChangedPaths = [];
  let runtimeFilesChanged = 0;
  let devOnlyFilesChanged = 0;
  let newFiles = 0;
  let deletedFiles = 0;

  for (const entry of changedFiles) {
    const normalizedPath = normalizeChangedPath(entry.path);
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
    semverHint: buildSemverHint(commitLines)
  };
}

export function main() {
  const payload = buildReleasePreparePayload();
  process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
}

function readLatestTag(runGit) {
  try {
    const out = runGit(["describe", "--tags", "--abbrev=0", "--match", "v*"]).trim();
    return out || null;
  } catch (_err) {
    return null;
  }
}

function readTagDate(runGit, tag) {
  return runGit(["log", "-1", "--format=%cs", tag]).trim();
}

function readCommits(runGit, lastTag) {
  const args = ["log", "--oneline"];
  if (lastTag) {
    args.push(`${lastTag}..HEAD`);
  }
  const out = runGit(args).trim();
  if (!out) return [];
  return out.split(/\r?\n/).filter(Boolean);
}

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
    .filter(Boolean);
}

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

function buildSemverHint(commitLines) {
  let hasNewFeatures = false;
  let hasBugfixes = false;
  let hasBreakingChanges = false;

  for (const line of commitLines) {
    const message = line.replace(/^[0-9a-f]+\s+/, "");
    if (/\bBREAKING:/i.test(message) || /^[a-z]+(?:\([^)]+\))?!:/i.test(message)) {
      hasBreakingChanges = true;
    }
    if (/^feat(?:\([^)]+\))?:/i.test(message)) {
      hasNewFeatures = true;
    }
    if (/^fix(?:\([^)]+\))?:/i.test(message)) {
      hasBugfixes = true;
    }
  }

  let suggestion = "patch";
  if (hasBreakingChanges) suggestion = "major";
  else if (hasNewFeatures) suggestion = "minor";
  else if (hasBugfixes) suggestion = "patch";

  return {
    hasNewFeatures,
    hasBugfixes,
    hasBreakingChanges,
    suggestion
  };
}

function normalizeChangedPath(filePath) {
  return String(filePath || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .trim();
}

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

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
