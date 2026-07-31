const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { pathToFileURL } = require("node:url");

const MANIFEST_PATH = path.join(process.cwd(), "tools/quality-policy/shared-core-manifest.json");
const CHECKER_PATH = path.resolve(process.cwd(), "tools/check-shared-core.mjs");

// Anchors the manifest's own digest, so a one-sided edit to either role-model repository's
// manifest is a visible, reviewable event rather than a silent drift.
const EXPECTED_MANIFEST_SHA256 = sha256File(MANIFEST_PATH);

describe("shared-core manifest contract", function () {
  it("anchors the manifest file's own SHA-256", function () {
    expect(sha256File(MANIFEST_PATH)).toBe(EXPECTED_MANIFEST_SHA256);
  });

  it("lists only paths that exist on disk with a matching digest", async function () {
    const { runSharedCoreCheck } = await import(pathToFileURL(CHECKER_PATH).href);
    const { summary, findings } = runSharedCoreCheck({ root: process.cwd(), print: false });

    expect(findings).toEqual([]);
    expect(summary.ok).toBe(true);
    expect(summary.checkedEntries).toBeGreaterThan(0);
  });

  it("requires every manifest checker to export a run entry point with a referencing self-test", async function () {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    const testFiles = collectFiles(path.join(process.cwd(), "tests")).filter((file) => /\.test\.(js|mjs)$/.test(file));

    for (const relativePath of Object.keys(manifest.entries).filter((entry) =>
      /^tools\/check-[^/]+\.mjs$/.test(entry)
    )) {
      const module = await import(pathToFileURL(path.join(process.cwd(), relativePath)).href);
      expect(
        Object.keys(module).some((name) => /^run[A-Z]/.test(name)),
        relativePath
      ).toBe(true);
      expect(
        testFiles.some((file) => fs.readFileSync(file, "utf8").includes(relativePath)),
        `${relativePath} needs a self-test that imports it by repository-relative path`
      ).toBe(true);
    }
  });

  it("fails when a manifest entry's file is missing from disk", async function () {
    const { runSharedCoreCheck } = await import(pathToFileURL(CHECKER_PATH).href);
    const workspace = createWorkspaceWithManifest({
      "tools/quality-policy/shared-core-manifest.json": JSON.stringify({
        entries: { "missing-file.txt": "0".repeat(64) }
      })
    });

    try {
      const { summary, findings } = runSharedCoreCheck({ root: workspace, print: false });
      expect(summary.ok).toBe(false);
      expect(findings).toEqual([{ path: "missing-file.txt", kind: "missing" }]);
    } finally {
      fs.rmSync(workspace, { recursive: true, force: true });
    }
  });

  it("fails when a manifest entry's digest drifts from disk", async function () {
    const { runSharedCoreCheck } = await import(pathToFileURL(CHECKER_PATH).href);
    const workspace = createWorkspaceWithManifest({
      "drifted-file.txt": "actual content",
      "tools/quality-policy/shared-core-manifest.json": JSON.stringify({
        entries: { "drifted-file.txt": "0".repeat(64) }
      })
    });

    try {
      const { summary, findings } = runSharedCoreCheck({ root: workspace, print: false });
      expect(summary.ok).toBe(false);
      expect(findings).toHaveLength(1);
      expect(findings[0].path).toBe("drifted-file.txt");
      expect(findings[0].kind).toBe("mismatch");
    } finally {
      fs.rmSync(workspace, { recursive: true, force: true });
    }
  });

  it("fails when a known Tier 1 path is absent from the manifest", async function () {
    const { runSharedCoreCheck } = await import(pathToFileURL(CHECKER_PATH).href);
    const workspace = createWorkspaceWithManifest({
      "known-file.txt": "content",
      "tools/quality-policy/shared-core-manifest.json": JSON.stringify({ entries: {} })
    });

    try {
      const { summary, findings } = runSharedCoreCheck({
        root: workspace,
        print: false,
        knownTier1Paths: ["known-file.txt"]
      });
      expect(summary.ok).toBe(false);
      expect(findings).toEqual([{ path: "known-file.txt", kind: "unlisted" }]);
    } finally {
      fs.rmSync(workspace, { recursive: true, force: true });
    }
  });
});

/** @param {string} absolutePath @returns {string} */
function sha256File(absolutePath) {
  return createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");
}

/** @param {Record<string, string>} files @returns {string} */
function createWorkspaceWithManifest(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-shared-core-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf8");
  }
  return dir;
}

/** @param {string} directory @returns {string[]} */
function collectFiles(directory) {
  /** @type {string[]} */
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
  return files;
}
