const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("DepthRadialWidget", function () {
  it("builds low-end sectors with alarm and warning order", function () {
    let captured;
    let receivedProps;
    let receivedOptions;
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

    const mod = loadFresh("widgets/radial/DepthRadialWidget/DepthRadialWidget.js");
    const componentContext = createComponentContextMock({
      modules: {
        SemicircleRadialEngine: { create() { requestedModules.push("SemicircleRadialEngine"); return { createRenderer(cfg) { captured = cfg; return renderCanvas; } }; } },
        ValueMath: { create() { requestedModules.push("ValueMath"); return { resolveStandardTickSteps }; } },
        DepthDisplayFormatter: { create() { requestedModules.push("DepthDisplayFormatter"); return loadFresh("shared/widget-kits/format/DepthDisplayFormatter.js").create({}, componentContext); } },
        PlaceholderNormalize: { create() { requestedModules.push("PlaceholderNormalize"); return { normalize(text, defaultText) { if (text == null) return defaultText == null ? "---" : defaultText; const value = String(text).trim(); return value === "NO DATA" || /^-+$/.test(value) ? (defaultText == null ? "---" : defaultText) : String(text); } }; } },
        UnitAwareFormatter: { create() { requestedModules.push("UnitAwareFormatter"); return unitFormatter; } }
      }
    });
    const spec = mod.create({}, componentContext);

    expect(spec.renderCanvas).toBe(renderCanvas);
    expect(captured).not.toHaveProperty("rangeDefaults");
    expect(captured.ratioProps).toEqual({
      normal: "depthRadialRatioThresholdNormal",
      flat: "depthRadialRatioThresholdFlat"
    });
    expect(captured.hideTextualMetricsProp).toBe("depthRadialHideTextualMetrics");
    expect(captured).not.toHaveProperty("ratioDefaults");
    expect(captured.tickSteps(6)).toEqual({ major: 1, minor: 0.5 });
    expect(captured.tickSteps(30)).toEqual({ major: 5, minor: 1 });
    expect(resolveStandardTickSteps).toHaveBeenCalledTimes(2);
    expect(requestedModules).toEqual([
      "SemicircleRadialEngine",
      "ValueMath",
      "DepthDisplayFormatter",
      "PlaceholderNormalize",
      "UnitAwareFormatter"
    ]);

    const display = captured.formatDisplay(3.24, {
      formatter: "formatDistance",
      formatterParameters: ["ft"],
      default: "---"
    });

    expect(display).toEqual({ num: 3.24, text: "3.24" });
    expect(unitFormatter.formatWithToken).toHaveBeenCalledWith(3.24, "formatDistance", "ft", "---");
    expect(unitFormatter.extractNumericDisplay).toHaveBeenCalledWith("3.24", NaN);

    const theme = {
      colors: {
        warning: "#123456",
        alarm: "#654321"
      }
    };
    const sectors = captured.buildSectors({ depthRadialAlarmFrom: 2, depthRadialWarningFrom: 5 }, 0, 30, {}, {
      buildLowEndSectors(props, minV, maxV, arc, options) {
        receivedProps = props;
        receivedOptions = options;
        return [{ a0: 0, a1: 2, color: options.alarmColor }, { a0: 2, a1: 5, color: options.warningColor }];
      }
    }, theme);

    expect(sectors).toEqual([
      { a0: 0, a1: 2, color: "#654321" },
      { a0: 2, a1: 5, color: "#123456" }
    ]);
    expect(receivedProps).toEqual({ warningFrom: 5, alarmFrom: 2 });
    expect(receivedOptions.warningColor).toBe(theme.colors.warning);
    expect(receivedOptions.alarmColor).toBe(theme.colors.alarm);
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

    const mod = loadFresh("widgets/radial/DepthRadialWidget/DepthRadialWidget.js");
    const componentContext = createComponentContextMock({
      modules: {
        SemicircleRadialEngine: {
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
});
