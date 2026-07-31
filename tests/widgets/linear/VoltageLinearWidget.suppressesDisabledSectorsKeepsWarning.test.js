// @ts-check
const { createComponentContextMock, loadFresh } = require("./VoltageLinearWidget-setup");

describe("VoltageLinearWidget", function () {
  it("suppresses disabled sectors and keeps warning-only behavior", function () {
    /** @typedef {{ buildSectors: (props: Record<string, unknown>, min: number, max: number, range: { max: number, min: number }, valueUtils: Record<string, unknown>, theme: { colors: { alarm: string, warning: string } }) => unknown[] }} SectorsConfig */
    /** @type {SectorsConfig | undefined} */
    let captured;

    const mod = loadFresh("widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js");
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
                  const match = String(formatted).match(new RegExp("-?\\d+(?:\\.\\d+)?"));
                  const num = match ? Number(match[0]) : NaN;
                  const text = match ? match[0] : defaultText;
                  return Number.isFinite(num) ? { num: num, text: text } : { num: NaN, text: defaultText };
                },
                /** @param {unknown} text */
                extractNumberText(text) {
                  const match = String(text).match(new RegExp("-?\\d+(?:\\.\\d+)?"));
                  return match ? match[0] : "";
                },
                /** @param {unknown} v @param {number} lo @param {number} hi */
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
                /** @param {SectorsConfig} cfg */
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

    if (!captured) {
      throw new Error("Expected the voltage-linear sectors configuration.");
    }
    const sectorsConfig = captured;
    expect(
      sectorsConfig.buildSectors(
        {
          voltageLinearWarningEnabled: false,
          voltageLinearAlarmEnabled: false
        },
        10,
        15,
        { min: 10, max: 15 },
        {},
        {
          colors: { warning: "#123456", alarm: "#654321" }
        }
      )
    ).toEqual([]);

    expect(
      sectorsConfig.buildSectors(
        {
          voltageLinearWarningEnabled: true,
          voltageLinearAlarmEnabled: false,
          voltageLinearWarningFrom: 12.8
        },
        10,
        15,
        { min: 10, max: 15 },
        {},
        {
          colors: { warning: "#123456", alarm: "#654321" }
        }
      )
    ).toEqual([{ from: 10, to: 12.8, color: "#123456" }]);
  });

  it("returns placeholder output for null voltage values", function () {
    /** @typedef {{ formatDisplay: (value: unknown, props: Record<string, unknown>) => { num: number, text: string } }} FormatConfig */
    /** @type {FormatConfig | undefined} */
    let captured;
    const applyFormatter = vi.fn((/** @type {unknown} */ value) => String(value));

    loadFresh("widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js").create(
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
                resolveVoltageTickSteps() {
                  return { major: 1, minor: 0.2 };
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
      throw new Error("Expected the voltage-linear formatter configuration.");
    }
    expect(captured.formatDisplay(null, {})).toEqual({ num: NaN, text: "---" });
    expect(applyFormatter).not.toHaveBeenCalled();
  });
});
