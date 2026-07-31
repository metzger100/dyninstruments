// @ts-check
const { createComponentContextMock, loadFresh } = require("./TemperatureLinearWidget-setup");

describe("TemperatureLinearWidget", function () {
  it("treats blank and missing high-end thresholds as unset", function () {
    /** @typedef {{ buildSectors: (props: Record<string, unknown>, min: number, max: number, axis: { min: number, max: number }, valueApi: Record<string, unknown>, theme: { colors: { warning: string, alarm: string } }) => unknown[] }} SectorConfig */
    /** @type {SectorConfig | undefined} */
    let captured;

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
                /** @param {unknown} raw */
                formatGaugeDisplay(raw) {
                  const n = Number(raw);
                  return Number.isFinite(n) ? { num: n, text: String(n) } : { num: NaN, text: "---" };
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

    if (!captured) {
      throw new Error("Expected the temperature-linear sectors configuration.");
    }
    const sectorConfig = captured;

    const theme = { colors: { warning: "#123456", alarm: "#654321" } };
    const axis = { min: 0, max: 35 };

    [null, undefined, "", "   "].forEach(function (rawThreshold) {
      expect(
        sectorConfig.buildSectors(
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
      sectorConfig.buildSectors(
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
