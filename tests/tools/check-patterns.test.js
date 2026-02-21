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
});
