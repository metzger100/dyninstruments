const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

describe("tools/check-file-size.mjs", function () {
  const toolPath = path.resolve(__dirname, "../../tools/check-file-size.mjs");
  const tempDirs = [];
  let runFileSizeCheck;

  beforeAll(async function () {
    const mod = await import(pathToFileURL(toolPath).href);
    runFileSizeCheck = mod.runFileSizeCheck;
  });

  afterEach(function () {
    while (tempDirs.length) {
      fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
    }
  });

  function createWorkspace(files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dyni-check-file-size-"));
    tempDirs.push(dir);

    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(dir, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf8");
    }

    return dir;
  }

  function runCheck(cwd, options = {}) {
    const logs = [];
    const errors = [];
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => logs.push(args.join(" "));
    console.error = (...args) => errors.push(args.join(" "));

    let result;
    try {
      result = runFileSizeCheck({
        root: cwd,
        onelinerMode: options.onelinerMode || "warn",
        print: options.print !== false
      });
    }
    finally {
      console.log = originalLog;
      console.error = originalError;
    }

    return {
      result,
      output: [...logs, ...errors].join("\n")
    };
  }

  it("warns on dense oneliner and stays non-blocking in default mode", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  function render() { const a = 1; const b = 2; return a + b; }
  render();
}());
`
    });

    const { result, output } = runCheck(cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(output).toContain("[file-size-oneliner-warn]");
    expect(output).toContain("Dense one-liner detected");
    expect(output).toContain("One-liners/oneliners are not allowed");
    expect(summary.onelinerMode).toBe("warn");
    expect(summary.onelinerDenseWarnings).toBe(1);
    expect(summary.onelinerLongWarnings).toBe(0);
    expect(summary.onelinerWarnings).toBe(1);
  });

  it("warns on stacked declarators in one line", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  const a = 1, b = 2;
}());
`
    });

    const { result, output } = runCheck(cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(output).toContain("[file-size-oneliner-warn]");
    expect(output).toContain("Dense one-liner detected");
    expect(summary.onelinerDenseWarnings).toBe(1);
    expect(summary.onelinerLongWarnings).toBe(0);
  });

  it("warns on comma-sequence assignment lines", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  a = 1, b = 2;
}());
`
    });

    const { result, output } = runCheck(cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(output).toContain("[file-size-oneliner-warn]");
    expect(output).toContain("Dense one-liner detected");
    expect(summary.onelinerDenseWarnings).toBe(1);
    expect(summary.onelinerLongWarnings).toBe(0);
  });

  it("warns on multiple statement leaders on one line without semicolons", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  if (a) { b(); } if (c) { d(); }
}());
`
    });

    const { result, output } = runCheck(cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(output).toContain("[file-size-oneliner-warn]");
    expect(output).toContain("Dense one-liner detected");
    expect(summary.onelinerDenseWarnings).toBe(1);
    expect(summary.onelinerLongWarnings).toBe(0);
  });

  it("warns on stacked function declarations in one line", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  function a() {} function b() {}
}());
`
    });

    const { result, output } = runCheck(cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(output).toContain("[file-size-oneliner-warn]");
    expect(output).toContain("Dense one-liner detected");
    expect(summary.onelinerDenseWarnings).toBe(1);
    expect(summary.onelinerLongWarnings).toBe(0);
  });

  it("warns on packed comma-operator call chains in one block", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  if (ok) { a(), b(), c(); }
}());
`
    });

    const { result, output } = runCheck(cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(output).toContain("[file-size-oneliner-warn]");
    expect(output).toContain("Dense one-liner detected");
    expect(summary.onelinerDenseWarnings).toBe(1);
    expect(summary.onelinerLongWarnings).toBe(0);
  });

  it("warns on packed for-header comma/assignment chains", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  for (i = 0, j = 0; i < n; i++, j++, a(), b()) {}
}());
`
    });

    const { result, output } = runCheck(cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(output).toContain("[file-size-oneliner-warn]");
    expect(output).toContain("Dense one-liner detected");
    expect(summary.onelinerDenseWarnings).toBe(1);
    expect(summary.onelinerLongWarnings).toBe(0);
  });

  it("warns on large single-destructuring declarations", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  const { a, b, c, d } = source;
}());
`
    });

    const { result, output } = runCheck(cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(output).toContain("[file-size-oneliner-warn]");
    expect(output).toContain("Dense one-liner detected");
    expect(summary.onelinerDenseWarnings).toBe(1);
    expect(summary.onelinerLongWarnings).toBe(0);
  });

  it("warns on very long packed line and stays non-blocking in default mode", function () {
    const props = Array.from({ length: 32 }, (_, i) => `k${i}: ${i}`).join(", ");
    const longLine = `const cacheKey = buildKey({ ${props} });`;
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  ${longLine}
}());
`
    });

    const { result, output } = runCheck(cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(output).toContain("[file-size-oneliner-warn]");
    expect(output).toContain("Very long packed one-liner");
    expect(summary.onelinerDenseWarnings).toBe(0);
    expect(summary.onelinerLongWarnings).toBe(1);
    expect(summary.onelinerWarnings).toBe(1);
  });

  it("warns on long operator-dense line without packed commas/braces", function () {
    const terms = Array.from({ length: 40 }, (_, i) => `v${i}`);
    const longLine = `const total = ${terms.join(" + ")};`;
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  ${longLine}
}());
`
    });

    const { result, output } = runCheck(cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(output).toContain("[file-size-oneliner-warn]");
    expect(output).toContain("Very long packed one-liner");
    expect(summary.onelinerDenseWarnings).toBe(0);
    expect(summary.onelinerLongWarnings).toBe(1);
  });

  it("warns on deep nested call-chain one-liners", function () {
    const deepChain = "const x = foo(bar(baz(qux(quux(corge(grault(garply(waldo(fred(plugh(xyzzy(thud()))))))))))));";
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  ${deepChain}
}());
`
    });

    const { result, output } = runCheck(cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(output).toContain("[file-size-oneliner-warn]");
    expect(output).toContain("Very long packed one-liner");
    expect(summary.onelinerDenseWarnings).toBe(0);
    expect(summary.onelinerLongWarnings).toBe(1);
  });

  it("does not flag for-loop headers as dense oneliners", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  for (let i = 0; i < 4; i++) {}
}());
`
    });

    const { result, output } = runCheck(cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(output).not.toContain("[file-size-oneliner");
    expect(summary.onelinerDenseWarnings).toBe(0);
    expect(summary.onelinerLongWarnings).toBe(0);
    expect(summary.onelinerWarnings).toBe(0);
  });

  it("does not flag single destructuring declaration as stacked declarators", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  const { a, b } = source;
}());
`
    });

    const { result, output } = runCheck(cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(output).not.toContain("[file-size-oneliner");
    expect(summary.onelinerDenseWarnings).toBe(0);
    expect(summary.onelinerLongWarnings).toBe(0);
    expect(summary.onelinerWarnings).toBe(0);
  });

  it("fails in block mode when oneliner findings exist", function () {
    const cwd = createWorkspace({
      "widgets/example.js": `
(function () {
  "use strict";
  function render() { const a = 1; const b = 2; return a + b; }
  render();
}());
`
    });

    const { result, output } = runCheck(cwd, { onelinerMode: "block" });
    const summary = result.summary;

    expect(summary.ok).toBe(false);
    expect(output).toContain("[file-size-oneliner]");
    expect(summary.onelinerMode).toBe("block");
    expect(summary.onelinerWarnings).toBe(1);
  });

  it("warns when file has exactly 300 non-empty lines", function () {
    const mediumBody = Array.from({ length: 300 }, (_, i) => `const v${i} = ${i};`).join("\n");
    const cwd = createWorkspace({
      "widgets/medium.js": mediumBody
    });

    const { result, output } = runCheck(cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(output).toContain("[file-size-warn] widgets/medium.js");
    expect(output).toContain("approaching 400 limit");
    expect(summary.warnings).toBe(1);
    expect(summary.violations).toBe(0);
  });

  it("keeps >400 line-size failures blocking and includes oneliner workaround guidance", function () {
    const largeBody = Array.from({ length: 401 }, (_, i) => `const v${i} = ${i};`).join("\n");
    const cwd = createWorkspace({
      "widgets/big.js": largeBody
    });

    const { result, output } = runCheck(cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(false);
    expect(output).toContain("[file-size] widgets/big.js");
    expect(output).toContain("limit 400");
    expect(output).toContain("One-liners/oneliners are not allowed as a workaround for line limits");
    expect(summary.violations).toBe(1);
  });
});
