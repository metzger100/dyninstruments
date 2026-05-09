const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { createMockCanvas, createMockContext2D } = require("../helpers/mock-canvas");

describe("runtime/canvas-runtime.js", function () {
  function loadRuntimeCanvas(extra) {
    const context = createScriptContext(Object.assign({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      },
      devicePixelRatio: 2
    }, extra || {}));

    runIifeScript("runtime/namespace.js", context);
    runIifeScript("runtime/canvas-runtime.js", context);
    return context.DyniPlugin.runtime;
  }

  it("applies dpr transform and returns css dimensions", function () {
    const runtime = loadRuntimeCanvas();
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 300, rectHeight: 120, ctx });

    const out = runtime.canvas.setupCanvas(canvas);

    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(240);
    expect(out.W).toBe(300);
    expect(out.H).toBe(120);
    expect(ctx.calls.some((c) => c.name === "setTransform")).toBe(true);
  });
});
