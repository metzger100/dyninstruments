// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("TemperatureLinearWidget", function () {
  it("normalizes shared placeholder formatter output before parsing", function () {
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
                normalize(text, defaultText) {
                  if (text == null) return defaultText == null ? "---" : defaultText;
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

    expect(
      captured.formatDisplay(23.4, {
        formatter: "formatTemperature",
        formatterParameters: ["celsius"]
      })
    ).toEqual({ num: NaN, text: "---" });
    expect(seenText).toBe("---");
  });

  it("returns placeholder output for null temperature values", function () {
    let captured;
    const applyFormatter = vi.fn((value) => String(value));

    loadFresh("widgets/linear/TemperatureLinearWidget/TemperatureLinearWidget.js").create(
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
});
