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
  it("blocks fallbackText wrappers that duplicate componentContext.format.applyFormatter defaults", function () {
    const cwd = createWorkspace({
      "widgets/SampleWidget.js": `
(function () {
  "use strict";
  function fallbackText(value, fallback) {
    return value == null ? fallback : value;
  }
  function renderCanvas(canvas, props, componentContext) {
    const p = props || {};
    const out = fallbackText(componentContext.format.applyFormatter(p.value, {
      formatter: "formatDistance",
      formatterParameters: [p.unit],
      default: "---"
    }), "---");
    return out + String(canvas);
  }
  renderCanvas({}, {}, { format: { applyFormatter: function () { return "---"; } } });
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["redundant-internal-fallback"]).toBeGreaterThan(0);
    expect(out).toContain("[redundant-internal-fallback]");
    expect(out).toContain("componentContext.format.applyFormatter");
  });

  it("allows fallbacks tied to external runtime factors", function () {
    const cwd = createWorkspace({
      "runtime/example.js": `
(function (root) {
  "use strict";
  function readValue(props) {
    const unavailableText = props.unavailableText;
    if (root.avnav && root.avnav.api) {
      return props.value;
    }
    return props.value || unavailableText;
  }
  readValue({ unavailableText: "missing" });
}(this));
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    expect(result.summary.ok).toBe(true);
    expect(result.summary.byRule["redundant-internal-fallback"]).toBe(0);
  });
});
