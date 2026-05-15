const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("VoltageRadialWidget", function () {
  it("builds low-end sectors from config-backed warning/alarm values", function () {
    let captured;
    let receivedProps;
    let receivedOptions;
    const renderCanvas = vi.fn();
    const applyFormatter = vi.fn((value) => Number(value).toFixed(1));
    const resolveVoltageTickSteps = vi.fn((range) => {
      if (range <= 3) return { major: 0.5, minor: 0.1 };
      if (range <= 12) return { major: 2, minor: 0.5 };
      return { major: 50, minor: 10 };
    });

    const mod = loadFresh("widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js");
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
                resolveVoltageTickSteps
              };
          }
        },
        SemicircleRadialEngine: {
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
    expect(captured).not.toHaveProperty("rangeDefaults");
    expect(captured.ratioProps).toEqual({
      normal: "voltageRadialRatioThresholdNormal",
      flat: "voltageRadialRatioThresholdFlat"
    });
    expect(captured.hideTextualMetricsProp).toBe("voltageRadialHideTextualMetrics");
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

    const theme = {
      colors: {
        warning: "#123456",
        alarm: "#654321"
      }
    };
    const valueUtils = {
      buildLowEndSectors(props, minV, maxV, arc, options) {
        receivedProps = props;
        receivedOptions = options;
        return [
          { a0: minV, a1: props.alarmFrom, color: options.alarmColor },
          { a0: props.alarmFrom, a1: props.warningFrom, color: options.warningColor }
        ];
      }
    };
    const sectors = captured.buildSectors({
      voltageRadialWarningFrom: 12.2,
      voltageRadialAlarmFrom: 11.6
    }, 10, 15, {}, valueUtils, theme);

    expect(sectors).toEqual([
      { a0: 10, a1: 11.6, color: "#654321" },
      { a0: 11.6, a1: 12.2, color: "#123456" }
    ]);
    expect(receivedProps).toEqual({
      warningFrom: 12.2,
      alarmFrom: 11.6
    });
    expect(receivedOptions).not.toHaveProperty("defaultWarningFrom");
    expect(receivedOptions).not.toHaveProperty("defaultAlarmFrom");
    expect(receivedOptions.warningColor).toBe(theme.colors.warning);
    expect(receivedOptions.alarmColor).toBe(theme.colors.alarm);
  });

  it("suppresses disabled sectors by toggle flags before low-end sector building", function () {
    let captured;
    const buildLowEndSectors = vi.fn(() => [{ a0: 10, a1: 11.6, color: "#654321" }]);

    const mod = loadFresh("widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js");
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
                resolveVoltageTickSteps() {
                  return { major: 1, minor: 0.2 };
                }
              };
          }
        },
        SemicircleRadialEngine: {
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

    const theme = { colors: { warning: "#123456", alarm: "#654321" } };
    const valueUtils = { buildLowEndSectors };
    expect(captured.buildSectors({
      voltageRadialWarningEnabled: false,
      voltageRadialAlarmEnabled: false
    }, 10, 15, {}, valueUtils, theme)).toEqual([]);
    expect(buildLowEndSectors).not.toHaveBeenCalled();

    captured.buildSectors({
      voltageRadialWarningEnabled: false,
      voltageRadialAlarmEnabled: true,
      voltageRadialAlarmFrom: 11.6
    }, 10, 15, {}, valueUtils, theme);
    expect(buildLowEndSectors).toHaveBeenCalledTimes(1);
    expect(Number.isNaN(buildLowEndSectors.mock.calls[0][0].warningFrom)).toBe(true);
    expect(buildLowEndSectors.mock.calls[0][0].alarmFrom).toBe(11.6);

    captured.buildSectors({
      voltageRadialWarningEnabled: true,
      voltageRadialAlarmEnabled: false,
      voltageRadialWarningFrom: 12.2
    }, 10, 15, {}, valueUtils, theme);
    expect(buildLowEndSectors).toHaveBeenCalledTimes(2);
    expect(buildLowEndSectors.mock.calls[1][0].warningFrom).toBe(12.2);
    expect(Number.isNaN(buildLowEndSectors.mock.calls[1][0].alarmFrom)).toBe(true);
  });

  it("does not force fixed-decimal fallback text on raw formatter passthrough", function () {
    let captured;

    const mod = loadFresh("widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js");
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
                resolveVoltageTickSteps() {
                  return { major: 1, minor: 0.2 };
                }
              };
          }
        },
        SemicircleRadialEngine: {
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

    expect(captured.formatDisplay(12.34, {})).toEqual({ num: 12.34, text: "12.34" });
  });

  it("returns placeholder output for null voltage values", function () {
    let captured;
    const applyFormatter = vi.fn((value) => String(value));

    const mod = loadFresh("widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js");
    mod.create({}, createComponentContextMock({
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
              resolveVoltageTickSteps() {
                return { major: 1, minor: 0.2 };
              }
            };
          }
        },
        SemicircleRadialEngine: {
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
});
