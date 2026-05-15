const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("TemperatureRadialWidget", function () {
  it("does not apply Kelvin fallback on raw formatter passthrough", function () {
    let captured;
    const renderCanvas = vi.fn();
    const applyFormatter = vi.fn((value) => String(value));
    const resolveTemperatureTickSteps = vi.fn((range) => {
      if (range <= 8) return { major: 1, minor: 0.5 };
      if (range <= 100) return { major: 10, minor: 2 };
      return { major: 50, minor: 10 };
    });

    const mod = loadFresh("widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js");
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
                resolveTemperatureTickSteps
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
      normal: "tempRadialRatioThresholdNormal",
      flat: "tempRadialRatioThresholdFlat"
    });
    expect(captured.hideTextualMetricsProp).toBe("tempRadialHideTextualMetrics");
    expect(captured).not.toHaveProperty("ratioDefaults");
    expect(captured.tickSteps(8)).toEqual({ major: 1, minor: 0.5 });
    expect(captured.tickSteps(100)).toEqual({ major: 10, minor: 2 });
    expect(resolveTemperatureTickSteps).toHaveBeenCalledTimes(2);
    const display = captured.formatDisplay(300, {
      formatter: "formatTemperature",
      formatterParameters: ["celsius"]
    });
    expect(display).toEqual({ num: 300, text: "300.0" });
    expect(applyFormatter).toHaveBeenCalledWith(300, expect.objectContaining({
      formatter: "formatTemperature"
    }));
  });

  it("returns default text when formatter output is not parseable", function () {
    let captured;
    const renderCanvas = vi.fn();

    const mod = loadFresh("widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js");
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
                resolveTemperatureTickSteps() {
                  return { major: 10, minor: 2 };
                }
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
        format: {
          applyFormatter() {
            return "not-a-number";
          }
        }
      }
    }));

    expect(captured.formatDisplay(300, {
      formatter: "formatTemperature",
      formatterParameters: ["celsius"]
    })).toEqual({ num: NaN, text: "---" });
  });

  it("normalizes shared placeholder formatter output before parsing", function () {
    let captured;
    let seenText = "";
    const renderCanvas = vi.fn();

    const mod = loadFresh("widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js");
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
                  const numberText = this.extractNumberText(formatted);
                  const num = numberText ? Number(numberText) : NaN;
                  return Number.isFinite(num) ? { num: num, text: numberText } : { num: NaN, text: defaultText };
                },
                extractNumberText(text) {
                  seenText = String(text);
                  return "";
                },
                resolveTemperatureTickSteps() {
                  return { major: 10, minor: 2 };
                }
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
        format: {
          applyFormatter() {
            return "NO DATA";
          }
        }
      }
    }));

    expect(captured.formatDisplay(300, {
      formatter: "formatTemperature",
      formatterParameters: ["celsius"]
    })).toEqual({ num: NaN, text: "---" });
    expect(seenText).toBe("---");
  });

  it("returns placeholder output for null temperature values", function () {
    let captured;
    const applyFormatter = vi.fn((value) => String(value));

    const mod = loadFresh("widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js");
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
              resolveTemperatureTickSteps() {
                return { major: 10, minor: 2 };
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
