const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

describe("tools/check-dependencies.mjs", function () {
  const toolPath = path.resolve(__dirname, "../../tools/check-dependencies.mjs");
  const repoRoot = path.resolve(__dirname, "../..");
  const tempDirs = [];
  let runDependencyCheck;

  beforeAll(async function () {
    const mod = await import(pathToFileURL(toolPath).href);
    runDependencyCheck = mod.runDependencyCheck;
  });

  afterEach(function () {
    while (tempDirs.length) {
      fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
    }
  });

  function createWorkspace() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-check-dependencies-"));
    tempDirs.push(dir);
    return dir;
  }

  function copyBootstrapWorkspace(rootDir) {
    const files = [
      "runtime/namespace.js",
      "config/components.js",
      "config/components/registry-shared-foundation-format.js",
      "config/components/registry-shared-foundation-geometry.js",
      "config/components/registry-shared-foundation-layout.js",
      "config/components/registry-shared-foundation-state.js",
      "config/components/registry-shared-engines.js",
      "config/components/registry-widgets-nav.js",
      "config/components/registry-widgets-vessel.js",
      "config/components/registry-widgets-gauge.js",
      "config/components/registry-cluster.js"
    ];

    for (const relPath of files) {
      const src = path.join(repoRoot, relPath);
      const dest = path.join(rootDir, relPath);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }

  function writeFile(rootDir, relPath, content) {
    const absPath = path.join(rootDir, relPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, content, "utf8");
  }

  function joinViolations(result) {
    return result.violations.join("\n");
  }

  it("fails when deleted PLAN20 owner module paths are reintroduced on disk", function () {
    const cwd = createWorkspace();
    copyBootstrapWorkspace(cwd);

    const forbiddenPaths = [
      "cluster/rendering/ClusterRendererRouter.js",
      "cluster/rendering/ClusterKindCatalog.js",
      "cluster/rendering/SurfaceControllerFactory.js",
      "cluster/rendering/RendererPropsWidget.js",
      "cluster/mappers/ClusterMapperRegistry.js",
      "runtime/helpers.js",
      "shared/theme/ThemeModel.js",
      "shared/theme/ThemeResolver.js",
      "shared/widget-kits/perf/PerfSpanHelper.js",
      "cluster/rendering/ClusterSurfacePolicy.js",
      "cluster/rendering/CanvasDomSurfaceAdapter.js",
      "cluster/rendering/HtmlSurfaceController.js"
    ];

    for (const relPath of forbiddenPaths) {
      writeFile(cwd, relPath, "// deleted PLAN20 owner module placeholder\n");
    }

    const result = runDependencyCheck({ root: cwd, print: false });
    const output = joinViolations(result);

    expect(result.summary.ok).toBe(false);
    expect(result.summary.checkedForbiddenPaths).toBe(12);
    expect(result.summary.byType["forbidden-owner-module-path"]).toBe(12);
    for (const relPath of forbiddenPaths) {
      expect(output).toContain(relPath);
    }
  });

  it("still blocks forbidden component ids and dependency edges in config.components", function () {
    const cwd = createWorkspace();
    copyBootstrapWorkspace(cwd);

    fs.appendFileSync(path.join(cwd, "config/components/registry-cluster.js"), `

(function (root) {
  "use strict";

  const groups = root.DyniPlugin.config.shared.componentRegistryGroups;
  const BASE = root.DyniPlugin.baseUrl;

  groups.cluster.ThemeResolver = {
    js: BASE + "shared/theme/ThemeResolver.js",
    css: undefined,
    globalKey: "DyniThemeResolver"
  };

  groups.cluster.ThemeResolverConsumer = {
    js: BASE + "cluster/rendering/ThemeResolverConsumer.js",
    css: undefined,
    globalKey: "DyniThemeResolverConsumer",
    deps: ["ThemeResolver"]
  };
}(this));
`, "utf8");

    const result = runDependencyCheck({ root: cwd, print: false });
    const output = joinViolations(result);

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byType["forbidden-component-id"]).toBeGreaterThanOrEqual(1);
    expect(result.summary.byType["forbidden-component-dep"]).toBeGreaterThanOrEqual(1);
    expect(output).toContain("component 'ThemeResolver' must not be registered in config.components");
    expect(output).toContain("component 'ThemeResolverConsumer' must not depend on runtime-owned 'ThemeResolver'");
  });
});
