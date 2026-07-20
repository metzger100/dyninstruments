const contract = require("../helpers/component-registry-contract");
const retiredOwners = require("../helpers/retired-component-owners");

/** @param {string} globalKey @param {string} returnedId @param {string} [createExport] */
function componentSource(globalKey, returnedId, createExport) {
  const exportLine = createExport || 'return { id: "' + returnedId + '", create: create };';
  return [
    "/** Module: Example - test fixture */",
    "(function (root, factory) {",
    '  if (typeof define === "function" && define.amd) define([], factory);',
    '  else if (typeof module === "object" && module.exports) module.exports = factory();',
    "  else {",
    "    (root.DyniComponents = root.DyniComponents || {})." + globalKey + " = factory();",
    "  }",
    "}(this, function () {",
    '  "use strict";',
    "  function create() {",
    '    return { id: "' + returnedId + '" };',
    "  }",
    "  " + exportLine,
    "}));"
  ].join("\n");
}

describe("component registry contract negative fixtures", function () {
  it("rejects missing UMD wrappers", function () {
    const source = "function create() { return {}; }";

    expect(contract.hasStandardUmdWrapper(source)).toBe(false);
  });

  it("rejects missing DyniComponents registration", function () {
    const source = [
      "(function (root, factory) {",
      "  module.exports = factory();",
      "}(this, function () {",
      '  return { id: "Example", create: function () {} };',
      "}));"
    ].join("\n");

    expect(contract.hasStandardUmdWrapper(source)).toBe(true);
    expect(contract.hasDyniComponentsRegistration(source)).toBe(false);
  });

  it("rejects factory components without create exports", function () {
    const source = componentSource("DyniExample", "Example", 'return { id: "Example", createRenderer: create };');

    expect(contract.hasCreateExport(source)).toBe(false);
  });

  it("detects mismatched UMD global keys and returned ids", function () {
    const source = componentSource("DyniOther", "Other");

    expect(contract.extractUmdGlobalKey(source)).not.toBe("DyniExample");
    expect(contract.extractLastReturnedId(source)).not.toBe("Example");
  });

  it("allows only explicitly bootstrap-only unregistered source files", function () {
    const registered = new Set(["widgets/radial/ExampleWidget/ExampleWidget.js"]);

    expect(registered.has("shared/widget-kits/format/LooseUtility.js")).toBe(false);
    expect(contract.isBootstrapOnlyComponentFile("shared/widget-kits/format/LooseUtility.js")).toBe(false);
    expect(contract.isBootstrapOnlyComponentFile("shared/unit-format-families.js")).toBe(true);
  });

  it("detects cluster widget names that drift from config filenames", function () {
    const source = [
      "(function () {",
      "  return {",
      "    def: {",
      '      name: "dyni_bad_Instruments"',
      "    }",
      "  };",
      "}());"
    ].join("\n");
    const clusterFile = "config/clusters/course-heading.js";

    expect(contract.extractClusterWidgetName(source)).toMatch(/^dyni_.+_Instruments$/);
    expect(contract.extractClusterWidgetName(source)).not.toBe(contract.buildExpectedClusterName(clusterFile));
  });

  it("rejects malformed dependency declarations", function () {
    const components = {
      BadDeps: { js: "widgets/bad.js", deps: "SharedThing" },
      BadItem: { js: "widgets/item.js", deps: ["", 42] }
    };

    const types = contract.dependencyViolations(components).map(function (violation) {
      return violation.type;
    });

    expect(types).toContain("malformed-deps");
    expect(types).toContain("malformed-deps-item");
  });

  it("rejects every defined non-array dependency declaration", function () {
    [null, "", 0, false, {}].forEach(function (deps, index) {
      const componentId = `BadFalsyDeps${index}`;
      const components = {
        [componentId]: { js: "widgets/bad.js", deps }
      };

      expect(contract.dependencyViolations(components)).toContainEqual({
        type: "malformed-deps",
        componentId
      });
    });
  });

  it("rejects missing dependencies and unsupported component paths", function () {
    const components = {
      UnknownSource: { js: "legacy/source.js", deps: [] },
      UnknownTarget: { js: "shared/source.js", deps: ["LegacyTarget"] },
      LegacyTarget: { js: "legacy/target.js", deps: [] },
      MissingTarget: { js: "widgets/missing.js", deps: ["NoSuchComponent"] }
    };

    const types = contract.dependencyViolations(components).map(function (violation) {
      return violation.type;
    });

    expect(types).toContain("unknown-source-layer");
    expect(types).toContain("unknown-target-layer");
    expect(types).toContain("missing-dependency");
  });

  it("rejects layer direction violations and dependency cycles", function () {
    const components = {
      Widget: { js: "widgets/example.js", deps: ["ClusterThing"] },
      ClusterThing: { js: "cluster/example.js", deps: [] },
      SharedA: { js: "shared/a.js", deps: ["SharedB"] },
      SharedB: { js: "shared/b.js", deps: ["SharedA"] }
    };

    const types = contract.dependencyViolations(components).map(function (violation) {
      return violation.type;
    });

    expect(types).toContain("dependency-direction");
    expect(types).toContain("dependency-cycle");
  });

  it("rejects runtime-owned component ids and deps", function () {
    const components = {
      ThemeModel: { js: "shared/theme-model.js", deps: [] },
      Widget: { js: "widgets/example.js", deps: ["ThemeModel"] }
    };

    const forbiddenIds = ["ThemeModel"];
    const types = contract.dependencyViolations(components, forbiddenIds).map(function (violation) {
      return violation.type;
    });

    expect(types).toContain("forbidden-component-id");
    expect(types).toContain("forbidden-component-dep");
  });

  it("rejects a reintroduced performance registry owner", function () {
    const components = {
      PerfSpanHelper: {
        js: "shared/widget-kits/perf/PerfSpanHelper.js",
        deps: []
      },
      Widget: {
        js: "widgets/example.js",
        deps: ["PerfSpanHelper"]
      }
    };
    const types = contract
      .dependencyViolations(components, /** @type {string[]} */ (retiredOwners.FORBIDDEN_COMPONENT_IDS))
      .map(function (violation) {
        return violation.type;
      });

    expect(retiredOwners.FORBIDDEN_COMPONENT_IDS).toContain("PerfSpanHelper");
    expect(retiredOwners.FORBIDDEN_OWNER_MODULE_PATHS).toContain("shared/widget-kits/perf/PerfSpanHelper.js");
    expect(types).toContain("forbidden-component-id");
    expect(types).toContain("forbidden-component-dep");
  });
});
