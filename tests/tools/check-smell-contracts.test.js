const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

describe("tools/check-smell-contracts.mjs", function () {
  const toolPath = path.resolve(__dirname, "../../tools/check-smell-contracts.mjs");
  const tempDirs = [];
  let runSmellContracts;

  beforeAll(async function () {
    const mod = await import(pathToFileURL(toolPath).href);
    runSmellContracts = mod.runSmellContracts;
  });

  afterEach(function () {
    while (tempDirs.length) {
      fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
    }
  });

  function createWorkspace(files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-check-smell-contracts-"));
    tempDirs.push(dir);

    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(dir, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf8");
    }
    return dir;
  }

  function messages(result) {
    return result.findings.map((item) => item.message).join("\n");
  }

  it("passes all contracts for current repository", function () {
    const result = runSmellContracts({ root: path.resolve(__dirname, "../.."), print: false });
    expect(result.summary.ok).toBe(true);
    expect(result.findings).toHaveLength(0);
  });

  it("fails theme-cache-invalidation when invalidate API is missing", function () {
    const cwd = createWorkspace({
      "shared/theme/ThemeResolver.js": `
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
}(this, function () {
  function create() {
    return { resolve: function () { return { colors: { pointer: "#111111" } }; } };
  }
  return { id: "ThemeResolver", create: create };
}));
`
    });

    const result = runSmellContracts({
      root: cwd,
      enabledRules: ["theme-cache-invalidation"],
      print: false
    });
    expect(result.summary.ok).toBe(false);
    expect(messages(result)).toContain("[theme-cache-invalidation]");
  });

  it("fails dynamic-storekey-clears-on-empty when stale value key remains", function () {
    const cwd = createWorkspace({
      "config/shared/kind-defaults.js": `
(function (root) {
  root.DyniPlugin.config.shared.kindMaps = {};
}(this));
`,
      "config/shared/editable-param-utils.js": `
(function (root) {
  root.DyniPlugin.config.shared.makePerKindTextParams = function () { return {}; };
  root.DyniPlugin.config.shared.opt = function (name, value) { return { name: name, value: value }; };
}(this));
`,
      "config/clusters/environment.js": `
(function (root) {
  root.DyniPlugin.config.clusters.push({
    def: {
      cluster: "environment",
      updateFunction: function (values) {
        const out = values ? { ...values } : {};
        out.storeKeys = out.storeKeys || {};
        if (out.kind === "pressure" && typeof out.value === "string" && out.value.trim()) {
          out.storeKeys = { ...out.storeKeys, value: out.value.trim() };
        }
        return out;
      }
    }
  });
}(this));
`,
      "config/clusters/vessel.js": `
(function (root) {
  root.DyniPlugin.config.clusters.push({
    def: {
      cluster: "vessel",
      updateFunction: function (values) {
        const out = values ? { ...values } : {};
        out.storeKeys = out.storeKeys || {};
        if ((out.kind === "voltage" || out.kind === "voltageGraphic") && typeof out.value === "string" && out.value.trim()) {
          out.storeKeys = { ...out.storeKeys, value: out.value.trim() };
        }
        return out;
      }
    }
  });
}(this));
`
    });

    const result = runSmellContracts({
      root: cwd,
      enabledRules: ["dynamic-storekey-clears-on-empty"],
      print: false
    });
    expect(result.summary.ok).toBe(false);
    expect(messages(result)).toContain("[dynamic-storekey-clears-on-empty]");
  });

  it("fails falsy-default-preservation when truthy fallback is used", function () {
    const cwd = createWorkspace({
      "runtime/helpers.js": `
(function (root) {
  const runtime = root.DyniPlugin.runtime;
  runtime.applyFormatter = function (raw, props) {
    if (raw == null || Number.isNaN(raw)) return (props && props.default) || "---";
    return String(raw);
  };
}(this));
`,
      "runtime/widget-registrar.js": `
(function (root) {
  const runtime = root.DyniPlugin.runtime;
  runtime.registerWidget = function (component, widgetDef) {
    root.avnav.api.registerWidget({
      name: widgetDef.def.name,
      default: widgetDef.def.default || "---"
    }, {});
  };
}(this));
`
    });

    const result = runSmellContracts({
      root: cwd,
      enabledRules: ["falsy-default-preservation"],
      print: false
    });
    expect(result.summary.ok).toBe(false);
    expect(messages(result)).toContain("[falsy-default-preservation]");
  });

  it("fails mapper-output-no-nan when mapper emits NaN", function () {
    const moduleTemplate = (id, body) => `
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
}(this, function () {
  function create() {
    return {
      translate: function () { ${body} }
    };
  }
  return { id: "${id}", create: create };
}));
`;

    const cwd = createWorkspace({
      "cluster/mappers/SpeedMapper.js": moduleTemplate("SpeedMapper", "return { threshold: Number(undefined) };"),
      "cluster/mappers/EnvironmentMapper.js": moduleTemplate("EnvironmentMapper", "return {};"),
      "cluster/mappers/VesselMapper.js": moduleTemplate("VesselMapper", "return {};"),
      "cluster/mappers/WindMapper.js": moduleTemplate("WindMapper", "return {};"),
      "cluster/mappers/CourseHeadingMapper.js": moduleTemplate("CourseHeadingMapper", "return {};")
    });

    const result = runSmellContracts({
      root: cwd,
      enabledRules: ["mapper-output-no-nan"],
      print: false
    });
    expect(result.summary.ok).toBe(false);
    expect(messages(result)).toContain("[mapper-output-no-nan]");
  });

  it("fails text-layout-hotspot-budget when hotspot file grows beyond budget", function () {
    const manyLines = Array.from({ length: 271 }, (_, i) => `const x${i} = ${i};`).join("\n");
    const cwd = createWorkspace({
      "shared/widget-kits/gauge/GaugeTextLayout.js": manyLines,
      "widgets/gauges/WindDialWidget/WindDialWidget.js": "const ok = true;\n"
    });

    const result = runSmellContracts({
      root: cwd,
      enabledRules: ["text-layout-hotspot-budget"],
      print: false
    });
    expect(result.summary.ok).toBe(false);
    expect(messages(result)).toContain("[text-layout-hotspot-budget]");
  });

  it("fails coordinate-formatter-no-raw-equality-fallback when heuristic exists", function () {
    const cwd = createWorkspace({
      "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js": `
function format(out, n, fallbackText) {
  if (out.trim() === String(n)) return fallbackText;
  return out;
}
`
    });

    const result = runSmellContracts({
      root: cwd,
      enabledRules: ["coordinate-formatter-no-raw-equality-fallback"],
      print: false
    });
    expect(result.summary.ok).toBe(false);
    expect(messages(result)).toContain("[coordinate-formatter-no-raw-equality-fallback]");
  });
});
