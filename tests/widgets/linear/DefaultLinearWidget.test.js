const { loadFresh } = require("../../helpers/load-umd");

describe("DefaultLinearWidget", function () {
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
      formatGaugeDisplay: vi.fn(function (raw, props) {
        if (String(raw) === "bad") {
          return { num: NaN, text: props && props.default ? props.default : "---" };
        }
        return { num: Number(raw), text: String(raw) };
      }),
      clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, Number(v)));
      },
      resolveStandardSemicircleTickSteps
    };
    const engine = {
      createRenderer(cfg) {
        captured = cfg;
        return renderer;
      }
    };
    const mod = loadFresh("widgets/linear/DefaultLinearWidget/DefaultLinearWidget.js");
    const spec = mod.create({}, {
      applyFormatter,
      getModule(id) {
        if (id === "LinearGaugeEngine") {
          return { create: () => engine };
        }
        if (id === "RadialValueMath") {
          return { create: () => valueMath };
        }
        if (id === "PlaceholderNormalize") {
          return { create: () => placeholderNormalize };
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
      valueMath,
      placeholderNormalize
    };
  }

  it("wires the linear engine with default instrument props and delegates formatting", function () {
    const h = createHarness();

    expect(h.spec.id).toBe("DefaultLinearWidget");
    expect(h.spec.wantsHideNativeHead).toBe(true);
    expect(h.spec.getVerticalShellSizing()).toEqual({ kind: "ratio", aspectRatio: 2 });
    expect(h.spec.renderCanvas).toBe(h.renderer);
    expect(h.captured.rawValueKey).toBe("value");
    expect(h.captured.unitDefault).toBe("");
    expect(h.captured.rangeProps).toEqual({
      min: "defaultLinearMinValue",
      max: "defaultLinearMaxValue"
    });
    expect(h.captured.tickProps).toEqual({
      major: "defaultLinearTickMajor",
      minor: "defaultLinearTickMinor",
      showEndLabels: "defaultLinearShowEndLabels"
    });
    expect(h.captured.ratioProps).toEqual({
      normal: "defaultLinearRatioThresholdNormal",
      flat: "defaultLinearRatioThresholdFlat"
    });
    expect(h.captured.tickSteps).toBe(h.resolveStandardSemicircleTickSteps);
    expect(h.captured.tickSteps(10)).toEqual({ major: 10, minor: 2 });
    expect(h.resolveStandardSemicircleTickSteps).toHaveBeenCalledWith(10);

    expect(h.captured.formatDisplay(12.5, {
      default: "---"
    })).toEqual({ num: 12.5, text: "12.5" });
    expect(h.valueMath.formatGaugeDisplay).toHaveBeenCalledWith(12.5, {
      default: "---"
    }, h.applyFormatter, h.placeholderNormalize.normalize);

    expect(h.captured.formatDisplay(12.5, {
      formatter: "formatDecimal",
      formatterParameters: ["m"],
      default: "---"
    })).toEqual({ num: 12.5, text: "12.5" });
    expect(h.valueMath.formatGaugeDisplay).toHaveBeenCalledWith(12.5, {
      formatter: "formatDecimal",
      formatterParameters: ["m"],
      default: "---"
    }, h.applyFormatter, h.placeholderNormalize.normalize);

    expect(h.captured.formatDisplay("bad", {
      default: "ALT"
    })).toEqual({ num: NaN, text: "ALT" });
    expect(h.valueMath.formatGaugeDisplay).toHaveBeenCalledWith("bad", {
      default: "ALT"
    }, h.applyFormatter, h.placeholderNormalize.normalize);
  });

  it("builds ordered sectors and omits degenerate spans", function () {
    const h = createHarness();
    const theme = {
      colors: {
        warning: "#e7c66a",
        alarm: "#ff7a76"
      }
    };

    expect(h.captured.buildSectors({
      defaultLinearAlarmLowEnabled: false,
      defaultLinearWarningLowEnabled: false,
      defaultLinearWarningHighEnabled: false,
      defaultLinearAlarmHighEnabled: false
    }, 0, 100, { min: 0, max: 100 }, h.valueMath, theme)).toEqual([]);

    const sectors = h.captured.buildSectors({
      defaultLinearAlarmLowEnabled: true,
      defaultLinearAlarmLowAt: 10,
      defaultLinearAlarmLowColor: "#aa0000",
      defaultLinearWarningLowEnabled: true,
      defaultLinearWarningLowAt: 25,
      defaultLinearWarningLowColor: "#bb0000",
      defaultLinearWarningHighEnabled: true,
      defaultLinearWarningHighAt: 75,
      defaultLinearWarningHighColor: "#00bb00",
      defaultLinearAlarmHighEnabled: true,
      defaultLinearAlarmHighAt: 90,
      defaultLinearAlarmHighColor: "#0000bb"
    }, 0, 100, { min: 0, max: 100 }, h.valueMath, theme);

    expect(sectors).toEqual([
      { from: 0, to: 10, color: "#aa0000" },
      { from: 10, to: 25, color: "#bb0000" },
      { from: 75, to: 90, color: "#00bb00" },
      { from: 90, to: 100, color: "#0000bb" }
    ]);

    const fallbackSectors = h.captured.buildSectors({
      defaultLinearAlarmLowEnabled: true,
      defaultLinearAlarmLowAt: 10,
      defaultLinearWarningLowEnabled: true,
      defaultLinearWarningLowAt: 10,
      defaultLinearWarningHighEnabled: true,
      defaultLinearWarningHighAt: 75,
      defaultLinearAlarmHighEnabled: true,
      defaultLinearAlarmHighAt: 90
    }, 0, 100, { min: 0, max: 100 }, h.valueMath, theme);

    expect(fallbackSectors).toEqual([
      { from: 0, to: 10, color: "#ff7a76" },
      { from: 75, to: 90, color: "#e7c66a" },
      { from: 90, to: 100, color: "#ff7a76" }
    ]);
  });
});
