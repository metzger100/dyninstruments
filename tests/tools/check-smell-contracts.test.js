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

  it("fails theme-cache-invalidation when legacy resolver API is present", function () {
    const cwd = createWorkspace({
      "runtime/namespace.js": `
(function (root) {
  root.DyniPlugin = root.DyniPlugin || {};
  root.DyniPlugin.runtime = root.DyniPlugin.runtime || {};
  root.DyniPlugin.state = root.DyniPlugin.state || {};
  root.DyniPlugin.config = root.DyniPlugin.config || { shared: {}, clusters: [] };
}(this));
`,
      "runtime/theme/model.js": `
(function (root) {
  root.DyniPlugin.runtime.createThemeModel = function () {
    return {
      normalizePresetName() { return "default"; },
      getTokenDefinitions() { return [{ path: "colors.pointer", inputVar: "--dyni-pointer", type: "color", default: "#111111" }]; },
      getOutputTokenDefinitions() { return []; },
      getPresetMode() { return {}; },
      getPresetBase() { return {}; }
    };
  };
}(this));
`,
      "runtime/theme/resolver.js": `
(function (root) {
  root.DyniPlugin.runtime.createThemeResolver = function () {
    return {
      resolveForRoot: function () { return Object.freeze({ colors: Object.freeze({ pointer: "#111111" }) }); },
      resolveOutputsForRoot: function () { return Object.freeze({}); }
    };
  };
}(this));
`,
      "runtime/init.js": "(function () {}(this));\n"
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
      "config/shared/environment-base-editables.js": `
(function (root) {
  root.DyniPlugin.config.shared.buildEnvironmentBaseEditableParameters = function () { return {}; };
}(this));
`,
      "config/shared/environment-depth-editables.js": `
(function (root) {
  root.DyniPlugin.config.shared.buildEnvironmentDepthEditableParameters = function () { return {}; };
}(this));
`,
      "config/shared/environment-temperature-editables.js": `
(function (root) {
  root.DyniPlugin.config.shared.buildEnvironmentTemperatureEditableParameters = function () { return {}; };
}(this));
`,
      "config/shared/environment-editables.js": `
(function (root) {
  root.DyniPlugin.config.shared.buildEnvironmentEditableParameters = function () { return {}; };
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
        if ((out.kind === "voltage" || out.kind === "voltageRadial") && typeof out.value === "string" && out.value.trim()) {
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
      "runtime/namespace.js": `
(function (root) {
  const runtime = root.DyniPlugin.runtime;
  runtime.getAvnavApi = function () { return root.avnav.api; };
}(this));
`,
      "runtime/format-runtime.js": `
(function (root) {
  const runtime = root.DyniPlugin.runtime;
  runtime.format = { applyFormatter: function (raw, props) {
    if (raw == null || Number.isNaN(raw)) return (props && props.default) || "---";
    return String(raw);
  } };
}(this));
`,
      "runtime/widget-registrar.js": `
(function (root) {
  const runtime = root.DyniPlugin.runtime;
  runtime.registerWidget = function (componentSpec, widgetDef) {
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
    const manyLines = Array.from({ length: 291 }, (_, i) => `const x${i} = ${i};`).join("\n");
    const cwd = createWorkspace({
      "shared/widget-kits/text/CanvasTextLayout.js": manyLines,
      "widgets/radial/WindRadialWidget/WindRadialWidget.js": "const ok = true;\n"
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
function format(out, n, plainText) {
  if (out.trim() === String(n)) return plainText;
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

  it("fails placeholder-contract when formatter output is not normalized nearby", function () {
    const cwd = createWorkspace({
      "shared/widget-kits/format/PlaceholderNormalize.js": `
function isPlaceholder(text) {
  const trimmed = String(text).trim();
  return trimmed === "NaN" || trimmed === "undefined" || trimmed === "null" || trimmed === "Infinity" || trimmed === "-Infinity";
}
`,
      "shared/widget-kits/nav/EditRouteRenderModel.js": `
function render(componentContext) {
  const text = componentContext.format.applyFormatter(10, { formatter: "formatDistance", default: "---" });
  return text;
}
`
    });

    const result = runSmellContracts({
      root: cwd,
      enabledRules: ["placeholder-contract"],
      print: false
    });
    expect(result.summary.ok).toBe(false);
    expect(messages(result)).toContain("[placeholder-contract]");
  });

  it("fails formatter-boundary-empty-string when empty input is forwarded to formatter", function () {
    const cwd = createWorkspace({
      "runtime/namespace.js": `
(function (root) {
  root.DyniPlugin = root.DyniPlugin || {};
  root.DyniPlugin.runtime = root.DyniPlugin.runtime || {};
  root.DyniPlugin.state = root.DyniPlugin.state || {};
  root.DyniPlugin.config = root.DyniPlugin.config || { shared: {}, clusters: [] };
  root.DyniPlugin.runtime.getAvnavApi = function () {
    return root.avnav.api;
  };
}(this));
`,
      "runtime/format-runtime.js": `
(function (root) {
  root.DyniPlugin.runtime.format = {
    applyFormatter: function (raw, props) {
      const p = props || {};
      if (raw == null || Number.isNaN(raw)) return p.default || "---";
      return root.avnav.api.formatter[p.formatter](raw);
    }
  };
}(this));
`
    });

    const result = runSmellContracts({
      root: cwd,
      enabledRules: ["formatter-boundary-empty-string"],
      print: false
    });
    expect(result.summary.ok).toBe(false);
    expect(messages(result)).toContain("[formatter-boundary-empty-string]");
  });

  it("fails placeholder-contract when PlaceholderNormalize sentinel coverage is missing", function () {
    const cwd = createWorkspace({
      "shared/widget-kits/format/PlaceholderNormalize.js": `
function isPlaceholder(text) {
  const trimmed = String(text).trim();
  return trimmed === "---";
}
`,
      "shared/widget-kits/nav/EditRouteRenderModel.js": `
function render(componentContext, placeholderNormalize) {
  const text = componentContext.format.applyFormatter(10, { formatter: "formatDistance", default: "---" });
  return placeholderNormalize.normalize(text, "---");
}
`
    });

    const result = runSmellContracts({
      root: cwd,
      enabledRules: ["placeholder-contract"],
      print: false
    });
    expect(result.summary.ok).toBe(false);
    expect(messages(result)).toContain("[placeholder-contract]");
    expect(messages(result)).toContain("missing NaN");
  });

  it("fails dash-literal-contract when a widget source keeps a banned placeholder literal", function () {
    const cwd = createWorkspace({
      "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js": `
function render() {
  return "NO DATA";
}
`
    });

    const result = runSmellContracts({
      root: cwd,
      enabledRules: ["dash-literal-contract"],
      print: false
    });
    expect(result.summary.ok).toBe(false);
    expect(messages(result)).toContain("[dash-literal-contract]");
  });

  it("fails state-screen-precedence-contract when pickFirst order is not canonical", function () {
    const cwd = createWorkspace({
      "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js": `
function resolve(precedence, props) {
  return precedence.pickFirst([
    { kind: "noRoute", when: props.routeName === "" },
    { kind: "disconnected", when: props.disconnect === true },
    { kind: "data", when: true }
  ]);
}
`
    });

    const result = runSmellContracts({
      root: cwd,
      enabledRules: ["state-screen-precedence-contract"],
      print: false
    });
    expect(result.summary.ok).toBe(false);
    expect(messages(result)).toContain("[state-screen-precedence-contract]");
  });
});
