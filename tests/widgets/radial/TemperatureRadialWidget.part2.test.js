// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("TemperatureRadialWidget", function () {
  it("normalizes shared placeholder formatter output before parsing", function () {
    let captured;
    let seenText = "";
    const renderCanvas = vi.fn();

    const mod = loadFresh("widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js");
    mod.create(
      {},
      createComponentContextMock({
        modules: {
          PlaceholderNormalize: {
            create() {
              return {
                normalize(text, defaultText) {
                  if (text == null) {
                    return defaultText == null ? "---" : defaultText;
                  }
                  const value = String(text).trim();
                  return value === "NO DATA" || /^-+$/.test(value)
                    ? defaultText == null
                      ? "---"
                      : defaultText
                    : String(text);
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
                  const formatter = Object.prototype.hasOwnProperty.call(p, "formatter")
                    ? p.formatter
                    : defaultFormatter;
                  const formatterParameters = Object.prototype.hasOwnProperty.call(p, "formatterParameters")
                    ? p.formatterParameters
                    : defaultParameters;
                  const formatted = normalize(
                    String(
                      applyFormatter(n, {
                        formatter: formatter,
                        formatterParameters: formatterParameters,
                        default: defaultText
                      })
                    ),
                    defaultText
                  );
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
      })
    );

    expect(
      captured.formatDisplay(300, {
        formatter: "formatTemperature",
        formatterParameters: ["celsius"]
      })
    ).toEqual({ num: NaN, text: "---" });
    expect(seenText).toBe("---");
  });

  it("returns placeholder output for null temperature values", function () {
    let captured;
    const applyFormatter = vi.fn((value) => String(value));

    const mod = loadFresh("widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js");
    mod.create(
      {},
      createComponentContextMock({
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
                  const formatter = Object.prototype.hasOwnProperty.call(p, "formatter")
                    ? p.formatter
                    : defaultFormatter;
                  const formatterParameters = Object.prototype.hasOwnProperty.call(p, "formatterParameters")
                    ? p.formatterParameters
                    : defaultParameters;
                  const formatted = normalize(
                    String(
                      apply(n, {
                        formatter: formatter,
                        formatterParameters: formatterParameters,
                        default: defaultText
                      })
                    ),
                    defaultText
                  );
                  const match = String(formatted).match(new RegExp("-?\\d+(?:\\.\\d+)?"));
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
      })
    );

    expect(captured.formatDisplay(null, {})).toEqual({ num: NaN, text: "---" });
    expect(applyFormatter).not.toHaveBeenCalled();
  });

  it("builds high-end sectors from the temperature warning/alarm props", function () {
    let captured;
    let receivedProps;
    let receivedOptions;

    const mod = loadFresh("widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js");
    mod.create(
      {},
      createComponentContextMock({
        modules: {
          PlaceholderNormalize: {
            create() {
              return {
                normalize(text, defaultText) {
                  return defaultText == null ? "---" : defaultText;
                }
              };
            }
          },
          ValueMath: {
            create() {
              return {
                formatGaugeDisplay() {
                  return { num: NaN, text: "---" };
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
        }
      })
    );

    const theme = { colors: { warning: "#123456", alarm: "#654321" } };
    const sectors = captured.buildSectors(
      { tempRadialAlarmFrom: 35, tempRadialWarningFrom: 30 },
      -20,
      40,
      {},
      {
        buildHighEndSectors(props, minV, maxV, arc, options) {
          receivedProps = props;
          receivedOptions = options;
          return [
            { a0: 30, a1: 35, color: options.warningColor },
            { a0: 35, a1: 40, color: options.alarmColor }
          ];
        }
      },
      theme
    );

    expect(sectors).toEqual([
      { a0: 30, a1: 35, color: "#123456" },
      { a0: 35, a1: 40, color: "#654321" }
    ]);
    expect(receivedProps).toEqual({ warningFrom: 30, alarmFrom: 35 });
    expect(receivedOptions.warningColor).toBe(theme.colors.warning);
    expect(receivedOptions.alarmColor).toBe(theme.colors.alarm);
  });

  it("exposes a no-op translateFunction since the canvas surface owns rendering", function () {
    const mod = loadFresh("widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js");
    const spec = mod.create(
      {},
      createComponentContextMock({
        modules: {
          SemicircleRadialEngine: {
            create() {
              return {
                createRenderer() {
                  return function () {};
                }
              };
            }
          },
          ValueMath: {
            create() {
              return {
                formatGaugeDisplay() {
                  return { num: NaN, text: "---" };
                },
                resolveTemperatureTickSteps() {
                  return { major: 10, minor: 2 };
                }
              };
            }
          },
          PlaceholderNormalize: {
            create() {
              return {
                normalize(text, defaultText) {
                  return defaultText == null ? "---" : defaultText;
                }
              };
            }
          }
        }
      })
    );

    expect(spec.translateFunction()).toEqual({});
  });

  it("registers itself on root.DyniComponents when loaded outside a module system", function () {
    const context = createScriptContext();
    runIifeScript("widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js", context);

    expect(context.DyniComponents.DyniTemperatureRadialWidget.id).toBe("TemperatureRadialWidget");
  });
});
