const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { createMockCanvas, createMockContext2D } = require("../helpers/mock-canvas");

describe("runtime/helpers.js", function () {
  const DEFAULT_FONT_STACK = '"Inter","SF Pro Text",-apple-system,"Segoe UI",Roboto,"Helvetica Neue","Noto Sans",Ubuntu,Cantarell,"Liberation Sans",Arial,system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"';

  function createDoc(nightRef) {
    return {
      documentElement: {
        classList: {
          contains(name) {
            return name === "nightMode" && !!nightRef.value;
          }
        }
      },
      body: {
        classList: {
          contains() {
            return false;
          }
        }
      }
    };
  }

  function createRoot(doc) {
    const attrs = Object.create(null);
    const root = {
      ownerDocument: doc,
      parentElement: null,
      getAttribute(name) {
        return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
      },
      setAttribute(name, value) {
        attrs[String(name)] = String(value);
      },
      removeAttribute(name) {
        delete attrs[String(name)];
      },
      closest(selector) {
        return selector === ".widget, .DirectWidget" ? root : null;
      }
    };
    return root;
  }

  function createCanvas(doc, rootEl) {
    return {
      ownerDocument: doc,
      parentElement: rootEl || null,
      closest(selector) {
        return selector === ".widget, .DirectWidget" ? rootEl || null : null;
      }
    };
  }

  function createComputedStyle(styleByEl, calls) {
    return function (el) {
      if (calls) {
        calls.push(el);
      }
      const values = typeof styleByEl === "function"
        ? styleByEl(el)
        : (styleByEl && styleByEl.has(el) ? styleByEl.get(el) : {});
      return {
        color: Object.prototype.hasOwnProperty.call(values, "color") ? values.color : "rgb(1, 2, 3)",
        getPropertyValue(name) {
          return Object.prototype.hasOwnProperty.call(values, name) ? values[name] : "";
        }
      };
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

  it("resolveTextColor and resolveFontFamily read from a root element directly", function () {
    const night = { value: false };
    const doc = createDoc(night);
    const rootEl = createRoot(doc);
    const calls = [];

    const runtime = loadRuntimeHelpers({
      getComputedStyle: createComputedStyle(new Map([
        [rootEl, {
          "--dyni-fg": " #abcdef ",
          "--dyni-font": " \"Fira Sans\" "
        }]
      ]), calls)
    });

    expect(runtime.resolveTextColor(rootEl)).toBe("#abcdef");
    expect(runtime.resolveFontFamily(rootEl)).toBe("\"Fira Sans\"");
    expect(calls).toEqual([rootEl]);
  });

  it("adapts canvas inputs through the owning root", function () {
    const night = { value: false };
    const doc = createDoc(night);
    const rootEl = createRoot(doc);
    const canvas = createCanvas(doc, rootEl);
    const calls = [];

    const runtime = loadRuntimeHelpers({
      getComputedStyle: createComputedStyle(new Map([
        [rootEl, {
          "--dyni-fg": " #abcdef ",
          "--dyni-font": " \"Fira Sans\" "
        }],
        [canvas, {
          "--dyni-fg": " #ff00ff ",
          "--dyni-font": " \"Wrong Font\" "
        }]
      ]), calls)
    });

    expect(runtime.resolveTextColor(canvas)).toBe("#abcdef");
    expect(runtime.resolveFontFamily(canvas)).toBe("\"Fira Sans\"");
    expect(calls).toEqual([rootEl]);
  });

  it("shares one root-owned typography cache across root and canvas calls and refreshes on night mode changes", function () {
    const calls = [];
    const night = { value: false };
    const doc = createDoc(night);
    const rootEl = createRoot(doc);
    const canvas = createCanvas(doc, rootEl);

    const runtime = loadRuntimeHelpers({
      getComputedStyle: createComputedStyle(function (el) {
        if (el === rootEl) {
          return {
            color: night.value ? "rgb(200, 200, 200)" : "rgb(10, 20, 30)",
            "--dyni-fg": night.value ? " #222222 " : " #111111 ",
            "--dyni-font": night.value ? " \"Night Font\" " : " \"Day Font\" "
          };
        }
        return {
          color: "rgb(9, 9, 9)",
          "--dyni-fg": " #999999 ",
          "--dyni-font": " \"Canvas Font\" "
        };
      }, calls)
    });

    expect(runtime.resolveTextColor(rootEl)).toBe("#111111");
    expect(runtime.resolveFontFamily(canvas)).toBe("\"Day Font\"");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toBe(rootEl);

    night.value = true;
    expect(runtime.resolveTextColor(canvas)).toBe("#222222");
    expect(runtime.resolveFontFamily(rootEl)).toBe("\"Night Font\"");
    expect(calls).toHaveLength(2);
    expect(calls[1]).toBe(rootEl);
  });

  it("keeps documented fallback return values when vars are unset", function () {
    const night = { value: false };
    const canvas = { ownerDocument: createDoc(night) };

    const runtime = loadRuntimeHelpers({
      getComputedStyle() {
        return {
          color: "rgb(1, 2, 3)",
          getPropertyValue() {
            return "";
          }
        };
      }
    });

    expect(runtime.resolveTextColor(canvas)).toBe("rgb(1, 2, 3)");
    expect(runtime.resolveFontFamily(canvas)).toBe(DEFAULT_FONT_STACK);
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
