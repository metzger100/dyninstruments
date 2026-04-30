import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { buildReleaseManifest, validateManifest } from "./release-zip-builder.mjs";

const VERSION_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export function parseReleaseCreateArgs(argv) {
  const out = { version: "" };

  for (const arg of argv) {
    if (arg.startsWith("--version=")) {
      out.version = arg.slice("--version=".length).trim();
    }
  }

  return out;
}

export function createRelease(options) {
  const rootDir = options.rootDir || process.cwd();
  const version = String(options.version || "").trim();

  const runCommand = options.runCommand || defaultRunCommand;
  const manifestBuilder = options.manifestBuilder || buildReleaseManifest;
  const manifestValidator = options.manifestValidator || validateManifest;
  const output = options.output || {
    log: (message) => console.log(message),
    warn: (message) => console.warn(message)
  };

  const notesAbs = validateInputs({ rootDir, version, runCommand });
  ensureZipBinaryAvailable(runCommand, rootDir);
  ensureCleanWorktreeOutsideReleases(runCommand, rootDir);

  runRequiredCheck(runCommand, rootDir, ["run", "check:core"], "npm run check:core");
  runRequiredCheck(runCommand, rootDir, ["run", "test:coverage:check"], "npm run test:coverage:check");

  runAdvisoryPerfCheck(runCommand, rootDir, output);

  const manifestFiles = manifestBuilder(rootDir);
  const manifestValidation = manifestValidator(rootDir, manifestFiles);
  if (!manifestValidation.valid) {
    throw new Error(
      "release:create aborted: manifest contains missing files:\n" +
      manifestValidation.missing.map((relPath) => `- ${relPath}`).join("\n")
    );
  }

  const releasesDir = path.join(rootDir, "releases");
  fs.mkdirSync(releasesDir, { recursive: true });

  const zipName = `dyninstruments-${version}.zip`;
  const zipAbs = path.join(releasesDir, zipName);
  const releaseNotesAbs = notesAbs;

  createReleaseZip({
    rootDir,
    manifestFiles,
    outputZipAbs: zipAbs,
    runCommand
  });

  const tag = `v${version}`;
  runGit(runCommand, rootDir, ["add", `releases/${zipName}`, path.relative(rootDir, releaseNotesAbs).replace(/\\/g, "/")]);
  runGit(runCommand, rootDir, ["commit", "-m", `release: ${tag}`]);
  runGit(runCommand, rootDir, ["tag", "-a", tag, "-m", `Release ${tag}`]);

  const totalSizeBytes = manifestFiles.reduce((sum, relPath) => {
    const absPath = path.join(rootDir, relPath);
    return sum + fs.statSync(absPath).size;
  }, 0);

  output.log(`release:create completed`);
  output.log(`included files: ${manifestFiles.length} (${totalSizeBytes} bytes)`);
  output.log(`zip: ${path.relative(rootDir, zipAbs).replace(/\\/g, "/")}`);
  output.log(`notes: ${path.relative(rootDir, releaseNotesAbs).replace(/\\/g, "/")}`);
  output.log(`commit: release: ${tag}`);
  output.log(`tag: ${tag}`);
  output.log(`next: git push origin main && git push origin ${tag}`);

  return {
    version,
    tag,
    zipPath: zipAbs,
    notesFile: releaseNotesAbs,
    filesIncluded: manifestFiles.length,
    totalSizeBytes
  };
}

export function main(argv = process.argv.slice(2)) {
  try {
    const args = parseReleaseCreateArgs(argv);
    createRelease({ version: args.version });
  } catch (error) {
    console.error(error.message || String(error));
    process.exit(1);
  }
}

function validateInputs({ rootDir, version, runCommand }) {
  if (!VERSION_REGEX.test(version)) {
    throw new Error("release:create aborted: --version must be a valid SemVer string without 'v' prefix");
  }

  const notesAbs = getCanonicalReleaseNotesPath(rootDir, version);
  if (!fs.existsSync(notesAbs)) {
    throw new Error(`release:create aborted: notes file not found: ${path.relative(rootDir, notesAbs).replace(/\\/g, "/")}`);
  }

  const notesText = fs.readFileSync(notesAbs, "utf8");
  if (!notesText.trim()) {
    throw new Error(`release:create aborted: notes file is empty: ${path.relative(rootDir, notesAbs).replace(/\\/g, "/")}`);
  }

  const tag = `v${version}`;
  const existingTag = runGit(runCommand, rootDir, ["tag", "-l", tag]).trim();
  if (existingTag) {
    throw new Error(`release:create aborted: git tag already exists: ${tag}`);
  }

  return notesAbs;
}

function ensureZipBinaryAvailable(runCommand, rootDir) {
  const result = runCommand("zip", ["-h"], { cwd: rootDir });
  if (result.error || result.status !== 0) {
    throw new Error(
      "release:create aborted: 'zip' command not found. Install it first (macOS: brew install zip; Debian/Ubuntu: apt install zip; Windows: use WSL or add zip to PATH)."
    );
  }
}

function ensureCleanWorktreeOutsideReleases(runCommand, rootDir) {
  const statusOutput = runGit(runCommand, rootDir, ["status", "--porcelain", "--untracked-files=all"]);
  const dirtyOutsideReleases = statusOutput
    .split(/\r?\n/)
    .filter(Boolean)
    .some((line) => {
      const pathText = line.slice(3);
      const targetPath = pathText.includes(" -> ") ? pathText.split(" -> ").pop() : pathText;
      const normalized = normalizeRepoRelativePath(targetPath);
      return !normalized.startsWith("releases/");
    });

  if (dirtyOutsideReleases) {
    throw new Error("release:create aborted: working tree has uncommitted changes outside releases/");
  }
}

function runRequiredCheck(runCommand, rootDir, args, label) {
  const result = runCommand("npm", args, { cwd: rootDir });
  if (result.error || result.status !== 0) {
    throw new Error(`release:create aborted: required gate failed (${label})`);
  }
}

function runAdvisoryPerfCheck(runCommand, rootDir, output) {
  const result = runCommand("npm", ["run", "perf:check"], { cwd: rootDir });
  if (result.error || result.status !== 0) {
    const detail = [result.stdout, result.stderr]
      .filter((value) => typeof value === "string" && value.trim() !== "")
      .join("\n")
      .trim();
    output.warn("release:create advisory: npm run perf:check failed; continuing by design");
    if (detail) {
      output.warn(detail);
    }
  }
}

function createReleaseZip({ rootDir, manifestFiles, outputZipAbs, runCommand }) {
  const stageParent = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-release-"));
  const stageRoot = path.join(stageParent, "dyninstruments");

  try {
    for (const relPath of manifestFiles) {
      const sourceAbs = path.join(rootDir, relPath);
      const targetAbs = path.join(stageRoot, relPath);
      fs.mkdirSync(path.dirname(targetAbs), { recursive: true });
      fs.copyFileSync(sourceAbs, targetAbs);
    }

    const zipResult = runCommand("zip", ["-q", "-r", outputZipAbs, "dyninstruments"], {
      cwd: stageParent
    });

    if (zipResult.error || zipResult.status !== 0) {
      throw new Error("release:create aborted: failed to create zip archive");
    }
  } finally {
    fs.rmSync(stageParent, { recursive: true, force: true });
  }
}

function runGit(runCommand, rootDir, args) {
  const result = runCommand("git", args, { cwd: rootDir });
  if (result.error || result.status !== 0) {
    const detail = [result.stdout, result.stderr]
      .filter((value) => typeof value === "string" && value.trim() !== "")
      .join("\n")
      .trim();
    throw new Error(`release:create aborted: git ${args.join(" ")} failed${detail ? `\n${detail}` : ""}`);
  }
  return result.stdout || "";
}

function normalizeRepoRelativePath(rawPath) {
  return String(rawPath || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .trim();
}

function getCanonicalReleaseNotesPath(rootDir, version) {
  return path.join(rootDir, "releases", `dyninstruments-${version}.md`);
}

export function defaultRunCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8"
  });

  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error || null
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
