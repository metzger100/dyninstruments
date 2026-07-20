const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("DefaultRadialWidget", function () {
  /** @param {any} [options] */
  function createHarness(options) {
    const opts = options || {};
    /** @type {any} */
    let captured;
    const renderer = vi.fn();
    const applyFormatter =
      opts.applyFormatter ||
      vi.fn((value, spec) => {
        if (String(value) === "bad") {
          return "NO DATA";
        }
        return spec && typeof spec.formatter !== "undefined" ? String(value) + " fmt" : String(value);
      });
    const resolveStandardTickSteps = opts.resolveStandardTickSteps || vi.fn(() => ({ major: 10, minor: 2 }));
    const placeholderNormalize = opts.placeholderNormalize || {
      /** @param {any} text @param {any} defaultText */
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
      /** @param {any} value */
      toOptionalFiniteNumber(value) {
        if (value == null) return undefined;
        if (typeof value === "string" && value.trim() === "") return undefined;
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
      },
      extractNumberText: vi.fn(function (text) {
        const match = String(text).match(new RegExp("-?\\d+(?:\\.\\d+)?"));
        return match ? match[0] : "";
      }),
      formatGaugeDisplay: vi.fn(function (raw, props) {
        if (String(raw) === "bad") {
          return {
            num: NaN,
            text: props && props.default ? props.default : "---"
          };
        }
        return { num: Number(raw), text: String(raw) };
      }),
      resolveStandardTickSteps
    };
    const engine = {
      /** @param {any} cfg */
      createRenderer(cfg) {
        captured = cfg;
        return renderer;
      }
    };
    const mod = loadFresh("widgets/radial/DefaultRadialWidget/DefaultRadialWidget.js");
    const spec = mod.create(
      {},
      createComponentContextMock({
        modules: {
          SemicircleRadialEngine: { create: () => engine },
          ValueMath: { create: () => valueMath },
          PlaceholderNormalize: { create: () => placeholderNormalize },
          DefaultGaugeDisplay: {
            create() {
              throw new Error("DefaultGaugeDisplay must not be requested");
            }
          }
        },
        services: {
          format: { applyFormatter }
        }
      })
    );
    return {
      spec,
      captured,
      renderer,
      applyFormatter,
      resolveStandardTickSteps,
      valueMath,
      placeholderNormalize
    };
  }

  it("wires the semicircle engine with default instrument props and always uses applyFormatter", function () {
    const h = createHarness();

    expect(h.spec.id).toBe("DefaultRadialWidget");
    expect(h.spec.wantsHideNativeHead).toBe(true);
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
    expect(h.captured.hideTextualMetricsProp).toBe("defaultRadialHideTextualMetrics");
    expect(h.captured.tickSteps).toBe(h.resolveStandardTickSteps);
    expect(h.captured.tickSteps(10)).toEqual({ major: 10, minor: 2 });
    expect(h.resolveStandardTickSteps).toHaveBeenCalledWith(10);

    expect(
      h.captured.formatDisplay(
        12.5,
        {
          default: "---"
        },
        ""
      )
    ).toEqual({ num: 12.5, text: "12.5" });
    expect(h.valueMath.formatGaugeDisplay).toHaveBeenCalledWith(
      12.5,
      {
        default: "---"
      },
      h.applyFormatter,
      h.placeholderNormalize.normalize,
      "formatDecimal",
      [3, 1, true]
    );

    expect(
      h.captured.formatDisplay(
        12.5,
        {
          formatter: "formatDecimal",
          formatterParameters: ["m"],
          default: "---"
        },
        ""
      )
    ).toEqual({ num: 12.5, text: "12.5" });
    expect(h.valueMath.formatGaugeDisplay).toHaveBeenCalledWith(
      12.5,
      {
        formatter: "formatDecimal",
        formatterParameters: ["m"],
        default: "---"
      },
      h.applyFormatter,
      h.placeholderNormalize.normalize,
      "formatDecimal",
      [3, 1, true]
    );

    expect(
      h.captured.formatDisplay(
        "bad",
        {
          default: "ALT"
        },
        ""
      )
    ).toEqual({ num: NaN, text: "ALT" });
    expect(h.valueMath.formatGaugeDisplay).toHaveBeenCalledWith(
      "bad",
      {
        default: "ALT"
      },
      h.applyFormatter,
      h.placeholderNormalize.normalize,
      "formatDecimal",
      [3, 1, true]
    );

    expect(h.captured.formatDisplay("bad", {}, "")).toEqual({
      num: NaN,
      text: "---"
    });
    expect(h.valueMath.formatGaugeDisplay).toHaveBeenCalledWith(
      "bad",
      {},
      h.applyFormatter,
      h.placeholderNormalize.normalize,
      "formatDecimal",
      [3, 1, true]
    );
  });

  it("builds deterministic sectors, falls back to theme colors, and omits degenerate spans", function () {
    const h = createHarness();
    const valueUtils = {
      /** @param {any} from @param {any} to */
      sectorAngles(from, to) {
        const f = Number(from);
        const t = Number(to);
        return Number.isFinite(f) && Number.isFinite(t) && t > f ? { a0: f, a1: t } : null;
      }
    };
    const theme = {
      colors: {
        warning: "#e0a92e",
        alarm: "#d9534a"
      }
    };

    expect(
      h.captured.buildSectors(
        {
          defaultRadialAlarmLowEnabled: false,
          defaultRadialWarningLowEnabled: false,
          defaultRadialWarningHighEnabled: false,
          defaultRadialAlarmHighEnabled: false
        },
        0,
        100,
        {},
        valueUtils,
        theme
      )
    ).toEqual([]);

    const sectors = h.captured.buildSectors(
      {
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
      },
      0,
      100,
      {},
      valueUtils,
      theme
    );

    expect(sectors).toEqual([
      { a0: 0, a1: 10, color: "#aa0000" },
      { a0: 10, a1: 25, color: "#bb0000" },
      { a0: 75, a1: 90, color: "#00bb00" },
      { a0: 90, a1: 100, color: "#0000bb" }
    ]);

    const fallbackSectors = h.captured.buildSectors(
      {
        defaultRadialAlarmLowEnabled: true,
        defaultRadialAlarmLowAt: 10,
        defaultRadialWarningLowEnabled: true,
        defaultRadialWarningLowAt: 10,
        defaultRadialWarningHighEnabled: true,
        defaultRadialWarningHighAt: 75,
        defaultRadialAlarmHighEnabled: true,
        defaultRadialAlarmHighAt: 90
      },
      0,
      100,
      {},
      valueUtils,
      theme
    );

    expect(fallbackSectors).toEqual([
      { a0: 0, a1: 10, color: "#d9534a" },
      { a0: 75, a1: 90, color: "#e0a92e" },
      { a0: 90, a1: 100, color: "#d9534a" }
    ]);
  });

  it("treats blank and missing thresholds as unset instead of creating zero sectors", function () {
    const h = createHarness();
    const valueUtils = {
      /** @param {any} from @param {any} to */
      sectorAngles(from, to) {
        const f = Number(from);
        const t = Number(to);
        return Number.isFinite(f) && Number.isFinite(t) && t > f ? { a0: f, a1: t } : null;
      }
    };
    const theme = {
      colors: {
        warning: "#e0a92e",
        alarm: "#d9534a"
      }
    };
    const missingValues = [null, undefined, "", "   "];

    missingValues.forEach(function (rawThreshold) {
      expect(
        h.captured.buildSectors(
          {
            defaultRadialWarningHighEnabled: true,
            defaultRadialWarningHighAt: rawThreshold
          },
          0,
          100,
          {},
          valueUtils,
          theme
        )
      ).toEqual([]);
    });

    expect(
      h.captured.buildSectors(
        {
          defaultRadialWarningHighEnabled: true,
          defaultRadialWarningHighAt: 75
        },
        0,
        100,
        {},
        valueUtils,
        theme
      )
    ).toEqual([{ a0: 75, a1: 100, color: "#e0a92e" }]);
  });
});
