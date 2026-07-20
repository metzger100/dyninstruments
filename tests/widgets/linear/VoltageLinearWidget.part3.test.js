// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("VoltageLinearWidget", function () {
  it("treats blank and missing low-end thresholds as unset", function () {
    let captured;

    loadFresh("widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js").create(
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
    const axis = { min: 10, max: 15 };

    [null, undefined, "", "   "].forEach(function (rawThreshold) {
      expect(
        captured.buildSectors(
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
      captured.buildSectors(
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
