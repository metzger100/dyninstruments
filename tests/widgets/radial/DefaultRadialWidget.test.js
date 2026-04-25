const { loadFresh } = require("../../helpers/load-umd");

describe("DefaultRadialWidget", function () {
  function createHarness(options) {
    const opts = options || {};
    let captured;
    const renderer = vi.fn();
    const applyFormatter = opts.applyFormatter || vi.fn((value, spec) => {
      if (String(value) === "bad") {
        return "NO DATA";
      }
      return spec && typeof spec.formatter !== "undefined"
        ? String(value) + " fmt"
        : String(value);
    });
    const resolveStandardSemicircleTickSteps = opts.resolveStandardSemicircleTickSteps || vi.fn(() => ({ major: 10, minor: 2 }));
    const placeholderNormalize = opts.placeholderNormalize || {
      normalize(text, defaultText) {
        if (text == null) {
          return defaultText == null ? "---" : defaultText;
        }
        const value = String(text).trim();
        if (!value || value === "NO DATA" || /^-+$/.test(value)) {
          return defaultText == null ? "---" : defaultText;
        }
        return String(text);
      }
    };
    const valueMath = opts.valueMath || {
      extractNumberText: vi.fn(function (text) {
        const match = String(text).match(/-?\d+(?:\.\d+)?/);
        return match ? match[0] : "";
      }),
      sectorAngles(from, to) {
        const f = Number(from);
        const t = Number(to);
        return isFinite(f) && isFinite(t) && t > f ? { a0: f, a1: t } : null;
      },
      resolveStandardSemicircleTickSteps
    };
    const engine = {
      createRenderer(cfg) {
        captured = cfg;
        return renderer;
      }
    };
    const mod = loadFresh("widgets/radial/DefaultRadialWidget/DefaultRadialWidget.js");
    const spec = mod.create({}, {
      applyFormatter,
      getModule(id) {
        if (id === "SemicircleRadialEngine") {
          return { create: () => engine };
        }
        if (id === "RadialValueMath") {
          return { create: () => valueMath };
        }
        if (id === "PlaceholderNormalize") {
          return { create: () => placeholderNormalize };
        }
        if (id === "DefaultGaugeDisplay") {
          throw new Error("DefaultGaugeDisplay must not be requested");
        }
        throw new Error("unexpected module: " + id);
      }
    });
    return {
      spec,
      captured,
      renderer,
      applyFormatter,
      resolveStandardSemicircleTickSteps,
      valueMath
    };
  }

  it("wires the semicircle engine with default instrument props and always uses applyFormatter", function () {
    const h = createHarness();

    expect(h.spec.id).toBe("DefaultRadialWidget");
    expect(h.spec.wantsHideNativeHead).toBe(true);
    expect(h.spec.getVerticalShellSizing()).toEqual({ kind: "ratio", aspectRatio: 1 });
    expect(h.spec.renderCanvas).toBe(h.renderer);
    expect(h.captured.rawValueKey).toBe("value");
    expect(h.captured.unitDefault).toBe("");
    expect(h.captured.rangeProps).toEqual({
      min: "defaultRadialMinValue",
      max: "defaultRadialMaxValue"
    });
    expect(h.captured.tickProps).toEqual({
      major: "defaultRadialTickMajor",
      minor: "defaultRadialTickMinor",
      showEndLabels: "defaultRadialShowEndLabels"
    });
    expect(h.captured.ratioProps).toEqual({
      normal: "defaultRadialRatioThresholdNormal",
      flat: "defaultRadialRatioThresholdFlat"
    });
    expect(h.captured.tickSteps).toBe(h.resolveStandardSemicircleTickSteps);
    expect(h.captured.tickSteps(10)).toEqual({ major: 10, minor: 2 });
    expect(h.resolveStandardSemicircleTickSteps).toHaveBeenCalledWith(10);

    expect(h.captured.formatDisplay(12.5, {
      default: "---"
    }, "")).toEqual({ num: 12.5, text: "12.5" });
    expect(h.applyFormatter).toHaveBeenCalledWith(12.5, {
      formatter: undefined,
      formatterParameters: undefined,
      default: "---"
    });

    expect(h.captured.formatDisplay(12.5, {
      formatter: "formatDecimal",
      formatterParameters: ["m"],
      default: "---"
    }, "")).toEqual({ num: 12.5, text: "12.5" });
    expect(h.applyFormatter).toHaveBeenCalledWith(12.5, {
      formatter: "formatDecimal",
      formatterParameters: ["m"],
      default: "---"
    });
    expect(h.valueMath.extractNumberText).toHaveBeenCalledWith("12.5 fmt");

    expect(h.captured.formatDisplay("bad", {
      default: "ALT"
    }, "")).toEqual({ num: NaN, text: "ALT" });
    expect(h.applyFormatter).toHaveBeenCalledWith("bad", {
      formatter: undefined,
      formatterParameters: undefined,
      default: "ALT"
    });

    expect(h.captured.formatDisplay("bad", {}, "")).toEqual({ num: NaN, text: "---" });
    expect(h.applyFormatter).toHaveBeenCalledWith("bad", {
      formatter: undefined,
      formatterParameters: undefined,
      default: "---"
    });
  });

  it("builds deterministic sectors, falls back to theme colors, and omits degenerate spans", function () {
    const h = createHarness();
    const theme = {
      colors: {
        warning: "#e7c66a",
        alarm: "#ff7a76"
      }
    };

    expect(h.captured.buildSectors({
      defaultRadialAlarmLowEnabled: false,
      defaultRadialWarningLowEnabled: false,
      defaultRadialWarningHighEnabled: false,
      defaultRadialAlarmHighEnabled: false
    }, 0, 100, {}, h.valueMath, theme)).toEqual([]);

    const sectors = h.captured.buildSectors({
      defaultRadialAlarmLowEnabled: true,
      defaultRadialAlarmLowAt: 10,
      defaultRadialAlarmLowColor: "#aa0000",
      defaultRadialWarningLowEnabled: true,
      defaultRadialWarningLowAt: 25,
      defaultRadialWarningLowColor: "#bb0000",
      defaultRadialWarningHighEnabled: true,
      defaultRadialWarningHighAt: 75,
      defaultRadialWarningHighColor: "#00bb00",
      defaultRadialAlarmHighEnabled: true,
      defaultRadialAlarmHighAt: 90,
      defaultRadialAlarmHighColor: "#0000bb"
    }, 0, 100, {}, h.valueMath, theme);

    expect(sectors).toEqual([
      { a0: 0, a1: 10, color: "#aa0000" },
      { a0: 10, a1: 25, color: "#bb0000" },
      { a0: 75, a1: 90, color: "#00bb00" },
      { a0: 90, a1: 100, color: "#0000bb" }
    ]);

    const fallbackSectors = h.captured.buildSectors({
      defaultRadialAlarmLowEnabled: true,
      defaultRadialAlarmLowAt: 10,
      defaultRadialWarningLowEnabled: true,
      defaultRadialWarningLowAt: 10,
      defaultRadialWarningHighEnabled: true,
      defaultRadialWarningHighAt: 75,
      defaultRadialAlarmHighEnabled: true,
      defaultRadialAlarmHighAt: 90
    }, 0, 100, {}, h.valueMath, theme);

    expect(fallbackSectors).toEqual([
      { a0: 0, a1: 10, color: "#ff7a76" },
      { a0: 75, a1: 90, color: "#e7c66a" },
      { a0: 90, a1: 100, color: "#ff7a76" }
    ]);
  });
});
