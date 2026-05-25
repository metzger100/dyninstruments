const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

describe("TemperatureLinearWidget", function () {
  it("treats blank and missing high-end thresholds as unset", function () {
    let captured;

    loadFresh(
      "widgets/linear/TemperatureLinearWidget/TemperatureLinearWidget.js",
    ).create(
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
                },
              };
            },
          },
          ValueMath: {
            create() {
              return {
                formatGaugeDisplay(raw) {
                  const n = Number(raw);
                  return Number.isFinite(n)
                    ? { num: n, text: String(n) }
                    : { num: NaN, text: "---" };
                },
                clamp(v, lo, hi) {
                  return Math.max(lo, Math.min(hi, Number(v)));
                },
                resolveTemperatureTickSteps() {
                  return { major: 10, minor: 2 };
                },
              };
            },
          },
          LinearGaugeEngine: {
            create() {
              return {
                createRenderer(cfg) {
                  captured = cfg;
                  return function () {};
                },
              };
            },
          },
        },
        services: {
          format: {
            applyFormatter(value) {
              return String(value);
            },
          },
        },
      }),
    );

    const theme = { colors: { warning: "#123456", alarm: "#654321" } };
    const axis = { min: 0, max: 35 };

    [null, undefined, "", "   "].forEach(function (rawThreshold) {
      expect(
        captured.buildSectors(
          {
            tempLinearWarningFrom: rawThreshold,
            tempLinearAlarmFrom: rawThreshold,
          },
          0,
          35,
          axis,
          {},
          theme,
        ),
      ).toEqual([]);
    });

    expect(
      captured.buildSectors(
        {
          tempLinearWarningFrom: 28,
          tempLinearAlarmFrom: 32,
        },
        0,
        35,
        axis,
        {},
        theme,
      ),
    ).toEqual([
      { from: 28, to: 32, color: "#123456" },
      { from: 32, to: 35, color: "#654321" },
    ]);
  });
});
