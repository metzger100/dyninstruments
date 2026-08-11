// @ts-check
const { countFindings, createWorkspace, joinMessages, runPatternCheck } = require("./check-patterns-setup");

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
    expect(countFindings(result, "premature-legacy-support", "block")).toBeGreaterThan(0);
    expect(countFindings(result, "premature-legacy-support", "warn")).toBe(0);
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
    // plugin-lint-disable-next-line catch-fallback-without-suppression
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
    expect(countFindings(result, "invalid-lint-suppression", "block")).toBeGreaterThan(0);
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
    } catch (e) { return "fallback"; } /* plugin-lint-disable-line not-a-real-rule -- bogus rule name */
  }
  runTask();
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(countFindings(result, "invalid-lint-suppression", "block")).toBeGreaterThan(0);
    expect(out).toContain("[invalid-lint-suppression]");
    expect(out).toContain("not-a-real-rule");
  });

  it("rejects generic suppressions in the module entrypoint", function () {
    const cwd = createWorkspace({
      "plugin.mjs": `
// plugin-lint-disable-next-line unsafe-html-dom-sink -- generic production bypass
root["innerHTML"] = markup;
`
    });
    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.ok).toBe(false);
    expect(countFindings(result, "invalid-lint-suppression", "block")).toBe(1);
    expect(countFindings(result, "unsafe-html-dom-sink", "block")).toBe(1);
  });

  it("accepts a valid permanent plugin-boundary marker for catch-fallback-without-suppression", function () {
    const cwd = createWorkspace({
      "runtime/example.js": `
(function () {
  "use strict";
  function runTask() {
    try {
      work();
    }
    // plugin-boundary-next-line(category: dom-host-uncertainty, owner: Metzger100, date: 2026-07-17) -- DOM host boundary
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
    expect(countFindings(result, "catch-fallback-without-suppression", "block")).toBe(0);
    expect(countFindings(result, "invalid-lint-suppression", "block")).toBe(0);
  });

  it("accepts a valid temporary plugin-boundary marker with a future expiry", function () {
    const cwd = createWorkspace({
      "runtime/example.js": `
(function () {
  "use strict";
  function runTask() {
    try {
      work();
    } catch (e) { return "fallback"; } /* plugin-boundary-line(category: dom-host-uncertainty, owner: Metzger100, date: 2026-07-17, expires: 2099-01-01) -- temporary boundary */
  }
  runTask();
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.ok).toBe(true);
    expect(countFindings(result, "catch-fallback-without-suppression", "block")).toBe(0);
  });

  it("rejects an expired plugin-boundary marker", function () {
    const cwd = createWorkspace({
      "runtime/example.js": `
(function () {
  "use strict";
  function runTask() {
    try {
      work();
    } catch (e) { return "fallback"; } /* plugin-boundary-line(category: dom-host-uncertainty, owner: Metzger100, date: 2020-01-01, expires: 2020-06-01) -- long expired */
  }
  runTask();
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(countFindings(result, "invalid-lint-suppression", "block")).toBeGreaterThan(0);
    expect(out).toContain("expired");
  });

  it("rejects a plugin-boundary marker missing a required field", function () {
    const cwd = createWorkspace({
      "runtime/example.js": `
(function () {
  "use strict";
  function runTask() {
    try {
      work();
    } catch (e) { return "fallback"; } /* plugin-boundary-line(category: dom-host-uncertainty, date: 2026-07-17) -- missing owner */
  }
  runTask();
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(countFindings(result, "invalid-lint-suppression", "block")).toBeGreaterThan(0);
    expect(out).toContain("owner");
  });

  it("does not let a plugin-boundary marker suppress an unrelated rule", function () {
    const cwd = createWorkspace({
      "shared/example.js": `
(function () {
  "use strict";
  function copy(axis) {
    // plugin-boundary-next-line(category: dom-host-uncertainty, owner: Metzger100, date: 2026-07-17) -- does not apply to premature-legacy-support
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
    expect(countFindings(result, "premature-legacy-support", "block")).toBeGreaterThan(0);
    expect(out).toContain("[premature-legacy-support]");
  });

  it("does not recognize the retired suppression prefix", function () {
    const oldPrefix = "dyn" + "i-lint-disable-next-line";
    const cwd = createWorkspace({
      "runtime/example.js": `
// ${oldPrefix} catch-fallback-without-suppression -- retired grammar
(function () {
  try { work(); } catch (e) { return "fallback"; }
}());
`
    });
    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(countFindings(result, "invalid-lint-suppression", "block")).toBe(0);
    expect(countFindings(result, "catch-fallback-without-suppression", "block")).toBe(1);
  });
});
