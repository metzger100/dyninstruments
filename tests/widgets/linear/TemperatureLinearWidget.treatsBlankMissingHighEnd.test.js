// @ts-check
const { createComponentContextMock, loadFresh } = require("./TemperatureLinearWidget-setup");

describe("TemperatureLinearWidget", function () {
  it("treats blank and missing high-end thresholds as unset", function () {
    // @ts-ignore -- pre-existing untyped test mock boundary
    let captured;

    loadFresh("widgets/linear/TemperatureLinearWidget/TemperatureLinearWidget.js").create(
      {},
      createComponentContextMock({
        modules: {
          PlaceholderNormalize: {
            create() {
              return {
                // @ts-ignore -- pre-existing untyped test mock boundary
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
                // @ts-ignore -- pre-existing untyped test mock boundary
                formatGaugeDisplay(raw) {
                  const n = Number(raw);
                  return Number.isFinite(n) ? { num: n, text: String(n) } : { num: NaN, text: "---" };
                },
                // @ts-ignore -- pre-existing untyped test mock boundary
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
                // @ts-ignore -- pre-existing untyped test mock boundary
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
            // @ts-ignore -- pre-existing untyped test mock boundary
            applyFormatter(value) {
              return String(value);
            }
          }
        }
      })
    );

    const theme = { colors: { warning: "#123456", alarm: "#654321" } };
    const axis = { min: 0, max: 35 };

    [null, undefined, "", "   "].forEach(function (rawThreshold) {
      expect(
        // @ts-ignore -- pre-existing untyped test mock boundary
        captured.buildSectors(
          {
            tempLinearWarningFrom: rawThreshold,
            tempLinearAlarmFrom: rawThreshold
          },
          0,
          35,
          axis,
          {},
          theme
        )
      ).toEqual([]);
    });

    expect(
      // @ts-ignore -- pre-existing untyped test mock boundary
      captured.buildSectors(
        {
          tempLinearWarningFrom: 28,
          tempLinearAlarmFrom: 32
        },
        0,
        35,
        axis,
        {},
        theme
      )
    ).toEqual([
      { from: 28, to: 32, color: "#123456" },
      { from: 32, to: 35, color: "#654321" }
    ]);
  });
});
