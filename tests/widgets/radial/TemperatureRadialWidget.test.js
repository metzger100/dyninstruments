const { loadFresh } = require("../../helpers/load-umd");

describe("TemperatureRadialWidget", function () {
  it("does not apply Kelvin fallback on raw formatter passthrough", function () {
    let captured;
    const renderCanvas = vi.fn();
    const applyFormatter = vi.fn((value) => String(value));
    const resolveTemperatureSemicircleTickSteps = vi.fn((range) => {
      if (range <= 8) return { major: 1, minor: 0.5 };
      if (range <= 100) return { major: 10, minor: 2 };
      return { major: 50, minor: 10 };
    });

    const mod = loadFresh("widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js");
    const spec = mod.create({}, {
      applyFormatter,
      getModule(id) {
        if (id === "RadialValueMath") {
          return {
            create() {
              return {
                extractNumberText(text) {
                  const match = String(text).match(/-?\d+(?:\.\d+)?/);
                  return match ? match[0] : "";
                },
                buildHighEndSectors() {
                  return [];
                },
                resolveTemperatureSemicircleTickSteps
              };
            }
          };
        }
        if (id !== "SemicircleRadialEngine") throw new Error("unexpected module: " + id);
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
    expect(captured.tickSteps(8)).toEqual({ major: 1, minor: 0.5 });
    expect(captured.tickSteps(100)).toEqual({ major: 10, minor: 2 });
    expect(resolveTemperatureSemicircleTickSteps).toHaveBeenCalledTimes(2);
    const display = captured.formatDisplay(300, {
      formatter: "formatTemperature",
      formatterParameters: ["celsius"]
    });
    expect(display).toEqual({ num: 300, text: "300.0" });
    expect(applyFormatter).toHaveBeenCalledWith(300, expect.objectContaining({
      formatter: "formatTemperature"
    }));
  });

  it("returns default text when formatter output is not parseable", function () {
    let captured;
    const renderCanvas = vi.fn();

    const mod = loadFresh("widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js");
    mod.create({}, {
      applyFormatter() {
        return "not-a-number";
      },
      getModule(id) {
        if (id === "RadialValueMath") {
          return {
            create() {
              return {
                extractNumberText(text) {
                  const match = String(text).match(/-?\d+(?:\.\d+)?/);
                  return match ? match[0] : "";
                },
                buildHighEndSectors() {
                  return [];
                },
                resolveTemperatureSemicircleTickSteps() {
                  return { major: 10, minor: 2 };
                }
              };
            }
          };
        }
        if (id !== "SemicircleRadialEngine") throw new Error("unexpected module: " + id);
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

    expect(captured.formatDisplay(300, {
      formatter: "formatTemperature",
      formatterParameters: ["celsius"]
    })).toEqual({ num: NaN, text: "---" });
  });
});
