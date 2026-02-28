const { loadFresh } = require("../../helpers/load-umd");

describe("DepthGaugeWidget", function () {
  it("builds low-end sectors with alarm and warning order", function () {
    let captured;
    let receivedOptions;
    const resolveStandardSemicircleTickSteps = vi.fn((range) => {
      if (range <= 6) return { major: 1, minor: 0.5 };
      if (range <= 30) return { major: 5, minor: 1 };
      return { major: 50, minor: 10 };
    });
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
                    { a0: 0, a1: 2, color: options.alarmColor },
                    { a0: 2, a1: 5, color: options.warningColor }
                  ];
                },
                resolveStandardSemicircleTickSteps
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
    expect(captured.tickSteps(6)).toEqual({ major: 1, minor: 0.5 });
    expect(captured.tickSteps(30)).toEqual({ major: 5, minor: 1 });
    expect(resolveStandardSemicircleTickSteps).toHaveBeenCalledTimes(2);

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
    expect(receivedOptions.warningColor).toBe(theme.colors.warning);
    expect(receivedOptions.alarmColor).toBe(theme.colors.alarm);
  });
});
