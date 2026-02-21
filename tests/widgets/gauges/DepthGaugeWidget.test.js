const { loadFresh } = require("../../helpers/load-umd");

describe("DepthGaugeWidget", function () {
  it("builds low-end sectors with alarm and warning order", function () {
    let captured;
    let receivedOptions;
    const renderCanvas = vi.fn();

    const mod = loadFresh("widgets/gauges/DepthGaugeWidget/DepthGaugeWidget.js");
    const spec = mod.create({}, {
      getModule(id) {
        if (id === "GaugeValueMath") {
          return {
            create() {
              return {
                extractNumberText(text) {
                  const match = String(text).match(/-?\d+(?:\.\d+)?/);
                  return match ? match[0] : "";
                },
                buildLowEndSectors(props, minV, maxV, arc, options) {
                  receivedOptions = options;
                  return [
                    { a0: 0, a1: 2, color: options.theme.colors.alarm },
                    { a0: 2, a1: 5, color: options.theme.colors.warning }
                  ];
                }
              };
            }
          };
        }
        if (id !== "SemicircleGaugeEngine") throw new Error("unexpected module: " + id);
        return {
          create() {
            return {
              createRenderer(cfg) {
                captured = cfg;
                return renderCanvas;
              }
            };
          }
        };
      }
    });

    expect(spec.renderCanvas).toBe(renderCanvas);

    const theme = {
      colors: {
        warning: "#123456",
        alarm: "#654321"
      }
    };
    const sectors = captured.buildSectors({ alarmFrom: 2, warningFrom: 5 }, 0, 30, {}, {}, theme);

    expect(sectors).toEqual([
      { a0: 0, a1: 2, color: "#654321" },
      { a0: 2, a1: 5, color: "#123456" }
    ]);
    expect(receivedOptions.theme).toBe(theme);
  });
});
