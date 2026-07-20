const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("SpeedLinearWidget", function () {
  it("passes LinearGaugeEngine config with range axis and high-end sectors", function () {
    /** @type {any} */
    let captured;
    let receivedSectorTheme;
    const resolveStandardTickSteps = vi.fn((range) => {
      if (range <= 6) return { major: 1, minor: 0.5 };
      if (range <= 30) return { major: 5, minor: 1 };
      return { major: 50, minor: 10 };
    });
    const renderCanvas = vi.fn();
    const applyFormatter = vi.fn((value, spec) => Number(value).toFixed(1) + " " + spec.formatterParameters[0]);

    const mod = loadFresh("widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js");
    const spec = mod.create(
      {},
      createComponentContextMock({
        modules: {
          PlaceholderNormalize: {
            create() {
              return {
                /** @param {any} text @param {any} defaultText @returns {any} */
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
                /**
                 * @param {any} raw
                 * @param {any} props
                 * @param {any} applyFormatter
                 * @param {any} normalize
                 * @param {any} defaultFormatter
                 * @param {any} defaultParameters
                 * @returns {any}
                 */
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
                  const match = String(formatted).match(new RegExp("-?\\d+(?:\\.\\d+)?"));
                  const num = match ? Number(match[0]) : NaN;
                  return Number.isFinite(num)
                    ? { num: num, text: /** @type {RegExpMatchArray} */ (match)[0] }
                    : { num: NaN, text: defaultText };
                },
                /** @param {any} text @returns {any} */
                extractNumberText(text) {
                  const match = String(text).match(new RegExp("-?\\d+(?:\\.\\d+)?"));
                  return match ? match[0] : "";
                },
                resolveStandardTickSteps
              };
            }
          },
          LinearGaugeEngine: {
            create() {
              return {
                /** @param {any} cfg @returns {any} */
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
      })
    );

    expect(spec.renderCanvas).toBe(renderCanvas);
    expect(captured.axisMode).toBe("range");
    expect(captured.unitDefault).toBe("kn");
    expect(captured.hideTextualMetricsProp).toBe("speedLinearHideTextualMetrics");
    expect(captured).not.toHaveProperty("rangeDefaults");
    expect(captured.ratioProps).toEqual({
      normal: "speedLinearRatioThresholdNormal",
      flat: "speedLinearRatioThresholdFlat"
    });
    expect(captured).not.toHaveProperty("ratioDefaults");
    expect(captured.tickSteps(6)).toEqual({ major: 1, minor: 0.5 });
    expect(captured.tickSteps(30)).toEqual({ major: 5, minor: 1 });
    expect(resolveStandardTickSteps).toHaveBeenCalledTimes(2);
    expect(
      captured.formatDisplay(
        6.44,
        {
          formatter: "formatSpeed",
          formatterParameters: ["kn"]
        },
        "kn"
      )
    ).toEqual({ num: 6.4, text: "6.4" });
    expect(applyFormatter).toHaveBeenCalled();

    const sectorTheme = {
      colors: {
        warning: "#123456",
        alarm: "#654321"
      }
    };
    const sectors = captured.buildSectors(
      {
        speedLinearWarningFrom: 20,
        speedLinearAlarmFrom: 25
      },
      0,
      30,
      { min: 0, max: 30 },
      {
        /** @param {any} v @param {any} lo @param {any} hi @returns {any} */
        clamp(v, lo, hi) {
          return Math.max(lo, Math.min(hi, Number(v)));
        }
      },
      sectorTheme
    );
    receivedSectorTheme = sectorTheme;

    expect(sectors).toEqual([
      { from: 20, to: 25, color: "#123456" },
      { from: 25, to: 30, color: "#654321" }
    ]);
    expect(receivedSectorTheme.colors.warning).toBe("#123456");
    expect(receivedSectorTheme.colors.alarm).toBe("#654321");
  });

  it("does not reformat to fixed decimals when formatter returns raw numeric string", function () {
    /** @type {any} */
    let captured;
    const mod = loadFresh("widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js");
    mod.create(
      {},
      createComponentContextMock({
        modules: {
          PlaceholderNormalize: {
            create() {
              return {
                /** @param {any} text @param {any} defaultText @returns {any} */
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
                /**
                 * @param {any} raw
                 * @param {any} props
                 * @param {any} applyFormatter
                 * @param {any} normalize
                 * @param {any} defaultFormatter
                 * @param {any} defaultParameters
                 * @returns {any}
                 */
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
                  const match = String(formatted).match(new RegExp("-?\\d+(?:\\.\\d+)?"));
                  const num = match ? Number(match[0]) : NaN;
                  return Number.isFinite(num)
                    ? { num: num, text: /** @type {RegExpMatchArray} */ (match)[0] }
                    : { num: NaN, text: defaultText };
                },
                /** @param {any} text @returns {any} */
                extractNumberText(text) {
                  const match = String(text).match(new RegExp("-?\\d+(?:\\.\\d+)?"));
                  return match ? match[0] : "";
                },
                resolveStandardTickSteps() {
                  return { major: 5, minor: 1 };
                }
              };
            }
          },
          LinearGaugeEngine: {
            create() {
              return {
                /** @param {any} cfg @returns {any} */
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
            /** @param {any} value @returns {any} */
            applyFormatter(value) {
              return String(value);
            }
          }
        }
      })
    );

    expect(captured.formatDisplay(6.44, {}, "kn")).toEqual({
      num: 6.44,
      text: "6.44"
    });
  });
});
