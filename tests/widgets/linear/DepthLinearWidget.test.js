const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("DepthLinearWidget", function () {
  function toOptionalFiniteNumber(value) {
    if (value == null) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  it("passes LinearGaugeEngine config with range axis and low-end sectors", function () {
    let captured;
    const requestedModules = [];
    const resolveStandardTickSteps = vi.fn((range) => {
      if (range <= 6) return { major: 1, minor: 0.5 };
      if (range <= 30) return { major: 5, minor: 1 };
      return { major: 50, minor: 10 };
    });
    const unitFormatter = {
      formatWithToken: vi.fn(function (value, formatter, token, defaultText) {
        return String(value);
      }),
      extractNumericDisplay: vi.fn(function (text, fallback) {
        const parsed = Number(text);
        return Number.isFinite(parsed) ? parsed : fallback;
      })
    };
    const renderCanvas = vi.fn();

    const mod = loadFresh("widgets/linear/DepthLinearWidget/DepthLinearWidget.js");
    const componentContext = createComponentContextMock({
      modules: {
        LinearGaugeEngine: {
          create() {
            requestedModules.push("LinearGaugeEngine");
            return {
              createRenderer(cfg) {
                captured = cfg;
                return renderCanvas;
              }
            };
          }
        },
        ValueMath: {
          create() {
            requestedModules.push("ValueMath");
            return {
              toOptionalFiniteNumber,
              clamp(v, lo, hi) {
                return Math.max(lo, Math.min(hi, Number(v)));
              },
              resolveStandardTickSteps
            };
          }
        },
        DepthDisplayFormatter: {
          create() {
            requestedModules.push("DepthDisplayFormatter");
            return loadFresh("shared/widget-kits/format/DepthDisplayFormatter.js").create({}, componentContext);
          }
        },
        PlaceholderNormalize: {
          create() {
            requestedModules.push("PlaceholderNormalize");
            return {
              normalize(text, defaultText) {
                if (text == null) {
                  return defaultText == null ? "---" : defaultText;
                }
                const value = String(text).trim();
                return value === "NO DATA" || /^-+$/.test(value) ? (defaultText == null ? "---" : defaultText) : String(text);
              }
            };
          }
        },
        UnitAwareFormatter: {
          create() {
            requestedModules.push("UnitAwareFormatter");
            return unitFormatter;
          }
        }
      }
    });
    const spec = mod.create({}, componentContext);

    expect(spec.renderCanvas).toBe(renderCanvas);
    expect(captured.axisMode).toBe("range");
    expect(captured.unitDefault).toBe("m");
    expect(captured.hideTextualMetricsProp).toBe("depthLinearHideTextualMetrics");
    expect(captured).not.toHaveProperty("rangeDefaults");
    expect(captured.ratioProps).toEqual({
      normal: "depthLinearRatioThresholdNormal",
      flat: "depthLinearRatioThresholdFlat"
    });
    expect(captured).not.toHaveProperty("ratioDefaults");
    expect(captured.tickSteps(6)).toEqual({ major: 1, minor: 0.5 });
    expect(captured.tickSteps(30)).toEqual({ major: 5, minor: 1 });
    expect(resolveStandardTickSteps).toHaveBeenCalledTimes(2);
    expect(requestedModules).toEqual([
      "LinearGaugeEngine",
      "ValueMath",
      "DepthDisplayFormatter",
      "PlaceholderNormalize",
      "UnitAwareFormatter"
    ]);

    const formatted = captured.formatDisplay(3.24, {
      formatter: "formatDistance",
      formatterParameters: ["ft"],
      default: "---"
    });

    expect(formatted).toEqual({ num: 3.24, text: "3.24" });
    expect(unitFormatter.formatWithToken).toHaveBeenCalledWith(3.24, "formatDistance", "ft", "---");
    expect(unitFormatter.extractNumericDisplay).toHaveBeenCalledWith("3.24", NaN);

    const theme = { colors: { warning: "#123456", alarm: "#654321" } };
    const sectors = captured.buildSectors({
      depthLinearAlarmFrom: 2,
      depthLinearWarningFrom: 5
    }, 0, 30, { min: 0, max: 30 }, {}, theme);

    expect(sectors).toEqual([
      { from: 0, to: 2, color: "#654321" },
      { from: 2, to: 5, color: "#123456" }
    ]);
  });

  it("returns warning-only sector when alarm threshold is missing", function () {
    let captured;
    const unitFormatter = {
      formatWithToken: vi.fn(function (value, formatter, token, defaultText) {
        return String(value);
      }),
      extractNumericDisplay: vi.fn(function (text, fallback) {
        const parsed = Number(text);
        return Number.isFinite(parsed) ? parsed : fallback;
      })
    };

    const mod = loadFresh("widgets/linear/DepthLinearWidget/DepthLinearWidget.js");
    const componentContext = createComponentContextMock({
      modules: {
        LinearGaugeEngine: {
          create() {
            return {
              createRenderer(cfg) {
                captured = cfg;
                return function () {};
              }
            };
          }
        },
        ValueMath: {
          create() {
            return {
              toOptionalFiniteNumber,
              clamp(v, lo, hi) {
                return Math.max(lo, Math.min(hi, Number(v)));
              },
              resolveStandardTickSteps() {
                return { major: 5, minor: 1 };
              }
            };
          }
        },
        DepthDisplayFormatter: {
          create() {
            return loadFresh("shared/widget-kits/format/DepthDisplayFormatter.js").create({}, componentContext);
          }
        },
        PlaceholderNormalize: {
          create() {
            return {
              normalize(text, defaultText) {
                if (text == null) {
                  return defaultText == null ? "---" : defaultText;
                }
                const value = String(text).trim();
                return value === "NO DATA" || /^-+$/.test(value) ? (defaultText == null ? "---" : defaultText) : String(text);
              }
            };
          }
        },
        UnitAwareFormatter: {
          create() {
            return unitFormatter;
          }
        }
      }
    });
    mod.create({}, componentContext);

    const sectors = captured.buildSectors({ depthLinearWarningFrom: 5 }, 0, 30, { min: 0, max: 30 }, {}, {
      colors: { warning: "#123456", alarm: "#654321" }
    });

    expect(sectors).toEqual([{ from: 0, to: 5, color: "#123456" }]);
    expect(captured.formatDisplay("nope")).toEqual({ num: NaN, text: "---" });
  });

  it("returns placeholder output for null depth values", function () {
    let captured;
    const unitFormatter = {
      formatWithToken: vi.fn(function (value) {
        return String(value);
      }),
      extractNumericDisplay: vi.fn(function (text, fallback) {
        const parsed = Number(text);
        return Number.isFinite(parsed) ? parsed : fallback;
      })
    };

    const mod = loadFresh("widgets/linear/DepthLinearWidget/DepthLinearWidget.js");
    const componentContext = createComponentContextMock({
      modules: {
        LinearGaugeEngine: {
          create() {
            return {
              createRenderer(cfg) {
                captured = cfg;
                return function () {};
              }
            };
          }
        },
        ValueMath: {
          create() {
            return {
              toOptionalFiniteNumber,
              clamp(v, lo, hi) {
                return Math.max(lo, Math.min(hi, Number(v)));
              },
              resolveStandardTickSteps() {
                return { major: 5, minor: 1 };
              }
            };
          }
        },
        DepthDisplayFormatter: {
          create() {
            return loadFresh("shared/widget-kits/format/DepthDisplayFormatter.js").create({}, componentContext);
          }
        },
        PlaceholderNormalize: {
          create() {
            return {
              normalize(text, defaultText) {
                if (text == null) {
                  return defaultText == null ? "---" : defaultText;
                }
                return String(text);
              }
            };
          }
        },
        UnitAwareFormatter: {
          create() {
            return unitFormatter;
          }
        }
      }
    });
    mod.create({}, componentContext);

    expect(captured.formatDisplay(null, {})).toEqual({ num: NaN, text: "---" });
    expect(unitFormatter.formatWithToken).not.toHaveBeenCalled();
    expect(unitFormatter.extractNumericDisplay).not.toHaveBeenCalled();
  });

  it("treats blank and missing low-end thresholds as unset", function () {
    let captured;
    const unitFormatter = {
      formatWithToken: vi.fn(function (value) {
        return String(value);
      }),
      extractNumericDisplay: vi.fn(function (text, fallback) {
        const parsed = Number(text);
        return Number.isFinite(parsed) ? parsed : fallback;
      })
    };

    const mod = loadFresh("widgets/linear/DepthLinearWidget/DepthLinearWidget.js");
    const componentContext = createComponentContextMock({
      modules: {
        LinearGaugeEngine: {
          create() {
            return {
              createRenderer(cfg) {
                captured = cfg;
                return function () {};
              }
            };
          }
        },
        ValueMath: {
          create() {
            return {
              toOptionalFiniteNumber,
              clamp(v, lo, hi) {
                return Math.max(lo, Math.min(hi, Number(v)));
              },
              resolveStandardTickSteps() {
                return { major: 5, minor: 1 };
              }
            };
          }
        },
        DepthDisplayFormatter: {
          create() {
            return loadFresh("shared/widget-kits/format/DepthDisplayFormatter.js").create({}, componentContext);
          }
        },
        PlaceholderNormalize: {
          create() {
            return {
              normalize(text, defaultText) {
                if (text == null) {
                  return defaultText == null ? "---" : defaultText;
                }
                return String(text);
              }
            };
          }
        },
        UnitAwareFormatter: {
          create() {
            return unitFormatter;
          }
        }
      }
    });
    mod.create({}, componentContext);

    const theme = { colors: { warning: "#123456", alarm: "#654321" } };
    const axis = { min: 0, max: 30 };

    [null, undefined, "", "   "].forEach(function (rawThreshold) {
      expect(captured.buildSectors({
        depthLinearWarningFrom: rawThreshold,
        depthLinearAlarmFrom: rawThreshold
      }, 0, 30, axis, {}, theme)).toEqual([]);
    });

    expect(captured.buildSectors({
      depthLinearWarningFrom: 5,
      depthLinearAlarmFrom: 2
    }, 0, 30, axis, {}, theme)).toEqual([
      { from: 0, to: 2, color: "#654321" },
      { from: 2, to: 5, color: "#123456" }
    ]);
  });
});
