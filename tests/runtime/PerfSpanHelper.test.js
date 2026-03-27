const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/PerfSpanHelper.js", function () {
  function loadRuntime(overrides) {
    const context = createScriptContext({
      ...(overrides || {}),
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("runtime/PerfSpanHelper.js", context);
    return context;
  }

  it("registers runtime.getPerfSpanApi", function () {
    const context = loadRuntime();
    expect(typeof context.DyniPlugin.runtime.getPerfSpanApi).toBe("function");
    const api = context.DyniPlugin.runtime.getPerfSpanApi();
    expect(typeof api.startSpan).toBe("function");
    expect(typeof api.endSpan).toBe("function");
  });

  it("returns null start spans when hooks are missing and keeps end no-op", function () {
    const context = loadRuntime();
    const api = context.DyniPlugin.runtime.getPerfSpanApi();

    const span = api.startSpan("runtime.span", { a: 1 });
    expect(span).toBe(null);
    expect(function () {
      api.endSpan(span, { status: "ok" });
    }).not.toThrow();
  });

  it("proxies start and end calls to installed perf hooks", function () {
    const events = [];
    const context = loadRuntime({
      __DYNI_PERF_HOOKS__: {
        startSpan(name, tags) {
          events.push({ type: "start", name, tags: tags || null });
          return { id: "tok" };
        },
        endSpan(token, tags) {
          events.push({ type: "end", token, tags: tags || null });
        }
      }
    });

    const api = context.DyniPlugin.runtime.getPerfSpanApi();
    const span = api.startSpan("runtime.span", { stage: "begin" });
    api.endSpan(span, { status: "done" });

    expect(events).toEqual([
      { type: "start", name: "runtime.span", tags: { stage: "begin" } },
      { type: "end", token: { id: "tok" }, tags: { status: "done" } }
    ]);
  });
});
