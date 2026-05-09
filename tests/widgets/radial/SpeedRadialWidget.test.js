const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("SpeedRadialWidget", function () {
  it("passes SemicircleRadialEngine config with high-end sectors", function () {
    let captured;
    let receivedOptions;
    const resolveStandardSemicircleTickSteps = vi.fn((range) => {
      if (range <= 6) return { major: 1, minor: 0.5 };
      if (range <= 30) return { major: 5, minor: 1 };
      return { major: 50, minor: 10 };
    });
    const renderCanvas = vi.fn();
    const applyFormatter = vi.fn((value, spec) => {
      return Number(value).toFixed(1) + " " + spec.formatterParameters[0];
    });

    const mod = loadFresh("widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js");
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
        RadialValueMath: {
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
                buildHighEndSectors(props, minV, maxV, arc, options) {
                  receivedOptions = options;
                  return [
                    { a0: 20, a1: 25, color: options.warningColor },
                    { a0: 25, a1: 30, color: options.alarmColor }
                  ];
                },
                resolveStandardSemicircleTickSteps
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
    expect(captured.unitDefault).toBe("kn");
    expect(captured).not.toHaveProperty("rangeDefaults");
    expect(captured.ratioProps).toEqual({
      normal: "speedRadialRatioThresholdNormal",
      flat: "speedRadialRatioThresholdFlat"
    });
    expect(captured.hideTextualMetricsProp).toBe("speedRadialHideTextualMetrics");
    expect(captured).not.toHaveProperty("ratioDefaults");
    expect(captured.tickSteps(6)).toEqual({ major: 1, minor: 0.5 });
    expect(captured.tickSteps(30)).toEqual({ major: 5, minor: 1 });
    expect(resolveStandardSemicircleTickSteps).toHaveBeenCalledTimes(2);
    expect(captured.formatDisplay(6.44, {
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    }, "kn")).toEqual({ num: 6.4, text: "6.4" });
    expect(applyFormatter).toHaveBeenCalled();

    const theme = {
      colors: {
        warning: "#123456",
        alarm: "#654321"
      }
    };
    const sectors = captured.buildSectors({ warningFrom: 20, alarmFrom: 25 }, 0, 30, {}, {}, theme);

    expect(sectors).toEqual([
      { a0: 20, a1: 25, color: "#123456" },
      { a0: 25, a1: 30, color: "#654321" }
    ]);
    expect(receivedOptions.warningColor).toBe(theme.colors.warning);
    expect(receivedOptions.alarmColor).toBe(theme.colors.alarm);
  });

  it("does not fall back to fixed-decimal text when formatter returns raw passthrough", function () {
    let captured;
    const mod = loadFresh("widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js");
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
        RadialValueMath: {
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
                buildHighEndSectors() {
                  return [];
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

    expect(captured.formatDisplay(6.44, {}, "kn")).toEqual({ num: 6.44, text: "6.44" });
  });
});
