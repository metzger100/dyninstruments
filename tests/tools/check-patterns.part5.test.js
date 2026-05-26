const {
  runPatternCheck,
  createWorkspace,
  joinMessages,
} = require("./check-patterns.harness.js");

describe("tools/check-patterns.mjs", function () {
  it("treats premature-legacy-support findings as blocking", function () {
    const cwd = createWorkspace({
      "shared/example.js": `
(function () {
  "use strict";
  function copy(axis) {
    const fallbackAxis = axis;
    return fallbackAxis;
  }
  copy({});
}());
`,
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["premature-legacy-support"]).toBeGreaterThan(0);
    expect(result.summary.byRuleWarnings["premature-legacy-support"]).toBe(0);
    expect(out).toContain("[premature-legacy-support]");
  });

  it("blocks malformed lint suppression directives", function () {
    const cwd = createWorkspace({
      "runtime/example.js": `
(function () {
  "use strict";
  function runTask() {
    try {
      work();
    }
    // dyni-lint-disable-next-line catch-fallback-without-suppression
    catch (e) {
      return "fallback";
    }
  }
  runTask();
}());
`,
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["invalid-lint-suppression"]).toBeGreaterThan(0);
    expect(out).toContain("[invalid-lint-suppression]");
  });

  it("blocks unknown lint suppression rule names", function () {
    const cwd = createWorkspace({
      "runtime/example.js": `
(function () {
  "use strict";
  function runTask() {
    try {
      work();
    } catch (e) { return "fallback"; } /* dyni-lint-disable-line not-a-real-rule -- bogus rule name */
  }
  runTask();
}());
`,
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["invalid-lint-suppression"]).toBeGreaterThan(0);
    expect(out).toContain("[invalid-lint-suppression]");
    expect(out).toContain("not-a-real-rule");
  });
});
