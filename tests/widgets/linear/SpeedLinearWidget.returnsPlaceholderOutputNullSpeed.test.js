// @ts-check
const { createComponentContextMock, loadFresh } = require("./SpeedLinearWidget-setup");

describe("SpeedLinearWidget", function () {
  it("returns placeholder output for null speed values", function () {
    /** @typedef {{ formatDisplay: (value: unknown, props: Record<string, unknown>, unit: string) => { num: number, text: string } }} FormatConfig */
    /** @type {FormatConfig | undefined} */
    let captured;
    const applyFormatter = vi.fn((/** @type {unknown} */ value) => String(value));

    loadFresh("widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js").create(
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
                resolveStandardTickSteps() {
                  return { major: 5, minor: 1 };
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
          format: { applyFormatter }
        }
      })
    );

    if (!captured) {
      throw new Error("Expected the speed-linear formatter configuration.");
    }
    expect(captured.formatDisplay(null, {}, "kn")).toEqual({
      num: NaN,
      text: "---"
    });
    expect(applyFormatter).not.toHaveBeenCalled();
  });

  it("treats blank and missing high-end thresholds as unset", function () {
    /** @typedef {{ buildSectors: (props: Record<string, unknown>, min: number, max: number, axis: { max: number, min: number }, valueApi: { clamp: (value: unknown, min: number, max: number) => number }, theme: { colors: { alarm: string, warning: string } }) => unknown[] }} SectorConfig */
    /** @type {SectorConfig | undefined} */
    let captured;

    loadFresh("widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js").create(
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
                /** @param {unknown} raw */
                formatGaugeDisplay(raw) {
                  const n = Number(raw);
                  return Number.isFinite(n) ? { num: n, text: String(n) } : { num: NaN, text: "---" };
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
                /** @param {SectorConfig} cfg */
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
            /** @param {unknown} value */
            applyFormatter(value) {
              return String(value);
            }
          }
        }
      })
    );

    const theme = { colors: { warning: "#123456", alarm: "#654321" } };
    const axis = { min: 0, max: 30 };
    const valueApi = {
      /** @param {unknown} v @param {number} lo @param {number} hi */
      clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, Number(v)));
      }
    };

    if (!captured) {
      throw new Error("Expected the speed-linear sectors configuration.");
    }
    const sectorConfig = captured;

    [null, undefined, "", "   "].forEach(function (rawThreshold) {
      expect(
        sectorConfig.buildSectors(
          {
            speedLinearWarningFrom: rawThreshold,
            speedLinearAlarmFrom: rawThreshold
          },
          0,
          30,
          axis,
          valueApi,
          theme
        )
      ).toEqual([]);
    });

    expect(
      sectorConfig.buildSectors(
        {
          speedLinearWarningFrom: 20,
          speedLinearAlarmFrom: 25
        },
        0,
        30,
        axis,
        valueApi,
        theme
      )
    ).toEqual([
      { from: 20, to: 25, color: "#123456" },
      { from: 25, to: 30, color: "#654321" }
    ]);
  });
});
