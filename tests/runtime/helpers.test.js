const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { createMockCanvas, createMockContext2D } = require("../helpers/mock-canvas");

describe("runtime/helpers.js", function () {
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

    expect(runtime.resolveTextColor({})).toBe("#abcdef");
    expect(runtime.resolveFontFamily({})).toBe("\"Fira Sans\"");
  });
});
