const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("DepthLinearWidget", function () {
  it("passes LinearGaugeEngine config with range axis and low-end sectors", function () {
    let captured;
    const requestedModules = [];
    const resolveStandardSemicircleTickSteps = vi.fn((range) => {
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
        RadialValueMath: {
          create() {
            requestedModules.push("RadialValueMath");
            return {
              clamp(v, lo, hi) {
                return Math.max(lo, Math.min(hi, Number(v)));
              },
              angleToValue(angleDeg) {
                return Number(angleDeg);
              },
              buildLowEndSectors(props, minV, maxV, arc, options) {
                return [
                  { a0: minV, a1: 2, color: options.alarmColor },
                  { a0: 2, a1: 5, color: options.warningColor }
                ];
              },
              resolveStandardSemicircleTickSteps
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
    expect(resolveStandardSemicircleTickSteps).toHaveBeenCalledTimes(2);
    expect(requestedModules).toEqual([
      "LinearGaugeEngine",
      "RadialValueMath",
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
        RadialValueMath: {
          create() {
            return {
              clamp(v, lo, hi) {
                return Math.max(lo, Math.min(hi, Number(v)));
              },
              angleToValue(angleDeg) {
                return Number(angleDeg);
              },
              buildLowEndSectors(props, minV, maxV, arc, options) {
                return [{ a0: minV, a1: 5, color: options.warningColor }];
              },
              resolveStandardSemicircleTickSteps() {
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
});
