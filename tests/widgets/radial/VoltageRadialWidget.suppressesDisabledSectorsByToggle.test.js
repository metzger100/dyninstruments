// @ts-check
const { createComponentContextMock, loadFresh } = require("./VoltageRadialWidget-setup");

describe("VoltageRadialWidget", function () {
  it("suppresses disabled sectors by toggle flags before low-end sector building", function () {
    /** @typedef {{ alarmFrom?: number, warningFrom?: number }} SectorInput */
    /** @typedef {{ buildSectors: (props: Record<string, unknown>, min: number, max: number, range: Record<string, unknown>, valueUtils: { buildLowEndSectors: (input: SectorInput) => unknown[] }, theme: { colors: { alarm: string, warning: string } }) => unknown[] }} CapturedConfig */
    /** @type {CapturedConfig | undefined} */
    let captured;
    const buildLowEndSectors = vi.fn((/** @type {SectorInput} */ input) => {
      void input;
      return [{ a0: 10, a1: 11.6, color: "#654321" }];
    });

    const mod = loadFresh("widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js");
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
                resolveVoltageTickSteps() {
                  return { major: 1, minor: 0.2 };
                }
              };
            }
          },
          SemicircleRadialEngine: {
            create() {
              return {
                /** @param {CapturedConfig} cfg */
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
    const valueUtils = { buildLowEndSectors };
    if (!captured) {
      throw new Error("Expected the voltage renderer configuration.");
    }
    const rendererConfig = captured;
    expect(
      rendererConfig.buildSectors(
        {
          voltageRadialWarningEnabled: false,
          voltageRadialAlarmEnabled: false
        },
        10,
        15,
        {},
        valueUtils,
        theme
      )
    ).toEqual([]);
    expect(buildLowEndSectors).not.toHaveBeenCalled();

    rendererConfig.buildSectors(
      {
        voltageRadialWarningEnabled: false,
        voltageRadialAlarmEnabled: true,
        voltageRadialAlarmFrom: 11.6
      },
      10,
      15,
      {},
      valueUtils,
      theme
    );
    expect(buildLowEndSectors).toHaveBeenCalledTimes(1);
    const firstInput = buildLowEndSectors.mock.calls[0]?.[0];
    expect(firstInput?.warningFrom).toBe(undefined);
    expect(firstInput?.alarmFrom).toBe(11.6);

    rendererConfig.buildSectors(
      {
        voltageRadialWarningEnabled: true,
        voltageRadialAlarmEnabled: false,
        voltageRadialWarningFrom: 12.2
      },
      10,
      15,
      {},
      valueUtils,
      theme
    );
    expect(buildLowEndSectors).toHaveBeenCalledTimes(2);
    const secondInput = buildLowEndSectors.mock.calls[1]?.[0];
    expect(secondInput?.warningFrom).toBe(12.2);
    expect(secondInput?.alarmFrom).toBe(undefined);
  });

  it("does not force fixed-decimal fallback text on raw formatter passthrough", function () {
    /** @typedef {{ formatDisplay: (value: number, props: Record<string, unknown>) => { num: number, text: string } }} FormatCapturedConfig */
    /** @type {FormatCapturedConfig | undefined} */
    let captured;

    const mod = loadFresh("widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js");
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
                resolveVoltageTickSteps() {
                  return { major: 1, minor: 0.2 };
                }
              };
            }
          },
          SemicircleRadialEngine: {
            create() {
              return {
                /** @param {FormatCapturedConfig} cfg */
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
      throw new Error("Expected the voltage formatter configuration.");
    }
    expect(captured.formatDisplay(12.34, {})).toEqual({
      num: 12.34,
      text: "12.34"
    });
  });
});
