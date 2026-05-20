const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("VoltageLinearWidget", function () {
  it("passes LinearGaugeEngine config with voltage tick profile and low-end sectors", function () {
    let captured;
    const renderCanvas = vi.fn();
    const applyFormatter = vi.fn((value) => Number(value).toFixed(1));
    const resolveVoltageTickSteps = vi.fn((range) => {
      if (range <= 3) return { major: 0.5, minor: 0.1 };
      if (range <= 12) return { major: 2, minor: 0.5 };
      return { major: 50, minor: 10 };
    });

    const mod = loadFresh("widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js");
    const spec = mod.create({}, createComponentContextMock({
      modules: {
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
        ValueMath: {
          create() {
            return {
                formatGaugeDisplay(raw, props, applyFormatter, normalize, defaultFormatter, defaultParameters) {
                  const p = props || {};
                  const defaultText = Object.prototype.hasOwnProperty.call(p, "default")
                    ? p.default
                    : normalize(undefined, undefined);
                  const n = Number(raw);
                  if (!Number.isFinite(n)) {
                    return { num: NaN, text: defaultText };
                  }
                  const formatter = Object.prototype.hasOwnProperty.call(p, "formatter") ? p.formatter : defaultFormatter;
                  const formatterParameters = Object.prototype.hasOwnProperty.call(p, "formatterParameters")
                    ? p.formatterParameters
                    : defaultParameters;
                  const formatted = normalize(String(applyFormatter(n, {
                    formatter: formatter,
                    formatterParameters: formatterParameters,
                    default: defaultText
                  })), defaultText);
                  const match = String(formatted).match(/-?\d+(?:\.\d+)?/);
                  const num = match ? Number(match[0]) : NaN;
                  return Number.isFinite(num) ? { num: num, text: match[0] } : { num: NaN, text: defaultText };
                },
                extractNumberText(text) {
                  const match = String(text).match(/-?\d+(?:\.\d+)?/);
                  return match ? match[0] : "";
                },
                clamp(v, lo, hi) {
                  return Math.max(lo, Math.min(hi, Number(v)));
                },
                resolveVoltageTickSteps
              };
          }
        },
        LinearGaugeEngine: {
          create() {
            return {
              createRenderer(cfg) {
                captured = cfg;
                return renderCanvas;
              }
            };
          }
        }
      },
      services: {
        format: { applyFormatter }
      }
    }));

    expect(spec.renderCanvas).toBe(renderCanvas);
    expect(captured.hideTextualMetricsProp).toBe("voltageLinearHideTextualMetrics");
    expect(captured).not.toHaveProperty("rangeDefaults");
    expect(captured.ratioProps).toEqual({
      normal: "voltageLinearRatioThresholdNormal",
      flat: "voltageLinearRatioThresholdFlat"
    });
    expect(captured).not.toHaveProperty("ratioDefaults");
    expect(captured.tickSteps(3)).toEqual({ major: 0.5, minor: 0.1 });
    expect(captured.tickSteps(12)).toEqual({ major: 2, minor: 0.5 });
    expect(resolveVoltageTickSteps).toHaveBeenCalledTimes(2);
    expect(captured.formatDisplay(12.34, {
      formatter: "formatDecimal",
      formatterParameters: [3, 1, true]
    })).toEqual({ num: 12.3, text: "12.3" });
    expect(applyFormatter).toHaveBeenCalledWith(12.34, expect.objectContaining({
      formatter: "formatDecimal"
    }));

    const sectors = captured.buildSectors({
      voltageLinearWarningFrom: 12.2,
      voltageLinearAlarmFrom: 11.6
    }, 10, 15, { min: 10, max: 15 }, {}, {
      colors: { warning: "#123456", alarm: "#654321" }
    });

    expect(sectors).toEqual([
      { from: 10, to: 11.6, color: "#654321" },
      { from: 11.6, to: 12.2, color: "#123456" }
    ]);
  });

  it("suppresses disabled sectors and keeps warning-only behavior", function () {
    let captured;

    const mod = loadFresh("widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js");
    mod.create({}, createComponentContextMock({
      modules: {
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
        ValueMath: {
          create() {
            return {
                formatGaugeDisplay(raw, props, applyFormatter, normalize, defaultFormatter, defaultParameters) {
                  const p = props || {};
                  const defaultText = Object.prototype.hasOwnProperty.call(p, "default")
                    ? p.default
                    : normalize(undefined, undefined);
                  const n = Number(raw);
                  if (!Number.isFinite(n)) {
                    return { num: NaN, text: defaultText };
                  }
                  const formatter = Object.prototype.hasOwnProperty.call(p, "formatter") ? p.formatter : defaultFormatter;
                  const formatterParameters = Object.prototype.hasOwnProperty.call(p, "formatterParameters")
                    ? p.formatterParameters
                    : defaultParameters;
                  const formatted = normalize(String(applyFormatter(n, {
                    formatter: formatter,
                    formatterParameters: formatterParameters,
                    default: defaultText
                  })), defaultText);
                  const match = String(formatted).match(/-?\d+(?:\.\d+)?/);
                  const num = match ? Number(match[0]) : NaN;
                  return Number.isFinite(num) ? { num: num, text: match[0] } : { num: NaN, text: defaultText };
                },
                extractNumberText(text) {
                  const match = String(text).match(/-?\d+(?:\.\d+)?/);
                  return match ? match[0] : "";
                },
                clamp(v, lo, hi) {
                  return Math.max(lo, Math.min(hi, Number(v)));
                },
                resolveVoltageTickSteps() {
                  return { major: 1, minor: 0.2 };
                }
              };
          }
        },
        LinearGaugeEngine: {
          create() {
            return {
              createRenderer(cfg) {
                captured = cfg;
                return function () {};
              }
            };
          }
        }
      },
      services: {
        format: {
          applyFormatter(value) {
            return String(value);
          }
        }
      }
    }));

    expect(captured.buildSectors({
      voltageLinearWarningEnabled: false,
      voltageLinearAlarmEnabled: false
    }, 10, 15, { min: 10, max: 15 }, {}, {
      colors: { warning: "#123456", alarm: "#654321" }
    })).toEqual([]);

    expect(captured.buildSectors({
      voltageLinearWarningEnabled: true,
      voltageLinearAlarmEnabled: false,
      voltageLinearWarningFrom: 12.8
    }, 10, 15, { min: 10, max: 15 }, {}, {
      colors: { warning: "#123456", alarm: "#654321" }
    })).toEqual([{ from: 10, to: 12.8, color: "#123456" }]);
  });

  it("returns placeholder output for null voltage values", function () {
    let captured;
    const applyFormatter = vi.fn((value) => String(value));

    loadFresh("widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js").create({}, createComponentContextMock({
      modules: {
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
        ValueMath: {
          create() {
            return {
              formatGaugeDisplay(raw, props, apply, normalize, defaultFormatter, defaultParameters) {
                const p = props || {};
                const defaultText = Object.prototype.hasOwnProperty.call(p, "default")
                  ? p.default
                  : normalize(undefined, undefined);
                if (raw == null) {
                  return { num: NaN, text: defaultText };
                }
                const n = Number(raw);
                if (!Number.isFinite(n)) {
                  return { num: NaN, text: defaultText };
                }
                const formatter = Object.prototype.hasOwnProperty.call(p, "formatter") ? p.formatter : defaultFormatter;
                const formatterParameters = Object.prototype.hasOwnProperty.call(p, "formatterParameters")
                  ? p.formatterParameters
                  : defaultParameters;
                const formatted = normalize(String(apply(n, {
                  formatter: formatter,
                  formatterParameters: formatterParameters,
                  default: defaultText
                })), defaultText);
                const match = String(formatted).match(/-?\d+(?:\.\d+)?/);
                const num = match ? Number(match[0]) : NaN;
                return Number.isFinite(num) ? { num: num, text: match[0] } : { num: NaN, text: defaultText };
              },
              clamp(v, lo, hi) {
                return Math.max(lo, Math.min(hi, Number(v)));
              },
              resolveVoltageTickSteps() {
                return { major: 1, minor: 0.2 };
              }
            };
          }
        },
        LinearGaugeEngine: {
          create() {
            return {
              createRenderer(cfg) {
                captured = cfg;
                return function () {};
              }
            };
          }
        }
      },
      services: {
        format: { applyFormatter }
      }
    }));

    expect(captured.formatDisplay(null, {})).toEqual({ num: NaN, text: "---" });
    expect(applyFormatter).not.toHaveBeenCalled();
  });

  it("treats blank and missing low-end thresholds as unset", function () {
    let captured;

    loadFresh("widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js").create({}, createComponentContextMock({
      modules: {
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
        ValueMath: {
          create() {
            return {
              formatGaugeDisplay(raw) {
                const n = Number(raw);
                return Number.isFinite(n) ? { num: n, text: String(n) } : { num: NaN, text: "---" };
              },
              clamp(v, lo, hi) {
                return Math.max(lo, Math.min(hi, Number(v)));
              },
              resolveVoltageTickSteps() {
                return { major: 1, minor: 0.2 };
              }
            };
          }
        },
        LinearGaugeEngine: {
          create() {
            return {
              createRenderer(cfg) {
                captured = cfg;
                return function () {};
              }
            };
          }
        }
      },
      services: {
        format: { applyFormatter(value) { return String(value); } }
      }
    }));

    const theme = { colors: { warning: "#123456", alarm: "#654321" } };
    const axis = { min: 10, max: 15 };

    [null, undefined, "", "   "].forEach(function (rawThreshold) {
      expect(captured.buildSectors({
        voltageLinearWarningEnabled: true,
        voltageLinearAlarmEnabled: true,
        voltageLinearWarningFrom: rawThreshold,
        voltageLinearAlarmFrom: rawThreshold
      }, 10, 15, axis, {}, theme)).toEqual([]);
    });

    expect(captured.buildSectors({
      voltageLinearWarningEnabled: true,
      voltageLinearAlarmEnabled: true,
      voltageLinearWarningFrom: 12.2,
      voltageLinearAlarmFrom: 11.6
    }, 10, 15, axis, {}, theme)).toEqual([
      { from: 10, to: 11.6, color: "#654321" },
      { from: 11.6, to: 12.2, color: "#123456" }
    ]);
  });
});
