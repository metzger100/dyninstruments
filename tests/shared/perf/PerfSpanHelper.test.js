const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("runtime/PerfSpanHelper.js", function () {
  function loadPerfRuntime(extra) {
    const context = createScriptContext(Object.assign({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    }, extra || {}));

    runIifeScript("runtime/namespace.js", context);
    runIifeScript("runtime/PerfSpanHelper.js", context);
    return context;
  }

  it("is a no-op when perf hooks are absent", function () {
    const context = loadPerfRuntime();
    const span = context.DyniPlugin.runtime.perf.startSpan("test");

    expect(span).toBeNull();
    expect(() => context.DyniPlugin.runtime.perf.endSpan(span)).not.toThrow();
  });

  it("starts and ends spans when hooks are present", function () {
    const startSpan = vi.fn(() => ({ id: 123 }));
    const endSpan = vi.fn();
    const context = loadPerfRuntime({
      __DYNI_PERF_HOOKS__: {
        startSpan,
        endSpan
      }
    });

    const span = context.DyniPlugin.runtime.perf.startSpan("name", { a: 1 });
    context.DyniPlugin.runtime.perf.endSpan(span, { b: 2 });

    expect(startSpan).toHaveBeenCalledWith("name", { a: 1 });
    expect(endSpan).toHaveBeenCalledWith({ id: 123 }, { b: 2 });
  });

  it("keeps endSpan safe for hooks without endSpan", function () {
    const startSpan = vi.fn(() => ({ id: 1 }));
    const context = loadPerfRuntime({
      __DYNI_PERF_HOOKS__: {
        startSpan
      }
    });

    const span = context.DyniPlugin.runtime.perf.startSpan("name");
    expect(() => context.DyniPlugin.runtime.perf.endSpan(span)).not.toThrow();
  });
});
