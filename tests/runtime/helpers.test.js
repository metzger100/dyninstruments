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

  it("resolveTextColor and resolveFontFamily use CSS vars before fallback", function () {
    const night = { value: false };
    const canvas = { ownerDocument: createDoc(night) };

    const runtime = loadRuntimeHelpers({
      getComputedStyle() {
        return {
          color: "rgb(1, 2, 3)",
          getPropertyValue(name) {
            if (name === "--dyni-fg") return " #abcdef ";
            if (name === "--dyni-font") return " \"Fira Sans\" ";
            return "";
          }
        };
      }
    });

    expect(runtime.resolveTextColor(canvas)).toBe("#abcdef");
    expect(runtime.resolveFontFamily(canvas)).toBe("\"Fira Sans\"");
  });

  it("caches typography per canvas while night mode state is unchanged", function () {
    const calls = { value: 0 };
    const night = { value: false };
    const canvas = { ownerDocument: createDoc(night) };

    const runtime = loadRuntimeHelpers({
      getComputedStyle() {
        calls.value += 1;
        return {
          color: "rgb(1, 2, 3)",
          getPropertyValue(name) {
            if (name === "--dyni-fg") return " #abcdef ";
            if (name === "--dyni-font") return " \"Fira Sans\" ";
            return "";
          }
        };
      }
    });

    expect(runtime.resolveTextColor(canvas)).toBe("#abcdef");
    expect(runtime.resolveFontFamily(canvas)).toBe("\"Fira Sans\"");
    expect(runtime.resolveTextColor(canvas)).toBe("#abcdef");
    expect(runtime.resolveFontFamily(canvas)).toBe("\"Fira Sans\"");
    expect(calls.value).toBe(1);
  });

  it("refreshes cached typography when night mode class state changes", function () {
    const calls = { value: 0 };
    const night = { value: false };
    const canvas = { ownerDocument: createDoc(night) };

    const runtime = loadRuntimeHelpers({
      getComputedStyle() {
        calls.value += 1;
        return {
          color: night.value ? "rgb(200, 200, 200)" : "rgb(10, 20, 30)",
          getPropertyValue(name) {
            if (name === "--dyni-fg") return night.value ? " #222222 " : " #111111 ";
            if (name === "--dyni-font") return night.value ? " \"Night Font\" " : " \"Day Font\" ";
            return "";
          }
        };
      }
    });

    expect(runtime.resolveTextColor(canvas)).toBe("#111111");
    expect(runtime.resolveFontFamily(canvas)).toBe("\"Day Font\"");
    expect(calls.value).toBe(1);

    night.value = true;
    expect(runtime.resolveTextColor(canvas)).toBe("#222222");
    expect(runtime.resolveFontFamily(canvas)).toBe("\"Night Font\"");
    expect(calls.value).toBe(2);
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
});
