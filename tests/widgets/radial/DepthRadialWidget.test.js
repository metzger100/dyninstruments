const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("DepthRadialWidget", function () {
  it("builds low-end sectors with alarm and warning order", function () {
    let captured;
    let receivedOptions;
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

    const mod = loadFresh("widgets/radial/DepthRadialWidget/DepthRadialWidget.js");
    const componentContext = createComponentContextMock({
      modules: {
        SemicircleRadialEngine: { create() { requestedModules.push("SemicircleRadialEngine"); return { createRenderer(cfg) { captured = cfg; return renderCanvas; } }; } },
        RadialValueMath: { create() { requestedModules.push("RadialValueMath"); return { buildLowEndSectors(props, minV, maxV, arc, options) { receivedOptions = options; return [{ a0: 0, a1: 2, color: options.alarmColor }, { a0: 2, a1: 5, color: options.warningColor }]; }, resolveStandardSemicircleTickSteps }; } },
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
    expect(resolveStandardSemicircleTickSteps).toHaveBeenCalledTimes(2);
    expect(requestedModules).toEqual([
      "SemicircleRadialEngine",
      "RadialValueMath",
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
    const sectors = captured.buildSectors({ alarmFrom: 2, warningFrom: 5 }, 0, 30, {}, {}, theme);

    expect(sectors).toEqual([
      { a0: 0, a1: 2, color: "#654321" },
      { a0: 2, a1: 5, color: "#123456" }
    ]);
    expect(receivedOptions.warningColor).toBe(theme.colors.warning);
    expect(receivedOptions.alarmColor).toBe(theme.colors.alarm);
  });
});
