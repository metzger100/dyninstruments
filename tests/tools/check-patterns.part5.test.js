// @ts-nocheck
const { runPatternCheck, createWorkspace, joinMessages } = require("./check-patterns.harness.js");

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
`
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
`
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
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["invalid-lint-suppression"]).toBeGreaterThan(0);
    expect(out).toContain("[invalid-lint-suppression]");
    expect(out).toContain("not-a-real-rule");
  });

  it("rejects generic suppressions in the module entrypoint", function () {
    const cwd = createWorkspace({
      "plugin.mjs": `
// dyni-lint-disable-next-line unsafe-html-dom-sink -- generic production bypass
root["innerHTML"] = markup;
`
    });
    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["invalid-lint-suppression"]).toBe(1);
    expect(result.summary.byRuleFailures["unsafe-html-dom-sink"]).toBe(1);
  });

  it("accepts a valid permanent dyni-boundary marker for catch-fallback-without-suppression", function () {
    const cwd = createWorkspace({
      "runtime/example.js": `
(function () {
  "use strict";
  function runTask() {
    try {
      work();
    }
    // dyni-boundary-next-line(category: dom-host-uncertainty, owner: Metzger100, date: 2026-07-17) -- DOM host boundary
    catch (e) {
      return "fallback";
    }
  }
  runTask();
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.ok).toBe(true);
    expect(result.summary.byRuleFailures["catch-fallback-without-suppression"]).toBe(0);
    expect(result.summary.byRuleFailures["invalid-lint-suppression"]).toBe(0);
  });

  it("accepts a valid temporary dyni-boundary marker with a future expiry", function () {
    const cwd = createWorkspace({
      "runtime/example.js": `
(function () {
  "use strict";
  function runTask() {
    try {
      work();
    } catch (e) { return "fallback"; } /* dyni-boundary-line(category: dom-host-uncertainty, owner: Metzger100, date: 2026-07-17, expires: 2099-01-01) -- temporary boundary */
  }
  runTask();
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.ok).toBe(true);
    expect(result.summary.byRuleFailures["catch-fallback-without-suppression"]).toBe(0);
  });

  it("rejects an expired dyni-boundary marker", function () {
    const cwd = createWorkspace({
      "runtime/example.js": `
(function () {
  "use strict";
  function runTask() {
    try {
      work();
    } catch (e) { return "fallback"; } /* dyni-boundary-line(category: dom-host-uncertainty, owner: Metzger100, date: 2020-01-01, expires: 2020-06-01) -- long expired */
  }
  runTask();
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["invalid-lint-suppression"]).toBeGreaterThan(0);
    expect(out).toContain("expired");
  });

  it("rejects a dyni-boundary marker missing a required field", function () {
    const cwd = createWorkspace({
      "runtime/example.js": `
(function () {
  "use strict";
  function runTask() {
    try {
      work();
    } catch (e) { return "fallback"; } /* dyni-boundary-line(category: dom-host-uncertainty, date: 2026-07-17) -- missing owner */
  }
  runTask();
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["invalid-lint-suppression"]).toBeGreaterThan(0);
    expect(out).toContain("owner");
  });

  it("does not let a dyni-boundary marker suppress an unrelated rule", function () {
    const cwd = createWorkspace({
      "shared/example.js": `
(function () {
  "use strict";
  function copy(axis) {
    // dyni-boundary-next-line(category: dom-host-uncertainty, owner: Metzger100, date: 2026-07-17) -- does not apply to premature-legacy-support
    const fallbackAxis = axis;
    return fallbackAxis;
  }
  copy({});
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(result.summary.byRuleFailures["premature-legacy-support"]).toBeGreaterThan(0);
    expect(out).toContain("[premature-legacy-support]");
  });
});
