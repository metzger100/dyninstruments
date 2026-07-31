const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

/** @param {string} relativePath @returns {Promise<any>} */
function importTool(relativePath) {
  return import(relativePath);
}

/** @param {string} rootDir @param {string} relPath @param {string} content */
function writeFile(rootDir, relPath, content) {
  const absPath = path.join(rootDir, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content);
}

const DEV_TOOLING_FILES = [
  ".markdownlint-cli2.jsonc",
  ".prettierignore",
  ".prettierrc.json",
  ".stylelintrc.json",
  "eslint.config.mjs",
  "jscpd.config.json",
  "tsconfig.checkjs.json",
  "vitest.config.js"
];

describe("release-zip-builder", function () {
  it("builds a sorted runtime-only manifest for the current repository", async function () {
    const { buildReleaseManifest, isRuntimePath } = await importTool("../../tools/release-zip-builder.mjs");

    const manifest = buildReleaseManifest(process.cwd());
    const sorted = [...manifest].sort((a, b) => a.localeCompare(b));

    expect(manifest.length).toBeGreaterThan(20);
    expect(manifest).toEqual(sorted);
    expect(new Set(manifest).size).toBe(manifest.length);

    expect(manifest).toContain("plugin.js");
    expect(manifest).toContain("plugin.mjs");
    expect(manifest).toContain("plugin.css");
    expect(manifest).toContain("plugin.json");
    expect(manifest).toContain("config/bootstrap-manifest.js");
    expect(manifest).toContain("runtime/plugin-bootstrap-core.js");
    expect(manifest).toContain("runtime/init.js");
    expect(manifest).toContain("runtime/component-loader.js");
    expect(manifest).toContain("shared/widget-kits/xte/XteDisplayMetrics.js");
    expect(manifest).toContain("shared/widget-kits/xte/XteDisplayPropsNormalize.js");
    expect(manifest).toContain("shared/widget-kits/xte/XteDisplayRenderSetup.js");
    expect(manifest).toContain("shared/widget-kits/xte/XteHighwayLayout.js");
    expect(manifest).toContain("shared/widget-kits/xte/XteHighwayPrimitives.js");
    expect(manifest).toContain("shared/widget-kits/xte/XteLinearDynamicMetrics.js");
    expect(manifest).toContain("shared/widget-kits/xte/XteLinearLayout.js");
    expect(manifest).toContain("shared/widget-kits/xte/XteLinearPrimitives.js");
    expect(manifest).toContain("layouts/dyni-motorboat.json");
    expect(manifest).toContain("layouts/dyni-sailboat.json");
    expect(manifest.some((/** @type {any} */ filePath) => filePath.startsWith("assets/fonts/"))).toBe(true);

    const pluginConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "plugin.json"), "utf8"));
    pluginConfig.layouts.forEach(function (/** @type {any} */ layoutDef) {
      expect(manifest).toContain(layoutDef.file);
    });

    expect(manifest.some((/** @type {any} */ filePath) => filePath.startsWith("tests/"))).toBe(false);
    expect(manifest.some((/** @type {any} */ filePath) => filePath.startsWith("tools/"))).toBe(false);
    expect(manifest.some((/** @type {any} */ filePath) => filePath.startsWith("documentation/"))).toBe(false);
    expect(manifest.some((/** @type {any} */ filePath) => filePath.startsWith("exec-plans/"))).toBe(false);
    expect(manifest.some((/** @type {any} */ filePath) => filePath.startsWith("schemas/"))).toBe(false);
    expect(manifest.some((/** @type {any} */ filePath) => filePath.startsWith(".github/"))).toBe(false);
    expect(manifest.some((/** @type {any} */ filePath) => filePath.startsWith("types/"))).toBe(false);
    expect(manifest).not.toContain("package.json");
    expect(manifest).not.toContain("package-lock.json");
    DEV_TOOLING_FILES.forEach(function (filePath) {
      expect(manifest).not.toContain(filePath);
    });

    expect(isRuntimePath("runtime/init.js")).toBe(true);
    expect(isRuntimePath("plugin.json")).toBe(true);
    expect(isRuntimePath("layouts/dyni-motorboat.json")).toBe(true);
    expect(isRuntimePath("tools/retired-quality-tool.mjs")).toBe(false);
    expect(isRuntimePath("tests/tools/release-zip-builder.test.js")).toBe(false);
    expect(isRuntimePath("node_modules/vitest/index.js")).toBe(false);
    expect(isRuntimePath("tsconfig.checkjs.json")).toBe(false);
  });

  describe("buildBootstrapBundleContent", function () {
    it("concatenates manifest scripts in order with header comment", async function () {
      const { buildBootstrapBundleContent } = await importTool("../../tools/release-zip-builder.mjs");

      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-bootstrap-bundle-"));
      try {
        writeFile(
          tempRoot,
          "runtime/namespace.js",
          "(function (root) {\n  var ns = root.DyniPlugin = root.DyniPlugin || {};\n  ns.config = ns.config || {};\n}(this));\n"
        );
        writeFile(
          tempRoot,
          "config/bootstrap-manifest.js",
          '(function (root) {\n  var config = root.DyniPlugin.config = root.DyniPlugin.config || {};\n  config.bootstrapManifest = ["scripts/first.js", "scripts/second.js"];\n}(this));\n'
        );
        writeFile(tempRoot, "scripts/first.js", "first-script();");
        writeFile(tempRoot, "scripts/second.js", "second-script();");

        const bundle = buildBootstrapBundleContent(tempRoot);

        expect(bundle).toBe(
          "// bootstrap-bundle.js — generated at release time, do not edit\n" + "first-script();\n" + "second-script();"
        );
      } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
      }
    });

    it("throws when a manifest-listed file is missing", async function () {
      const { buildBootstrapBundleContent } = await importTool("../../tools/release-zip-builder.mjs");

      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-bootstrap-bundle-missing-"));
      try {
        writeFile(
          tempRoot,
          "runtime/namespace.js",
          "(function (root) {\n  var ns = root.DyniPlugin = root.DyniPlugin || {};\n  ns.config = ns.config || {};\n}(this));\n"
        );
        writeFile(
          tempRoot,
          "config/bootstrap-manifest.js",
          '(function (root) {\n  var config = root.DyniPlugin.config = root.DyniPlugin.config || {};\n  config.bootstrapManifest = ["scripts/missing.js"];\n}(this));\n'
        );

        expect(function () {
          buildBootstrapBundleContent(tempRoot);
        }).toThrow("scripts/missing.js");
      } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
      }
    });
  });

  it("discovers future registry fragments from the bootstrap manifest without a tooling inventory change", async function () {
    const { buildReleaseManifest } = await importTool("../../tools/release-zip-builder.mjs");
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-release-future-registry-"));

    try {
      writeRegistryFixture(tempRoot, {
        fragmentPath: "config/components/registry-future.js",
        componentId: "FutureComponent",
        componentPath: "widgets/future/FutureComponent.js"
      });

      const manifest = buildReleaseManifest(tempRoot);

      expect(manifest).toContain("config/components/registry-future.js");
      expect(manifest).toContain("widgets/future/FutureComponent.js");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails when a registry fragment exists outside the authoritative bootstrap manifest", async function () {
    const { buildReleaseManifest } = await importTool("../../tools/release-zip-builder.mjs");
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-release-orphan-registry-"));

    try {
      writeRegistryFixture(tempRoot, {
        fragmentPath: "config/components/registry-main.js",
        componentId: "MainComponent",
        componentPath: "widgets/main/MainComponent.js"
      });
      writeFile(tempRoot, "config/components/registry-orphan.js", "(function () {})();\n");

      expect(() => buildReleaseManifest(tempRoot)).toThrow(
        "registry fragments absent from bootstrap manifest: config/components/registry-orphan.js"
      );
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("fails on unknown dependencies, dependency cycles, and missing component resources", async function () {
    const { collectComponentRegistryResources } = await importTool("../../tools/component-registry-validation.mjs");
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-release-registry-closure-"));

    try {
      writeFile(tempRoot, "widgets/A.js", "a\n");
      writeFile(tempRoot, "widgets/B.js", "b\n");

      expect(() =>
        collectComponentRegistryResources(tempRoot, {
          A: { js: "widgets/A.js", deps: ["Missing"] }
        })
      ).toThrow("A.deps[0]: unknown component 'Missing'");

      expect(() =>
        collectComponentRegistryResources(tempRoot, {
          A: { js: "widgets/A.js", deps: ["B"] },
          B: { js: "widgets/B.js", deps: ["A"] }
        })
      ).toThrow("dependency cycle: A -> B -> A");

      expect(() =>
        collectComponentRegistryResources(tempRoot, {
          MissingResource: { js: "widgets/MissingResource.js" }
        })
      ).toThrow("MissingResource.js");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("verifies the complete staged release tree", async function () {
    const { assertStagingTree } = await importTool("../../tools/release-zip-builder.mjs");
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-release-stage-"));

    try {
      writeFile(tempRoot, "plugin.js", "plugin\n");
      writeFile(tempRoot, "unexpected.js", "unexpected\n");

      expect(() => assertStagingTree(tempRoot, ["plugin.js", "bootstrap-bundle.js"])).toThrow(
        /missing staged files: bootstrap-bundle\.js[\s\S]*unexpected staged files: unexpected\.js/
      );

      fs.rmSync(path.join(tempRoot, "unexpected.js"));
      writeFile(tempRoot, "bootstrap-bundle.js", "bundle\n");
      expect(() => assertStagingTree(tempRoot, ["plugin.js", "bootstrap-bundle.js"])).not.toThrow();
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("reports missing files during manifest validation", async function () {
    const { validateManifest } = await importTool("../../tools/release-zip-builder.mjs");

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

  it("rejects release manifest paths that escape the repository root", async function () {
    const { validateManifest } = await importTool("../../tools/release-zip-builder.mjs");
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-release-validate-escape-"));
    try {
      const result = validateManifest(tempRoot, ["../outside.js", "/absolute.js"]);
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(["../outside.js", "/absolute.js"]);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});

/**
 * @param {string} rootDir
 * @param {{ fragmentPath: string, componentId: string, componentPath: string }} options
 */
function writeRegistryFixture(rootDir, options) {
  writeFile(
    rootDir,
    "runtime/namespace.js",
    "(function (root) {\n" +
      "  root.DyniPlugin = root.DyniPlugin || {};\n" +
      "  root.DyniPlugin.config = root.DyniPlugin.config || {};\n" +
      "})(this);\n"
  );
  writeFile(
    rootDir,
    "config/bootstrap-manifest.js",
    "(function (root) {\n" +
      `  root.DyniPlugin.config.bootstrapManifest = ["runtime/namespace.js", "${options.fragmentPath}", "config/components.js"];\n` +
      "})(this);\n"
  );
  writeFile(
    rootDir,
    options.fragmentPath,
    "(function (root) {\n" +
      "  var config = root.DyniPlugin.config;\n" +
      "  var shared = config.shared = config.shared || {};\n" +
      "  var groups = shared.componentRegistryGroups = shared.componentRegistryGroups || {};\n" +
      "  var widgets = groups.widgets = groups.widgets || {};\n" +
      `  widgets.${options.componentId} = { js: root.DyniPlugin.baseUrl + "${options.componentPath}", globalKey: "Dyni${options.componentId}" };\n` +
      "})(this);\n"
  );
  writeFile(
    rootDir,
    "config/components.js",
    "(function (root) {\n" +
      "  root.DyniPlugin.config.components = root.DyniPlugin.config.shared.componentRegistryGroups.widgets;\n" +
      "})(this);\n"
  );
  writeFile(rootDir, options.componentPath, "future component\n");
}
