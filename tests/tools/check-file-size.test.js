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

  it("keeps >300 line-size failures blocking and includes oneliner workaround guidance", function () {
    const largeBody = Array.from({ length: 301 }, (_, i) => `const v${i} = ${i};`).join("\n");
    const cwd = createWorkspace({
      "widgets/big.js": largeBody
    });

    const { result, output } = runCheck(cwd);
    const summary = result.summary;

    expect(summary.ok).toBe(false);
    expect(output).toContain("[file-size] widgets/big.js");
    expect(output).toContain("One-liners/oneliners are not allowed as a workaround for line limits");
    expect(summary.violations).toBe(1);
  });
});
