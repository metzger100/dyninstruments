const {
  loadRunFileSizeCheck,
  createWorkspaceManager,
  runCheck
} = require("./check-file-size-test-utils");

describe("tools/check-file-size.mjs oneliner heuristics", function () {
  const workspaces = createWorkspaceManager();
  let runFileSizeCheck;

  beforeAll(async function () {
    runFileSizeCheck = await loadRunFileSizeCheck();
  });

  afterEach(function () {
    workspaces.cleanup();
  });

  function runSnippet(snippet, options = {}) {
    const cwd = workspaces.createWorkspace({
      "widgets/example.js": [
        "(function () {",
        '  "use strict";',
        `  ${snippet}`,
        "}());"
      ].join("\n")
    });

    const checkOptions = Object.assign({ onelinerMode: "warn" }, options);
    return runCheck(runFileSizeCheck, cwd, checkOptions);
  }

  function expectNoOneliner(summary, output) {
    expect(summary.ok).toBe(true);
    expect(summary.onelinerFindings).toBe(0);
    expect(summary.onelinerByKind.dense).toBe(0);
    expect(summary.onelinerByKind["long-packed"]).toBe(0);
    expect(summary.onelinerByKind["chained-ternary"]).toBe(0);
    expect(summary.onelinerByKind["single-line-body"]).toBe(0);
    expect(summary.onelinerByKind["collapsed-literal"]).toBe(0);
    expect(summary.onelinerByKind["collapsed-block"]).toBe(0);
    expect(output).not.toContain("[file-size-oneliner");
  }

  it("flags dense multi-statement one-liners", function () {
    const { result, output } = runSnippet("const a = 1; const b = 2;");
    const summary = result.summary;

    expect(summary.ok).toBe(true);
    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind.dense).toBe(1);
    expect(summary.onelinerByKind["long-packed"]).toBe(0);
    expect(output).toContain("[file-size-oneliner-warn]");
    expect(output).toContain("Dense one-liner detected");
  });

  it("flags stacked declarators", function () {
    const { result } = runSnippet("const a = 1, b = 2;");
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind.dense).toBe(1);
  });

  it("flags comma-sequence assignment lines", function () {
    const { result } = runSnippet("a = 1, b = 2;");
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind.dense).toBe(1);
  });

  it("flags multiple statement leaders on one line", function () {
    const { result } = runSnippet("if (a) { b(); } if (c) { d(); }");
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(1);
    expect(
      summary.onelinerByKind.dense + summary.onelinerByKind["collapsed-block"],
    ).toBe(1);
  });

  it("flags stacked function declarations", function () {
    const { result } = runSnippet("function a() {} function b() {}");
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(0);
    expect(summary.onelinerByKind.dense).toBe(0);
    expect(summary.onelinerByKind["single-line-body"]).toBe(0);
  });

  it("flags packed comma-operator call chains", function () {
    const { result } = runSnippet("a(), b(), c();");
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind.dense).toBe(1);
  });

  it("flags packed for-header comma and assignment chains", function () {
    const { result } = runSnippet("for (i = 0, j = 0; i < n; i++, j++, a(), b()) {}");
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind.dense).toBe(1);
  });

  it("flags large single-destructuring declarations", function () {
    const { result } = runSnippet("const { a, b, c, d } = source;");
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind.dense).toBe(1);
  });

  it("flags very long packed lines", function () {
    const args = Array.from({ length: 60 }, (_, i) => `v${i}`).join(", ");
    const { result } = runSnippet(`const cacheKey = buildKey(${args});`);
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind.dense).toBe(0);
    expect(summary.onelinerByKind["long-packed"]).toBe(1);
  });

  it("flags long operator-dense lines", function () {
    const terms = Array.from({ length: 40 }, (_, i) => `v${i}`);
    const { result } = runSnippet(`const total = ${terms.join(" + ")};`);
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind.dense).toBe(0);
    expect(summary.onelinerByKind["long-packed"]).toBe(1);
  });

  it("flags deep nested call-chain lines", function () {
    const deepChain = "const x = foo(bar(baz(qux(quux(corge(grault(garply(waldo(fred(plugh(xyzzy(thud()))))))))))));";
    const { result } = runSnippet(deepChain);
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind["long-packed"]).toBe(1);
  });

  it("does not flag a normal for-loop header", function () {
    const { result, output } = runSnippet("for (let i = 0; i < 4; i++) {};");
    expectNoOneliner(result.summary, output);
  });

  it("does not flag a small destructuring declaration", function () {
    const { result, output } = runSnippet("const { a, b } = source;");
    expectNoOneliner(result.summary, output);
  });

  it("fails in block mode when any oneliner finding exists", function () {
    const { result, output } = runSnippet("const a = 1, b = 2;", { onelinerMode: "block" });
    const summary = result.summary;

    expect(summary.ok).toBe(false);
    expect(summary.onelinerMode).toBe("block");
    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind.dense).toBe(1);
    expect(output).toContain("[file-size-oneliner]");
  });

  it("flags chained ternary expressions", function () {
    const { result } = runSnippet("const x = a ? b : c ? d : e;");
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind["chained-ternary"]).toBe(1);
  });

  it("does not flag a single ternary", function () {
    const { result, output } = runSnippet("const x = a ? b : c;");
    expectNoOneliner(result.summary, output);
  });

  it("does not flag independent ternaries in separate argument positions", function () {
    const { result, output } = runSnippet("foo(a ? b : c, d ? e : f);");
    expectNoOneliner(result.summary, output);
  });

  it("flags single-line function bodies", function () {
    const { result } = runSnippet("function foo(a) { const x = a + 1; return x; }");
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind["single-line-body"]).toBe(1);
  });

  it("flags single-line arrow function bodies", function () {
    const { result } = runSnippet("const f = (a) => { doStuff(); return a; };");
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind["single-line-body"]).toBe(1);
  });

  it("does not flag arrow functions without braces", function () {
    const { result, output } = runSnippet("const f = x => x + 1;");
    expectNoOneliner(result.summary, output);
  });

  it("does not flag empty function bodies", function () {
    const { result, output } = runSnippet("function noop() {}");
    expectNoOneliner(result.summary, output);
  });

  it("does not flag short return-only functions", function () {
    const { result, output } = runSnippet("function id(x) { return x; }");
    expectNoOneliner(result.summary, output);
  });

  it("flags collapsed object literals with 4+ entries over 80 chars", function () {
    const literal = "const cfg = { alpha: 1000, bravo: 2000, charlie: 3000, delta: 4000, echo: 5000 };";
    const { result } = runSnippet(literal);
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind["collapsed-literal"]).toBe(1);
  });

  it("flags collapsed array literals with 4+ entries over 80 chars", function () {
    const literal = "const arr = [\"alphaaaaaaaaaaa\", \"bravoooooooooo\", \"charlieeeeeeee\", \"deltaaaaaaaaaa\", \"echoooooooooooo\"];";
    const { result } = runSnippet(literal);
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind["collapsed-literal"]).toBe(1);
  });

  it("does not flag short object literals", function () {
    const { result, output } = runSnippet("const p = { x: 1, y: 2 };");
    expectNoOneliner(result.summary, output);
  });

  it("does not flag destructuring declarations as literals", function () {
    const { result, output } = runSnippet("const { a, b, c, d } = obj;");
    const summary = result.summary;

    expect(summary.onelinerByKind["collapsed-literal"]).toBe(0);
    expect(output).not.toContain("Object/array literal collapsed onto one line");
  });

  it("flags collapsed if blocks", function () {
    const { result } = runSnippet("if (x > 0) { doSomething(); }");
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind["collapsed-block"]).toBe(1);
  });

  it("flags collapsed if/else blocks", function () {
    const { result } = runSnippet("if (x) { a = 1; } else { a = 2; }");
    const summary = result.summary;

    expect(summary.onelinerFindings).toBe(1);
    expect(summary.onelinerByKind["collapsed-block"]).toBe(1);
  });

  it("does not flag brace-free guard return", function () {
    const { result, output } = runSnippet("if (x) return;");
    expectNoOneliner(result.summary, output);
  });

  it("does not flag brace-free guard throw", function () {
    const { result, output } = runSnippet('if (x) throw new Error("bad");');
    expectNoOneliner(result.summary, output);
  });
});
