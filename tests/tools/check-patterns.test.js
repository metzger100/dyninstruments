const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

describe("tools/check-patterns.mjs", function () {
  const toolPath = path.resolve(__dirname, "../../tools/check-patterns.mjs");
  const tempDirs = [];
  let runPatternCheck;

  beforeAll(async function () {
    const mod = await import(pathToFileURL(toolPath).href);
    runPatternCheck = mod.runPatternCheck;
  });

  afterEach(function () {
    while (tempDirs.length) {
      fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
    }
  });

  function createWorkspace(files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-check-patterns-"));
    tempDirs.push(dir);

    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(dir, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf8");
    }
    return dir;
  }

  function joinMessages(findings) {
    return findings.map((item) => item.message).join("\n");
  }
  function joinWarningMessages(warnings) {
    return warnings.map((item) => item.message).join("\n");
  }

  it("blocks renamed but identical function bodies across files", function () {
    const cwd = createWorkspace({
      "widgets/a.js": `
function computeAlpha(value) {
  let total = 0;
  const limit = Number(value);
  for (let i = 0; i < limit; i += 1) {
    if (i % 2 === 0) {
      total += i * 3;
    } else {
      total -= i;
    }
  }
  if (total > 10) {
    total = total - 5;
  } else {
    total = total + 2;
  }
  return total;
}
computeAlpha(6);
`,
      "widgets/b.js": `
function computeBeta(value) {
  let total = 0;
  const limit = Number(value);
  for (let i = 0; i < limit; i += 1) {
    if (i % 2 === 0) {
      total += i * 3;
    } else {
      total -= i;
    }
  }
  if (total > 10) {
    total = total - 5;
  } else {
    total = total + 2;
  }
  return total;
}
computeBeta(6);
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(out).toContain("[duplicate-fn-body]");
    expect(result.summary.byRule["duplicate-functions"]).toBeGreaterThan(0);
  });

  it("blocks duplicate function-expression and arrow-function bodies", function () {
    const cwd = createWorkspace({
      "widgets/a.js": `
const buildMetric = function (list) {
  let total = 0;
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    if (item > 0) {
      total += item * 2;
    } else {
      total -= item;
    }
  }
  if (total > 100) {
    total = total - 50;
  } else {
    total = total + 10;
  }
  return total;
};
buildMetric([1, 2, 3, 4]);
`,
      "widgets/b.js": `
const calcMetric = (list) => {
  let total = 0;
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    if (item > 0) {
      total += item * 2;
    } else {
      total -= item;
    }
  }
  if (total > 100) {
    total = total - 50;
  } else {
    total = total + 10;
  }
  return total;
};
calcMetric([1, 2, 3, 4]);
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(out).toContain("[duplicate-fn-body]");
    expect(result.summary.byRule["duplicate-functions"]).toBeGreaterThan(0);
  });

  it("does not flag same function names when function bodies differ", function () {
    const cwd = createWorkspace({
      "widgets/a.js": `
function computeValue(value) {
  return value + 1;
}
computeValue(3);
`,
      "widgets/b.js": `
function computeValue(value) {
  return value * 2;
}
computeValue(3);
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    expect(result.summary.ok).toBe(true);
    expect(result.summary.byRule["duplicate-functions"]).toBe(0);
    expect(result.summary.byRule["duplicate-block-clones"]).toBe(0);
  });

  it("blocks long duplicated function blocks across files", function () {
    const sharedBlock = `
  for (let i = 0; i < rows.length; i += 1) {
    const item = rows[i];
    if (!item) {
      continue;
    }
    total += item.speed;
    total -= item.drag;
    total += item.wind;
    total += item.current;
    total -= item.current;
    total = total + 1;
    total = total - 1;
    if (total > 1000) {
      total = total / 2;
    }
  }
  for (let j = 0; j < rows.length; j += 1) {
    const next = rows[j];
    if (!next) {
      continue;
    }
    total += next.speed;
    total -= next.drag;
    total += next.wind;
    total += next.current;
    total -= next.current;
    total = total + 2;
    total = total - 2;
    if (total > 1000) {
      total = total / 2;
    }
  }
`;
    const cwd = createWorkspace({
      "widgets/a.js": `
function aggregateA(rows) {
  let total = 0;
  let mode = 1;
${sharedBlock}
  if (mode > 0) {
    total += mode;
  }
  return total;
}
aggregateA([{ speed: 2, drag: 1, wind: 1, current: 1 }]);
`,
      "widgets/b.js": `
function aggregateB(rows) {
  let total = 5;
  let mode = 2;
${sharedBlock}
  if (mode > 1) {
    total -= mode;
  }
  return total;
}
aggregateB([{ speed: 2, drag: 1, wind: 1, current: 1 }]);
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(out).toContain("[duplicate-block]");
    expect(result.summary.byRule["duplicate-block-clones"]).toBeGreaterThan(0);
  });

  it("ignores allowlisted orchestration names and short snippets", function () {
    const cwd = createWorkspace({
      "widgets/a.js": `
function create() { return { ok: true }; }
function renderCanvas() { return 1; }
function tiny() { return 1; }
create();
renderCanvas();
tiny();
`,
      "widgets/b.js": `
function create() { return { ok: true }; }
function renderCanvas() { return 1; }
function tiny() { return 1; }
create();
renderCanvas();
tiny();
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    expect(result.summary.ok).toBe(true);
    expect(result.summary.byRule["duplicate-functions"]).toBe(0);
    expect(result.summary.byRule["duplicate-block-clones"]).toBe(0);
  });

  it("blocks dead unused helper functions", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  function staleHelper() { return 1; }
  function activeHelper() { return 2; }
  activeHelper();
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(out).toContain("[dead-code]");
    expect(out).toContain("staleHelper");
  });

  it("blocks constant-condition dead branches", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  const USE_GRAPHIC = false;
  if (USE_GRAPHIC) {
    function drawGraphic() {}
    drawGraphic();
  } else {
    function drawNumeric() {}
    drawNumeric();
  }
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(out).toContain("[dead-code]");
    expect(out).toContain("const USE_GRAPHIC = false");
  });

  it("blocks unused fallback declarations", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  const fallback = Number(12);
  const current = 5;
  if (current > 0) {}
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(out).toContain("[unused-fallback]");
    expect(out).toContain("fallback");
  });

  it("does not flag used fallback variables or named function expressions", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  const fallbackValue = Number(7);
  const num = isFinite(fallbackValue) ? fallbackValue : 0;
  const render = function fallbackStackTrace() {
    return num;
  };
  render();
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    expect(result.summary.ok).toBe(true);
    expect(result.findings).toHaveLength(0);
  });

  it("blocks truthy fallback on .default properties", function () {
    const cwd = createWorkspace({
      "runtime/example.js": `
(function () {
  "use strict";
  const baseDef = { default: props.default || "---" };
  return baseDef;
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(out).toContain("[default-truthy-fallback]");
  });

  it("blocks formatter availability heuristics based on output equality", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  function normalize(out, n, fallbackText) {
    if (out.trim() === String(n)) return fallbackText;
    return out;
  }
  normalize("1", 1, "---");
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(out).toContain("[formatter-availability-heuristic]");
  });

  it("blocks renderer-side Number(props.x) coercion", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  function renderCanvas(canvas, props) {
    const threshold = Number(props.ratioThresholdFlat ?? 3.0);
    return threshold;
  }
  renderCanvas({}, {});
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(out).toContain("[renderer-numeric-coercion-without-boundary-contract]");
  });

  it("blocks helper function declarations in cluster mappers", function () {
    const cwd = createWorkspace({
      "cluster/mappers/SampleMapper.js": `
(function () {
  "use strict";
  function create() {
    function decorate(value) {
      return value;
    }
    function translate(props) {
      return { value: decorate(props.value) };
    }
    return { cluster: "sample", translate: translate };
  }
  return { id: "SampleMapper", create: create };
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(out).toContain("[mapper-logic-leakage]");
    expect(out).toContain("decorate");
  });

  it("blocks helper function bindings in cluster mappers", function () {
    const cwd = createWorkspace({
      "cluster/mappers/SampleMapper.js": `
(function () {
  "use strict";
  function create() {
    function translate(props) {
      const decorate = (value) => value;
      return { value: decorate(props.value) };
    }
    return { cluster: "sample", translate: translate };
  }
  return { id: "SampleMapper", create: create };
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(out).toContain("[mapper-logic-leakage]");
    expect(out).toContain("decorate");
  });

  it("warns when mapper translate return object has more than 8 properties", function () {
    const cwd = createWorkspace({
      "cluster/mappers/SampleMapper.js": `
(function () {
  "use strict";
  function create() {
    function translate(props) {
      const req = props && props.kind;
      if (req === "speedGraphic") {
        return {
          renderer: "SpeedGaugeWidget",
          value: props.speed,
          caption: "SPD",
          unit: "kn",
          formatter: "formatSpeed",
          formatterParameters: ["kn"],
          minValue: 0,
          maxValue: 30,
          tickMajor: 5
        };
      }
      return {};
    }
    return { cluster: "sample", translate: translate };
  }
  return { id: "SampleMapper", create: create };
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const warningOut = joinWarningMessages(result.warnings || []);

    expect(result.summary.ok).toBe(true);
    expect(result.summary.failures).toBe(0);
    expect(result.summary.warnings).toBe(1);
    expect(result.summary.byRuleWarnings["mapper-output-complexity"]).toBe(1);
    expect(result.summary.byRuleFailures["mapper-output-complexity"]).toBe(0);
    expect(result.findings).toHaveLength(0);
    expect(warningOut).toContain("[mapper-output-complexity]");
    expect(warningOut).toContain("kind 'speedGraphic'");
  });

  it("blocks when mapper translate return object has more than 12 properties", function () {
    const cwd = createWorkspace({
      "cluster/mappers/SampleMapper.js": `
(function () {
  "use strict";
  function create() {
    function translate(props) {
      const req = props && props.kind;
      if (req === "speedGraphic") {
        return {
          renderer: "SpeedGaugeWidget",
          value: props.speed,
          caption: "SPD",
          unit: "kn",
          formatter: "formatSpeed",
          formatterParameters: ["kn"],
          minValue: 0,
          maxValue: 30,
          tickMajor: 5,
          tickMinor: 1,
          warningFrom: 20,
          alarmFrom: 25,
          ratioThresholdNormal: 1.2,
          ratioThresholdFlat: 3.5
        };
      }
      return {};
    }
    return { cluster: "sample", translate: translate };
  }
  return { id: "SampleMapper", create: create };
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const failureOut = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(result.summary.failures).toBe(1);
    expect(result.summary.warnings).toBe(0);
    expect(result.summary.byRuleFailures["mapper-output-complexity"]).toBe(1);
    expect(result.summary.byRuleWarnings["mapper-output-complexity"]).toBe(0);
    expect(failureOut).toContain("[mapper-output-complexity]");
    expect(failureOut).toContain("kind 'speedGraphic'");
  });

  it("reports multi-kind labels for mapper-output-complexity findings", function () {
    const cwd = createWorkspace({
      "cluster/mappers/SampleMapper.js": `
(function () {
  "use strict";
  function create() {
    function translate(props) {
      const req = props && props.kind;
      if (req === "aGraphic" || req === "bGraphic") {
        return {
          renderer: "SpeedGaugeWidget",
          value: props.speed,
          caption: "SPD",
          unit: "kn",
          formatter: "formatSpeed",
          formatterParameters: ["kn"],
          minValue: 0,
          maxValue: 30,
          tickMajor: 5
        };
      }
      return {};
    }
    return { cluster: "sample", translate: translate };
  }
  return { id: "SampleMapper", create: create };
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const warningOut = joinWarningMessages(result.warnings || []);

    expect(result.summary.ok).toBe(true);
    expect(warningOut).toContain("kind 'aGraphic|bGraphic'");
  });

  it("blocks cluster-prefixed renderer wrapper ids in cluster/rendering", function () {
    const cwd = createWorkspace({
      "config/clusters/vessel.js": "\n",
      "cluster/rendering/VesselDateTimeWidget.js": "\n"
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(out).toContain("[cluster-renderer-cluster-prefix]");
    expect(out).toContain("VesselDateTimeWidget");
  });

  it("allows role-based renderer wrapper ids in cluster/rendering", function () {
    const cwd = createWorkspace({
      "config/clusters/vessel.js": "\n",
      "cluster/rendering/DateTimeWidget.js": "\n"
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    expect(result.summary.ok).toBe(true);
    expect(result.findings).toHaveLength(0);
  });

  it("blocks guaranteed mapper-contract prop fallbacks in renderer code", function () {
    const cwd = createWorkspace({
      "cluster/mappers/SampleMapper.js": `
(function () {
  "use strict";
  function create() {
    function translate(props, toolkit) {
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const headingUnit = unit("xteDisplayCog");
      return {
        renderer: "SampleWidget",
        rendererProps: {
          trackCaption: cap("xteDisplayCog"),
          trackUnit: headingUnit,
          unit: unit("xteDisplayCog")
        }
      };
    }
    return { cluster: "sample", translate: translate };
  }
  return { id: "SampleMapper", create: create };
}());
`,
      "widgets/SampleWidget.js": `
(function () {
  "use strict";
  function fallbackText(value, fallback) {
    return value == null ? fallback : value;
  }
  function renderCanvas(canvas, props) {
    const p = props || {};
    const a = fallbackText(p.trackCaption, "COG");
    const b = fallbackText(p.trackUnit, p.unit);
    const c = String(p.unit ?? "°").trim();
    return a + b + c + String(canvas);
  }
  renderCanvas({}, {});
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRule).toHaveProperty("redundant-internal-fallback");
    expect(result.summary.byRuleFailures["redundant-internal-fallback"]).toBeGreaterThan(0);
    expect(out).toContain("[redundant-internal-fallback]");
    expect(out).toContain("trackCaption");
    expect(out).toContain("trackUnit");
    expect(out).toContain("p.unit ?? \"°\"");
  });

  it("blocks fallbackText wrappers that duplicate Helpers.applyFormatter defaults", function () {
    const cwd = createWorkspace({
      "widgets/SampleWidget.js": `
(function () {
  "use strict";
  function fallbackText(value, fallback) {
    return value == null ? fallback : value;
  }
  function renderCanvas(canvas, props, Helpers) {
    const p = props || {};
    const out = fallbackText(Helpers.applyFormatter(p.value, {
      formatter: "formatDistance",
      formatterParameters: [p.unit],
      default: "---"
    }), "---");
    return out + String(canvas);
  }
  renderCanvas({}, {}, { applyFormatter: function () { return "---"; } });
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["redundant-internal-fallback"]).toBeGreaterThan(0);
    expect(out).toContain("[redundant-internal-fallback]");
    expect(out).toContain("Helpers.applyFormatter");
  });

  it("allows fallbacks tied to external runtime factors", function () {
    const cwd = createWorkspace({
      "runtime/example.js": `
(function (root) {
  "use strict";
  function readValue(props) {
    if (root.avnav && root.avnav.api) {
      return props.value;
    }
    return props.value || "---";
  }
  readValue({});
}(this));
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    expect(result.summary.ok).toBe(true);
    expect(result.summary.byRule["redundant-internal-fallback"]).toBe(0);
  });

  it("allows non-guaranteed fallback props", function () {
    const cwd = createWorkspace({
      "widgets/SampleWidget.js": `
(function () {
  "use strict";
  function renderCanvas(canvas, props) {
    const p = props || {};
    return String(p.dynamicUnit ?? "kn") + String(canvas);
  }
  renderCanvas({}, {});
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    expect(result.summary.ok).toBe(true);
    expect(result.summary.byRule["redundant-internal-fallback"]).toBe(0);
  });
});
