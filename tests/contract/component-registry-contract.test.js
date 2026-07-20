const fs = require("node:fs");
const path = require("node:path");

const contract = require("../helpers/component-registry-contract");
const retiredOwners = require("../helpers/retired-component-owners");

describe("component registry contract", function () {
  const components = contract.loadComponents();

  it("keeps component IDs, global keys, and JavaScript paths unique", function () {
    const globalKeys = new Set();
    const jsPaths = new Set();

    Object.keys(components).forEach(function (componentId) {
      const entry = components[componentId];
      const jsPath = contract.relJsPath(entry);

      expect(entry.globalKey).toBe("Dyni" + componentId);
      expect(globalKeys.has(entry.globalKey)).toBe(false);
      expect(jsPaths.has(jsPath)).toBe(false);

      globalKeys.add(entry.globalKey);
      jsPaths.add(jsPath);
    });
  });

  it("points every component entry at an existing supported-layer script", function () {
    Object.keys(components).forEach(function (componentId) {
      const jsPath = contract.relJsPath(components[componentId]);

      expect(jsPath, componentId).toMatch(/\.js$/);
      expect(contract.layerOf(jsPath), componentId + " -> " + jsPath).not.toBe("unknown");
      expect(fs.existsSync(path.join(process.cwd(), jsPath)), jsPath).toBe(true);
    });
  });

  it("keeps every component source registered unless it is bootstrap-only", function () {
    const registered = contract.registeredJsPathSet(components);
    contract.collectJsFiles(contract.COMPONENT_SCAN_ROOTS).forEach(function (jsPath) {
      if (contract.isBootstrapOnlyComponentFile(jsPath)) return;
      expect(registered.has(jsPath), jsPath).toBe(true);
    });
  });

  it("keeps component scripts on the UMD registration pattern", function () {
    Object.keys(components).forEach(function (componentId) {
      const entry = components[componentId];
      const jsPath = contract.relJsPath(entry);
      const content = contract.readSource(jsPath);

      expect(contract.hasStandardUmdWrapper(content), componentId + " -> " + jsPath).toBe(true);
      expect(contract.hasDyniComponentsRegistration(content), componentId + " -> " + jsPath).toBe(true);
      expect(contract.extractUmdGlobalKey(content), componentId + " -> " + jsPath).toBe(entry.globalKey);
    });
  });

  it("keeps all component source files on the UMD export pattern", function () {
    contract.collectJsFiles(contract.COMPONENT_SCAN_ROOTS).forEach(function (jsPath) {
      const content = contract.readSource(jsPath);

      expect(contract.hasStandardUmdWrapper(content), jsPath).toBe(true);
      expect(contract.hasDyniComponentsRegistration(content), jsPath).toBe(true);
      if (!contract.isBootstrapOnlyComponentFile(jsPath)) {
        expect(contract.hasCreateExport(content), jsPath).toBe(true);
      }
    });
  });

  it("keeps factory components exporting their registered id and create function", function () {
    Object.keys(components).forEach(function (componentId) {
      const entry = components[componentId];
      if (entry.apiShape === "module") return;

      const jsPath = contract.relJsPath(entry);
      const content = contract.readSource(jsPath);

      expect(contract.hasCreateExport(content), componentId + " -> " + jsPath).toBe(true);
      expect(contract.extractLastReturnedId(content), componentId + " -> " + jsPath).toBe(componentId);
    });
  });

  it("keeps dependency references existing, acyclic, and layer-valid", function () {
    expect(contract.dependencyViolations(components)).toEqual([]);
  });

  it("keeps runtime-owned services out of the component registry", function () {
    retiredOwners.FORBIDDEN_COMPONENT_IDS.forEach(function (componentId) {
      expect(components[componentId], componentId).toBeUndefined();
    });
    expect(
      contract.dependencyViolations(components, /** @type {string[]} */ (retiredOwners.FORBIDDEN_COMPONENT_IDS))
    ).toEqual([]);
    retiredOwners.FORBIDDEN_OWNER_MODULE_PATHS.forEach(function (relPath) {
      expect(fs.existsSync(path.join(process.cwd(), relPath)), relPath).toBe(false);
    });
  });

  it("keeps cluster widget names aligned with cluster config filenames", function () {
    contract.collectJsFiles([contract.CLUSTER_CONFIG_ROOT]).forEach(function (clusterFile) {
      const content = contract.readSource(clusterFile);
      const widgetName = contract.extractClusterWidgetName(content);

      expect(widgetName, clusterFile).toBeTruthy();
      expect(widgetName, clusterFile).toMatch(/^dyni_.+_Instruments$/);
      expect(widgetName, clusterFile).toBe(contract.buildExpectedClusterName(clusterFile));
    });
  });
});
