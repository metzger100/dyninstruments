const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

describe("release-zip-builder", function () {
  it("builds a sorted runtime-only manifest for the current repository", async function () {
    const { buildReleaseManifest, isRuntimePath } = await import("../../tools/release-zip-builder.mjs");

    const manifest = buildReleaseManifest(process.cwd());
    const sorted = [...manifest].sort((a, b) => a.localeCompare(b));

    expect(manifest.length).toBeGreaterThan(20);
    expect(manifest).toEqual(sorted);
    expect(new Set(manifest).size).toBe(manifest.length);

    expect(manifest).toContain("plugin.js");
    expect(manifest).toContain("plugin.css");
    expect(manifest).toContain("config/bootstrap-manifest.js");
    expect(manifest).toContain("runtime/init.js");
    expect(manifest).toContain("runtime/component-loader.js");
    expect(manifest.some((filePath) => filePath.startsWith("assets/fonts/"))).toBe(true);

    expect(manifest.some((filePath) => filePath.startsWith("tests/"))).toBe(false);
    expect(manifest.some((filePath) => filePath.startsWith("tools/"))).toBe(false);
    expect(manifest.some((filePath) => filePath.startsWith("documentation/"))).toBe(false);
    expect(manifest.some((filePath) => filePath.startsWith("exec-plans/"))).toBe(false);

    expect(isRuntimePath("runtime/init.js")).toBe(true);
    expect(isRuntimePath("tools/perf-run.mjs")).toBe(false);
    expect(isRuntimePath("tests/tools/release-zip-builder.test.js")).toBe(false);
  });

  it("reports missing files during manifest validation", async function () {
    const { validateManifest } = await import("../../tools/release-zip-builder.mjs");

    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-release-validate-"));
    try {
      const existingPath = "runtime/existing.js";
      const missingPath = "runtime/missing.js";
      fs.mkdirSync(path.join(tempRoot, "runtime"), { recursive: true });
      fs.writeFileSync(path.join(tempRoot, existingPath), "ok\n");

      const result = validateManifest(tempRoot, [existingPath, missingPath]);

      expect(result.valid).toBe(false);
      expect(result.missing).toEqual([missingPath]);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
