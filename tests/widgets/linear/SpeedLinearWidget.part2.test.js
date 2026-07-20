// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("SpeedLinearWidget", function () {
  it("returns placeholder output for null speed values", function () {
    let captured;
    const applyFormatter = vi.fn((value) => String(value));

    loadFresh("widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js").create(
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
                resolveStandardTickSteps() {
                  return { major: 5, minor: 1 };
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

    expect(captured.formatDisplay(null, {}, "kn")).toEqual({
      num: NaN,
      text: "---"
    });
    expect(applyFormatter).not.toHaveBeenCalled();
  });

  it("treats blank and missing high-end thresholds as unset", function () {
    let captured;

    loadFresh("widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js").create(
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
      clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, Number(v)));
      }
    };

    [null, undefined, "", "   "].forEach(function (rawThreshold) {
      expect(
        captured.buildSectors(
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
      captured.buildSectors(
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
