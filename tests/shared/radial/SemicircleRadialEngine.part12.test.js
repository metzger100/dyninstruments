// @ts-nocheck
const {
  makeThemeDefaults,
  makeComponentContext,
  createCanvas,
  createBaseSequence,
  createValueMath,
  makeBaseSpec,
  createRenderHarness
} = require("./SemicircleRadialEngine.harness");

describe("SemicircleRadialEngine", function () {
  it("renders disconnected state-screen before gauge drawing", function () {
    const layoutCalls = { computeMode: 0 };
    const drawCalls = { arc: 0, modeText: 0 };
    const modules = {
      RadialToolkit: {
        create() {
          return {
            theme: {
              resolveForRoot() {
                return makeThemeDefaults({
                  colors: { pointer: "#3366cc" },
                  font: { labelWeight: 650 }
                });
              }
            },
            text: {},
            value: createValueMath(),
            draw: {
              drawArcRing() {
                drawCalls.arc += 1;
              },
              drawAnnularSector() {},
              drawPointerAtRim() {},
              drawTicksFromAngles() {},
              drawLabels() {}
            }
          };
        }
      },
      SemicircleRadialLayout: {
        create() {
          return {
            computeMode() {
              layoutCalls.computeMode += 1;
              return "normal";
            },
            computeInsets() {
              return { responsive: { textFillScale: 1 } };
            },
            computeLayout() {
              throw new Error("layout should not run for disconnected state-screen");
            }
          };
        }
      },
      SemicircleRadialTextLayout: {
        create() {
          return {
            createFitCache() {
              return {};
            },
            drawModeText() {
              drawCalls.modeText += 1;
            }
          };
        }
      }
    };
    const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
      .create({}, makeComponentContext(modules))
      .createRenderer(makeBaseSpec());
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx: ctx
    });

    renderer(canvas, {
      disconnect: true,
      value: 12.3,
      caption: "SPD",
      unit: "kn"
    });

    expect(layoutCalls.computeMode).toBe(0);
    expect(drawCalls.arc).toBe(0);
    expect(drawCalls.modeText).toBe(0);
    expect(ctx.calls.filter((entry) => entry.name === "fillText").map((entry) => String(entry.args[0]))).toContain(
      "GPS Lost"
    );
  });
});
