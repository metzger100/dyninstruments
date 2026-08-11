// @ts-check
const { countFindings, createWorkspace, joinMessages, runPatternCheck } = require("./check-patterns-setup");

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
    expect(countFindings(result, "redundant-internal-fallback", "block")).toBeGreaterThan(0);
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
    expect(result.summary.byRule["redundant-internal-fallback"] || 0).toBe(0);
  });

  it("allows a literal historical exec-plan filename reference", function () {
    const cwd = createWorkspace({
      "documentation/note.md": "# Note\n\nSee `exec-plans/completed/PLAN6.md` for history.\n"
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.ok).toBe(true);
    expect(result.summary.byRule["exec-plan-reference"] || 0).toBe(0);
  });

  it("blocks a historical plan-number citation outside exec-plans/", function () {
    // Built by concatenation so this fixture's own literal text does not trip the very
    // rule it exercises when the real repo-wide check-patterns run scans this test file.
    const planCitation = "// " + "PLAN" + "9's architecture note.\n";
    const cwd = createWorkspace({
      "tools/example.mjs": planCitation
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(countFindings(result, "exec-plan-reference", "block")).toBeGreaterThan(0);
    expect(out).toContain("[exec-plan-reference]");
  });

  it("blocks a bare historical phase-number citation outside exec-plans/", function () {
    const phaseCitation = "// Retired in " + "Phase" + " 5, replaced by the new owner.\n";
    const cwd = createWorkspace({
      "tests/example.test.js": phaseCitation
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(countFindings(result, "exec-plan-reference", "block")).toBeGreaterThan(0);
    expect(out).toContain("[exec-plan-reference]");
  });
});
