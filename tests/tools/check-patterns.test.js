const { runPatternCheck, createWorkspace, joinMessages } = require("./check-patterns.harness.js");

describe("tools/check-patterns.mjs", function () {
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

  it("blocks legacy component-loader helpers and direct runtime service reach-throughs", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  function create(def, Helpers, componentContext) {
    const runtime = DyniPlugin.runtime;
    const theme = runtime.theme;
    const legacy = Helpers.getModule("ThemeModel");
    const loader = runtime.createHelpers();
    const ctx = runtime.createComponentContext();
    const dep = componentContext.components.get("Other");
    return theme + legacy + loader + ctx + dep;
  }
  create({}, {}, { components: { get() {} } });
}());
`
    });

    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
    const out = joinMessages(result.findings);

    expect(result.summary.ok).toBe(false);
    expect(out).toContain("[legacy-component-loader-api]");
    expect(out).toContain("[runtime-service-reach-through]");
    expect(result.summary.byRuleFailures["legacy-component-loader-api"]).toBeGreaterThan(0);
    expect(result.summary.byRuleFailures["runtime-service-reach-through"]).toBeGreaterThan(0);
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

  it("does not flag used candidate variables or named function expressions", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  const candidateValue = Number(7);
  const num = Number.isFinite(candidateValue) ? candidateValue : 0;
  const render = function renderStackTrace() {
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
});
