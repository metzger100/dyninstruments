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
  it("delegates text rendering through SemicircleRadialTextLayout and preserves explicit falsy text props", function () {
    const drawModeText = vi.fn();
    const layoutCalls = {
      computeMode: 0,
      computeInsets: 0,
      computeLayout: 0
    };
    const layoutSnapshot = {
      mode: "normal",
      responsive: { textFillScale: 1.15 },
      textFillScale: 1.15,
      geom: {
        cx: 60,
        cy: 60,
        rOuter: 50,
        ringW: 12,
        majorTickLen: 4,
        majorTickWidth: 1,
        minorTickLen: 2,
        minorTickWidth: 1,
        arcLineWidth: 1,
        pointerDepth: 10,
        pointerSide: 5
      },
      labels: {
        radiusOffset: 20,
        fontPx: 12
      },
      flat: {
        box: { x: 0, y: 0, w: 0, h: 0 },
        topBox: { x: 0, y: 0, w: 0, h: 0 },
        bottomBox: { x: 0, y: 0, w: 0, h: 0 }
      },
      high: { bandBox: { x: 0, y: 0, w: 0, h: 0 } },
      normal: { rSafe: 20, yBottom: 52, mhMax: 18, mhMin: 12 }
    };
    const modules = {
      RadialToolkit: {
        create() {
          return {
            theme: {
              resolveForRoot() {
                return makeThemeDefaults({
                  colors: {
                    pointer: "#3366cc"
                  }
                });
              }
            },
            text: {
              drawDisconnectOverlay() {}
            },
            value: createValueMath(),
            draw: {
              drawArcRing() {},
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
              layoutCalls.computeInsets += 1;
              return { pad: 1, gap: 1, responsive: { textFillScale: 1.15 } };
            },
            computeLayout() {
              layoutCalls.computeLayout += 1;
              return layoutSnapshot;
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
            drawModeText: drawModeText
          };
        }
      }
    };
    const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
      .create({}, makeComponentContext(modules))
      .createRenderer(makeBaseSpec());

    renderer(
      createMockCanvas({
        rectWidth: 220,
        rectHeight: 140,
        ctx: createMockContext2D()
      }),
      {
        value: 12.3,
        caption: 0,
        unit: ""
      }
    );

    expect(layoutCalls.computeMode).toBe(1);
    expect(layoutCalls.computeInsets).toBe(1);
    expect(layoutCalls.computeLayout).toBe(1);
    expect(drawModeText).toHaveBeenCalledTimes(1);
    expect(drawModeText.mock.calls[0][0].layout).toBe(layoutSnapshot);
    expect(drawModeText.mock.calls[0][0].textFillScale).toBe(1.15);
    expect(drawModeText.mock.calls[0][1]).toEqual({
      caption: 0,
      valueText: "12.3",
      unit: "",
      secScale: 0.3,
      hideTextualMetrics: false
    });
  });
});
