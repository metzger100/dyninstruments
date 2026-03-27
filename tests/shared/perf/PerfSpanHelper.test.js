const { loadFresh } = require("../../helpers/load-umd");

describe("PerfSpanHelper", function () {
  const previousHooks = globalThis.__DYNI_PERF_HOOKS__;

  afterEach(function () {
    globalThis.__DYNI_PERF_HOOKS__ = previousHooks;
  });

  function createHelper() {
    return loadFresh("shared/widget-kits/perf/PerfSpanHelper.js").create();
  }

  it("is a no-op when perf hooks are absent", function () {
    globalThis.__DYNI_PERF_HOOKS__ = undefined;
    const helper = createHelper();

    const span = helper.startSpan("test.span", { a: 1 });
    expect(span).toBe(null);
    expect(function () {
      helper.endSpan(span, { status: "done" });
    }).not.toThrow();
  });

  it("starts and ends spans when hooks are present", function () {
    const events = [];
    globalThis.__DYNI_PERF_HOOKS__ = {
      startSpan(name, tags) {
        events.push({ type: "start", name, tags: tags || null });
        return { id: "tok-1" };
      },
      endSpan(token, tags) {
        events.push({ type: "end", token, tags: tags || null });
      }
    };

    const helper = createHelper();
    const span = helper.startSpan("render", { cluster: "speed" });
    helper.endSpan(span, { status: "ok" });

    expect(events[0]).toEqual({ type: "start", name: "render", tags: { cluster: "speed" } });
    expect(events[1]).toEqual({ type: "end", token: { id: "tok-1" }, tags: { status: "ok" } });
  });

  it("passes tags through without rewriting", function () {
    const startTags = { a: 1, b: "x" };
    const endTags = { b: "y", c: true };
    const captured = { start: null, end: null };

    globalThis.__DYNI_PERF_HOOKS__ = {
      startSpan(name, tags) {
        captured.start = tags;
        return { id: name };
      },
      endSpan(token, tags) {
        captured.end = tags;
      }
    };

    const helper = createHelper();
    const span = helper.startSpan("tag.pass", startTags);
    helper.endSpan(span, endTags);

    expect(captured.start).toBe(startTags);
    expect(captured.end).toBe(endTags);
  });

  it("keeps endSpan safe for null spans and hooks without endSpan", function () {
    globalThis.__DYNI_PERF_HOOKS__ = {
      startSpan() {
        return { id: "token" };
      }
    };

    const helper = createHelper();
    expect(function () {
      helper.endSpan(null, { status: "noop" });
    }).not.toThrow();
    expect(function () {
      helper.endSpan({ hooks: { startSpan() {} }, token: { id: "x" } }, { status: "noop" });
    }).not.toThrow();
  });
});
