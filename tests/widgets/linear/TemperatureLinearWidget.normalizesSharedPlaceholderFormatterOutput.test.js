// @ts-check
const { createComponentContextMock, loadFresh } = require("./TemperatureLinearWidget-setup");

describe("TemperatureLinearWidget", function () {
  it("normalizes shared placeholder formatter output before parsing", function () {
    /** @typedef {{ formatDisplay: (value: number, props: Record<string, unknown>) => { num: number, text: string } }} FormatConfig */
    /** @type {FormatConfig | undefined} */
    let captured;
    let seenText = "";

    const mod = loadFresh("widgets/linear/TemperatureLinearWidget/TemperatureLinearWidget.js");
    mod.create(
      {},
      createComponentContextMock({
        modules: {
          PlaceholderNormalize: {
            create() {
              return {
                /** @param {unknown} text @param {unknown} defaultText */
                normalize(text, defaultText) {
                  if (text === null || text === undefined)
                    return defaultText === null || defaultText === undefined ? "---" : defaultText;
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
                /** @param {unknown} v @param {number} lo @param {number} hi */
                clamp(v, lo, hi) {
                  return Math.max(lo, Math.min(hi, Number(v)));
                },
                resolveTemperatureTickSteps() {
                  return { major: 10, minor: 2 };
                }
              };
            }
          },
          LinearGaugeEngine: {
            create() {
              return {
                /** @param {FormatConfig} cfg */
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
            applyFormatter() {
              return "NO DATA";
            }
          }
        }
      })
    );

    if (!captured) {
      throw new Error("Expected the temperature-linear formatter configuration.");
    }
    expect(
      captured.formatDisplay(23.4, {
        formatter: "formatTemperature",
        formatterParameters: ["celsius"]
      })
    ).toEqual({ num: NaN, text: "---" });
    expect(seenText).toBe("---");
  });

  it("returns placeholder output for null temperature values", function () {
    /** @typedef {{ formatDisplay: (value: unknown, props: Record<string, unknown>) => { num: number, text: string } }} NullFormatConfig */
    /** @type {NullFormatConfig | undefined} */
    let captured;
    const applyFormatter = vi.fn((/** @type {unknown} */ value) => String(value));

    loadFresh("widgets/linear/TemperatureLinearWidget/TemperatureLinearWidget.js").create(
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
                /** @param {unknown} v @param {number} lo @param {number} hi */
                clamp(v, lo, hi) {
                  return Math.max(lo, Math.min(hi, Number(v)));
                },
                resolveTemperatureTickSteps() {
                  return { major: 10, minor: 2 };
                }
              };
            }
          },
          LinearGaugeEngine: {
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
      throw new Error("Expected the null-temperature linear configuration.");
    }
    expect(captured.formatDisplay(null, {})).toEqual({ num: NaN, text: "---" });
    expect(applyFormatter).not.toHaveBeenCalled();
  });
});
