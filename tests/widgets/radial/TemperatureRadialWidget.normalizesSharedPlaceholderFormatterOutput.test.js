// @ts-check
const {
  createComponentContextMock,
  createScriptContext,
  loadFresh,
  runIifeScript
} = require("./TemperatureRadialWidget-setup");

describe("TemperatureRadialWidget", function () {
  it("normalizes shared placeholder formatter output before parsing", function () {
    /** @typedef {{ formatDisplay: (value: number, props: Record<string, unknown>) => { num: number, text: string } }} FormatConfig */
    /** @type {FormatConfig | undefined} */
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
                /** @param {unknown} text @param {unknown} defaultText */
                normalize(text, defaultText) {
                  if (text === null || text === undefined) {
                    return defaultText === null || defaultText === undefined ? "---" : defaultText;
                  }
                  const value = String(text).trim();
                  return value === "NO DATA" || /^-+$/.test(value)
                    ? defaultText === null || defaultText === undefined
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
                /** @param {unknown} raw @param {Record<string, unknown>} props @param {(value: number, options: Record<string, unknown>) => unknown} applyFormatter @param {(text: unknown, defaultText: unknown) => unknown} normalize @param {unknown} defaultFormatter @param {unknown} defaultParameters */
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
                /** @param {unknown} text */
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
                /** @param {FormatConfig} cfg */
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
      (() => {
        if (!captured) {
          throw new Error("Expected the temperature formatter configuration.");
        }
        return captured.formatDisplay(300, {
          formatter: "formatTemperature",
          formatterParameters: ["celsius"]
        });
      })()
    ).toEqual({ num: NaN, text: "---" });
    expect(seenText).toBe("---");
  });

  it("returns placeholder output for null temperature values", function () {
    /** @typedef {{ formatDisplay: (value: unknown, props: Record<string, unknown>) => { num: number, text: string } }} NullFormatConfig */
    /** @type {NullFormatConfig | undefined} */
    let captured;
    const applyFormatter = vi.fn((/** @type {unknown} */ value) => String(value));

    const mod = loadFresh("widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js");
    mod.create(
      {},
      createComponentContextMock({
        modules: {
          PlaceholderNormalize: {
            create() {
              return {
                /** @param {unknown} text @param {unknown} defaultText */
                normalize(text, defaultText) {
                  if (text === null || text === undefined) {
                    return defaultText === null || defaultText === undefined ? "---" : defaultText;
                  }
                  return String(text);
                }
              };
            }
          },
          ValueMath: {
            create() {
              return {
                /** @param {unknown} raw @param {Record<string, unknown>} props @param {(value: number, options: Record<string, unknown>) => unknown} apply @param {(text: unknown, defaultText: unknown) => unknown} normalize @param {unknown} defaultFormatter @param {unknown} defaultParameters */
                formatGaugeDisplay(raw, props, apply, normalize, defaultFormatter, defaultParameters) {
                  const p = props || {};
                  const defaultText = Object.prototype.hasOwnProperty.call(p, "default")
                    ? p.default
                    : normalize(undefined, undefined);
                  if (raw === null || raw === undefined) {
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
                  const text = match ? match[0] : defaultText;
                  return Number.isFinite(num) ? { num: num, text: text } : { num: NaN, text: defaultText };
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
                /** @param {NullFormatConfig} cfg */
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

    if (!captured) {
      throw new Error("Expected the null-temperature formatter configuration.");
    }
    expect(captured.formatDisplay(null, {})).toEqual({ num: NaN, text: "---" });
    expect(applyFormatter).not.toHaveBeenCalled();
  });

  it("builds high-end sectors from the temperature warning/alarm props", function () {
    /** @typedef {{ buildSectors: (props: Record<string, unknown>, min: number, max: number, arc: Record<string, unknown>, valueUtils: { buildHighEndSectors: (props: Record<string, number>, min: number, max: number, arc: Record<string, unknown>, options: { alarmColor: string, warningColor: string }) => unknown[] }, theme: { colors: { alarm: string, warning: string } }) => unknown[] }} SectorsConfig */
    /** @type {SectorsConfig | undefined} */
    let captured;
    /** @type {Record<string, number> | undefined} */
    let receivedProps;
    /** @type {{ alarmColor: string, warningColor: string } | undefined} */
    let receivedOptions;

    const mod = loadFresh("widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js");
    mod.create(
      {},
      createComponentContextMock({
        modules: {
          PlaceholderNormalize: {
            create() {
              return {
                /** @param {unknown} text @param {unknown} defaultText */
                normalize(text, defaultText) {
                  return defaultText === null || defaultText === undefined ? "---" : defaultText;
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
                /** @param {SectorsConfig} cfg */
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
    if (!captured) {
      throw new Error("Expected the temperature sectors configuration.");
    }
    const sectors = captured.buildSectors(
      { tempRadialAlarmFrom: 35, tempRadialWarningFrom: 30 },
      -20,
      40,
      {},
      {
        /** @param {Record<string, number>} props @param {number} minV @param {number} maxV @param {Record<string, unknown>} arc @param {{ alarmColor: string, warningColor: string }} options */
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
    if (!receivedOptions) {
      throw new Error("Expected high-end sector options.");
    }
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
                /** @param {unknown} text @param {unknown} defaultText */
                normalize(text, defaultText) {
                  return defaultText === null || defaultText === undefined ? "---" : defaultText;
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
