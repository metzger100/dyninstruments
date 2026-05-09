const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/format-runtime.js", function () {
  function loadRuntimeFormat(extra) {
    const context = createScriptContext(Object.assign({
      DyniPlugin: {
        avnavApi: {
          formatter: {
            formatSpeed(value, unit) {
              return `spd:${value}:${unit}`;
            }
          }
        },
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
      }
    }, extra || {}));

    runIifeScript("runtime/namespace.js", context);
    runIifeScript("runtime/format-runtime.js", context);
    return context.DyniPlugin.runtime;
  }

  it("handles function formatter, named formatter, and fallback defaults", function () {
    const runtime = loadRuntimeFormat();

    expect(runtime.format.applyFormatter(5, {
      formatter(value, suffix) {
        return String(value) + suffix;
      },
      formatterParameters: ["kn"]
    })).toBe("5kn");

    expect(runtime.format.applyFormatter(6, {
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    })).toBe("spd:6:kn");

    expect(runtime.format.applyFormatter(null, { default: "---" })).toBe("---");
    expect(runtime.format.applyFormatter(null, { default: "" })).toBe("");
    expect(runtime.format.applyFormatter(null, { default: 0 })).toBe(0);
    expect(runtime.format.applyFormatter(null, { default: false })).toBe(false);
    expect(runtime.format.applyFormatter(7, {})).toBe("7");
  });
});
