const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { createMockCanvas, createMockContext2D } = require("../helpers/mock-canvas");

describe("runtime/helpers.js", function () {
  function createElementNode(classNames, parentNode) {
    const classes = Array.isArray(classNames) ? classNames.slice() : [];
    const classSet = new Set(classes);
    const node = {
      nodeType: 1,
      parentNode: parentNode || null,
      classList: {
        contains(name) {
          return classSet.has(name);
        }
      },
      closest(selector) {
        let cursor = node;
        while (cursor) {
          if (cursor.nodeType === 1) {
            if (selector === ".widget.dyniplugin" &&
              cursor.classList.contains("widget") &&
              cursor.classList.contains("dyniplugin")) {
              return cursor;
            }
            if (selector === ".nightMode" && cursor.classList.contains("nightMode")) {
              return cursor;
            }
          }
          if (cursor.parentNode) {
            cursor = cursor.parentNode;
            continue;
          }
          if (cursor.nodeType === 11 && cursor.host) {
            cursor = cursor.host;
            continue;
          }
          cursor = null;
        }
        return null;
      }
    };
    return node;
  }

  function createShadowRootNode(host) {
    return {
      nodeType: 11,
      host: host || null,
      parentNode: null
    };
  }

  function loadRuntimeHelpers(extra) {
    const context = createScriptContext(Object.assign({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      },
      avnav: {
        api: {
          formatter: {
            formatSpeed(value, unit) {
              return `spd:${value}:${unit}`;
            }
          }
        }
      },
      getComputedStyle() {
        return {
          color: "rgb(1, 2, 3)",
          getPropertyValue() {
            return "";
          }
        };
      },
      devicePixelRatio: 2
    }, extra || {}));

    runIifeScript("runtime/helpers.js", context);
    return context.DyniPlugin.runtime;
  }

  function createSizedCanvas(options) {
    const opts = options || {};
    const ctx = opts.ctx || createMockContext2D();
    const calls = { rect: 0 };
    const rect = {
      width: Number.isFinite(opts.rectWidth) ? opts.rectWidth : 320,
      height: Number.isFinite(opts.rectHeight) ? opts.rectHeight : 180
    };
    const canvas = {
      width: 0,
      height: 0,
      clientWidth: Number.isFinite(opts.clientWidth) ? opts.clientWidth : rect.width,
      clientHeight: Number.isFinite(opts.clientHeight) ? opts.clientHeight : rect.height,
      getContext(type) {
        return type === "2d" ? ctx : null;
      },
      getBoundingClientRect() {
        calls.rect += 1;
        return {
          width: rect.width,
          height: rect.height,
          top: 0,
          left: 0,
          right: rect.width,
          bottom: rect.height
        };
      }
    };

    return { canvas, ctx, rect, calls };
  }

  it("applyFormatter handles function, formatter-name and fallback", function () {
    const runtime = loadRuntimeHelpers();

    expect(runtime.applyFormatter(5, {
      formatter(value, suffix) {
        return String(value) + suffix;
      },
      formatterParameters: ["kn"]
    })).toBe("5kn");

    expect(runtime.applyFormatter(6, {
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    })).toBe("spd:6:kn");

    expect(runtime.applyFormatter(null, { default: "---" })).toBe("---");
    expect(runtime.applyFormatter(null, { default: "" })).toBe("");
    expect(runtime.applyFormatter(null, { default: 0 })).toBe(0);
    expect(runtime.applyFormatter(null, { default: false })).toBe(false);
    expect(runtime.applyFormatter(7, {})).toBe("7");
  });

  it("returns the configured default before calling formatters for nullish or NaN raw values", function () {
    const fnFormatter = vi.fn(function () {
      return "-";
    });
    const namedFormatter = vi.fn(function () {
      return "-";
    });
    const runtime = loadRuntimeHelpers({
      avnav: {
        api: {
          formatter: {
            formatSpeed: namedFormatter
          }
        }
      }
    });

    expect(runtime.applyFormatter(null, {
      default: "---",
      formatter: fnFormatter
    })).toBe("---");
    expect(runtime.applyFormatter(NaN, {
      default: "---",
      formatter: "formatSpeed"
    })).toBe("---");
    expect(fnFormatter).not.toHaveBeenCalled();
    expect(namedFormatter).not.toHaveBeenCalled();
  });

  it("falls back to default string when formatter throws", function () {
    const runtime = loadRuntimeHelpers();
    const out = runtime.applyFormatter(5, {
      default: "NA",
      formatter() {
        throw new Error("boom");
      }
    });

    expect(out).toBe("5");
  });

  it("setupCanvas applies dpr transform and returns CSS pixel dimensions", function () {
    const runtime = loadRuntimeHelpers();
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 300, rectHeight: 120, ctx });

    const out = runtime.setupCanvas(canvas);

    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(240);
    expect(out.W).toBe(300);
    expect(out.H).toBe(120);
    expect(ctx.calls.some((c) => c.name === "setTransform")).toBe(true);
  });

  it("setupCanvas caches rect-derived layout when client size is unchanged", function () {
    const runtime = loadRuntimeHelpers();
    const sized = createSizedCanvas({ clientWidth: 300, clientHeight: 120, rectWidth: 300, rectHeight: 120 });

    const first = runtime.setupCanvas(sized.canvas);
    const second = runtime.setupCanvas(sized.canvas);

    expect(sized.calls.rect).toBe(1);
    expect(first.W).toBe(300);
    expect(first.H).toBe(120);
    expect(second.W).toBe(300);
    expect(second.H).toBe(120);
    expect(sized.canvas.width).toBe(600);
    expect(sized.canvas.height).toBe(240);
    expect(sized.ctx.calls.filter((c) => c.name === "setTransform")).toHaveLength(2);
  });

  it("setupCanvas refreshes cached layout when client size changes", function () {
    const runtime = loadRuntimeHelpers();
    const sized = createSizedCanvas({ clientWidth: 300, clientHeight: 120, rectWidth: 300, rectHeight: 120 });

    runtime.setupCanvas(sized.canvas);
    sized.canvas.clientWidth = 340;
    sized.canvas.clientHeight = 160;
    sized.rect.width = 340;
    sized.rect.height = 160;
    const second = runtime.setupCanvas(sized.canvas);

    expect(sized.calls.rect).toBe(2);
    expect(second.W).toBe(340);
    expect(second.H).toBe(160);
    expect(sized.canvas.width).toBe(680);
    expect(sized.canvas.height).toBe(320);
    expect(sized.ctx.calls.filter((c) => c.name === "setTransform")).toHaveLength(2);
  });

  it("requirePluginRoot resolves the committed plugin root from descendants", function () {
    const runtime = loadRuntimeHelpers();
    const rootEl = createElementNode(["widget", "dyniplugin"], null);
    const childEl = createElementNode(["dyni-child"], rootEl);

    expect(runtime.requirePluginRoot(rootEl)).toBe(rootEl);
    expect(runtime.requirePluginRoot(childEl)).toBe(rootEl);
    expect(runtime.createHelpers(function () {}).requirePluginRoot(childEl)).toBe(rootEl);
  });

  it("requirePluginRoot crosses ShadowRoot boundaries through host nodes", function () {
    const runtime = loadRuntimeHelpers();
    const rootEl = createElementNode(["widget", "dyniplugin"], null);
    const shadowHost = createElementNode(["dyni-shadow-host"], rootEl);
    const shadowRoot = createShadowRootNode(shadowHost);
    shadowHost.shadowRoot = shadowRoot;
    const nestedNode = createElementNode(["dyni-nested"], shadowRoot);

    expect(runtime.requirePluginRoot(nestedNode)).toBe(rootEl);
  });

  it("requirePluginRoot accepts event-like targets and throws when no plugin root exists", function () {
    const runtime = loadRuntimeHelpers();
    const rootEl = createElementNode(["widget", "dyniplugin"], null);
    const leaf = createElementNode(["dyni-leaf"], rootEl);
    const eventLike = {
      target: leaf,
      composedPath() {
        return [leaf, rootEl];
      }
    };
    const orphan = createElementNode(["dyni-orphan"], null);

    expect(runtime.requirePluginRoot(eventLike)).toBe(rootEl);
    expect(function () {
      runtime.requirePluginRoot(orphan);
    }).toThrow();
  });

  it("exposes getNightModeState through runtime and Helpers", function () {
    const nightContainer = createElementNode(["nightMode"], null);
    const rootEl = createElementNode(["widget", "dyniplugin"], nightContainer);
    const runtime = loadRuntimeHelpers();

    expect(runtime.getNightModeState(rootEl)).toBe(true);
    expect(runtime.createHelpers(function () {}).getNightModeState(rootEl)).toBe(true);
  });

  it("exposes the singleton hostActions facade through runtime and Helpers", function () {
    const hostActions = { routePoints: {}, routeEditor: {}, ais: {}, getCapabilities: vi.fn() };
    const runtime = loadRuntimeHelpers({
      DyniPlugin: {
        runtime: {},
        state: {
          hostActionBridge: {
            getHostActions: vi.fn(() => hostActions)
          }
        },
        config: { shared: {}, clusters: [] }
      }
    });

    expect(runtime.getHostActions()).toBe(hostActions);
    expect(runtime.createHelpers(function () {}).getHostActions()).toBe(hostActions);
  });

  it("fails fast when hostActions are requested before bridge initialization", function () {
    const runtime = loadRuntimeHelpers();

    expect(function () {
      runtime.getHostActions();
    }).toThrow();
  });
});
