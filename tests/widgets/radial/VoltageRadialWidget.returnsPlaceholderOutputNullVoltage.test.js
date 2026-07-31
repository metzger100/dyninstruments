// @ts-check
const { createComponentContextMock, loadFresh } = require("./VoltageRadialWidget-setup");

/** @typedef {{ formatDisplay: (raw: unknown, props: Record<string, unknown>) => { num: number, text: unknown } }} VoltageRendererConfig */

describe("VoltageRadialWidget", function () {
  it("returns placeholder output for null voltage values", function () {
    /** @type {VoltageRendererConfig | undefined} */
    let captured;
    const applyFormatter = vi.fn((value) => String(value));

    const mod = loadFresh("widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js");
    mod.create(
      {},
      createComponentContextMock({
        modules: {
          PlaceholderNormalize: {
            create() {
              return {
                /** @param {unknown} text @param {unknown} defaultText @returns {string | unknown} */
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
                /**
                 * @param {unknown} raw
                 * @param {Record<string, unknown>} props
                 * @param {(n: number, opts: {formatter: unknown, formatterParameters: unknown, default: unknown}) => unknown} apply
                 * @param {(text: unknown, defaultText: unknown) => unknown} normalize
                 * @param {unknown} defaultFormatter
                 * @param {unknown} defaultParameters
                 * @returns {{num: number, text: unknown}}
                 */
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
                  return Number.isFinite(num) && match ? { num: num, text: match[0] } : { num: NaN, text: defaultText };
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
                /** @param {VoltageRendererConfig} cfg */
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

    if (!captured) throw new Error("Expected createRenderer to capture a config.");
    expect(captured.formatDisplay(null, {})).toEqual({ num: NaN, text: "---" });
    expect(applyFormatter).not.toHaveBeenCalled();
  });
});
