const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/format-runtime.js boundary guards", function () {
  function loadRuntimeFormat(extra) {
    const context = createScriptContext(Object.assign({
      DyniPlugin: {
        avnavApi: {
          formatter: {
            formatDecimal(value, precision, decimals, trim) {
              return `dec:${value}:${precision}:${decimals}:${trim}`;
            },
            formatPressure(value, unit) {
              return Number(value) / 100 + " " + String(unit || "");
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
            formatDecimal(value, precision, decimals, trim) {
              return `dec:${value}:${precision}:${decimals}:${trim}`;
            },
            formatPressure(value, unit) {
              return Number(value) / 100 + " " + String(unit || "");
            }
          }
        }
      }
    }, extra || {}));

    runIifeScript("runtime/namespace.js", context);
    runIifeScript("runtime/format-runtime.js", context);
    return context.DyniPlugin.runtime;
  }

  it("returns default text for empty and whitespace-only formatter inputs", function () {
    const runtime = loadRuntimeFormat();

    expect(runtime.format.applyFormatter("", { formatter: "formatDecimal", default: "---" })).toBe("---");
    expect(runtime.format.applyFormatter("  ", { formatter: "formatDecimal", default: "---" })).toBe("---");
    expect(runtime.format.applyFormatter("", { formatter: "formatPressure", formatterParameters: ["hpa"], default: "---" })).toBe("---");
  });

  it("keeps regression behavior for null, undefined, and NaN inputs", function () {
    const runtime = loadRuntimeFormat();

    expect(runtime.format.applyFormatter(null, { formatter: "formatDecimal", default: "---" })).toBe("---");
    expect(runtime.format.applyFormatter(undefined, { formatter: "formatDecimal", default: "---" })).toBe("---");
    expect(runtime.format.applyFormatter(NaN, { formatter: "formatDecimal", default: "---" })).toBe("---");
  });

  it("passes through valid zero and numeric-string values to formatters", function () {
    const runtime = loadRuntimeFormat();

    expect(runtime.format.applyFormatter(0, {
      formatter: "formatDecimal",
      formatterParameters: [3, 1, true],
      default: "---"
    })).toBe("dec:0:3:1:true");

    expect(runtime.format.applyFormatter("42.5", {
      formatter: "formatDecimal",
      formatterParameters: [3, 1, true],
      default: "---"
    })).toBe("dec:42.5:3:1:true");
  });
});
