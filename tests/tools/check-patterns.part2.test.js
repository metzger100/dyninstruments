// @ts-nocheck
const {
  toolPath,
  tempDirs,
  runPatternCheck,
  createWorkspace,
  joinMessages,
  joinWarningMessages
} = require("./check-patterns.harness.js");

describe("tools/check-patterns.mjs", function () {
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

  it("blocks when mapper translate return object has more than 8 properties", function () {
    const cwd = createWorkspace({
      "cluster/mappers/SampleMapper.js": `
(function () {
  "use strict";
  function create() {
    function translate(props) {
      const req = props && props.kind;
      if (req === "speedGraphic") {
        return {
          renderer: "SpeedRadialWidget",
          value: props.speed,
          caption: "SPD",
          unit: "kn",
          formatter: "formatSpeed",
          formatterParameters: ["kn"],
          minValue: 0,
          maxValue: props.maxValue,
          tickMajor: props.tickMajor
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
          renderer: "SpeedRadialWidget",
          value: props.speed,
          caption: "SPD",
          unit: "kn",
          formatter: "formatSpeed",
          formatterParameters: ["kn"],
          minValue: 0,
          maxValue: props.maxValue,
          tickMajor: props.tickMajor,
          tickMinor: props.tickMinor,
          warningFrom: props.warningFrom,
          alarmFrom: props.alarmFrom,
          ratioThresholdNormal: props.ratioThresholdNormal,
          ratioThresholdFlat: props.ratioThresholdFlat
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
          renderer: "SpeedRadialWidget",
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
    const failureOut = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(failureOut).toContain("kind 'aGraphic|bGraphic'");
  });

  it("blocks cluster-prefixed renderer wrapper ids in cluster/rendering", function () {
    const cwd = createWorkspace({
      "config/clusters/vessel.js": "\n",
      "cluster/rendering/VesselDateTimeRendererWrapper.js": "\n"
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(out).toContain("[cluster-renderer-cluster-prefix]");
    expect(out).toContain("VesselDateTimeRendererWrapper");
  });

  it("allows role-based ids in cluster/rendering", function () {
    const cwd = createWorkspace({
      "config/clusters/vessel.js": "\n",
      "cluster/rendering/RoleBasedWidget.js": "\n"
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
    expect(out).toContain('p.unit ?? "°"');
  });
});
