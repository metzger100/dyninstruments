// @ts-check
const { createComponentContextMock, loadFresh } = require("./VoltageLinearWidget-setup");

describe("VoltageLinearWidget", function () {
  it("treats blank and missing low-end thresholds as unset", function () {
    /** @typedef {{ buildSectors: (props: Record<string, unknown>, min: number, max: number, axis: { min: number, max: number }, valueApi: Record<string, unknown>, theme: { colors: { warning: string, alarm: string } }) => unknown[] }} SectorConfig */
    /** @type {SectorConfig | undefined} */
    let captured;

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
                /** @param {unknown} raw */
                formatGaugeDisplay(raw) {
                  const n = Number(raw);
                  return Number.isFinite(n) ? { num: n, text: String(n) } : { num: NaN, text: "---" };
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
      throw new Error("Expected the voltage-linear sectors configuration.");
    }
    const sectorConfig = captured;

    const theme = { colors: { warning: "#123456", alarm: "#654321" } };
    const axis = { min: 10, max: 15 };

    [null, undefined, "", "   "].forEach(function (rawThreshold) {
      expect(
        sectorConfig.buildSectors(
          {
            voltageLinearWarningEnabled: true,
            voltageLinearAlarmEnabled: true,
            voltageLinearWarningFrom: rawThreshold,
            voltageLinearAlarmFrom: rawThreshold
          },
          10,
          15,
          axis,
          {},
          theme
        )
      ).toEqual([]);
    });

    expect(
      sectorConfig.buildSectors(
        {
          voltageLinearWarningEnabled: true,
          voltageLinearAlarmEnabled: true,
          voltageLinearWarningFrom: 12.2,
          voltageLinearAlarmFrom: 11.6
        },
        10,
        15,
        axis,
        {},
        theme
      )
    ).toEqual([
      { from: 10, to: 11.6, color: "#654321" },
      { from: 11.6, to: 12.2, color: "#123456" }
    ]);
  });
});
