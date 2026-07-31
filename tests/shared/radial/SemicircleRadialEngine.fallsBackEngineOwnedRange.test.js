// @ts-check
const {
  makeThemeDefaults,
  makeComponentContext,
  createValueMath,
  makeBaseSpec,
  loadFresh,
  geometryScale,
  createMockCanvas,
  createMockContext2D
} = require("./SemicircleRadialEngine.harness");

/**
 * @typedef {{ buildSectors?: (props: Record<string, unknown>, min: number, max: number) => unknown[], rangeDefaults?: { max: number, min: number } }} SemicircleSpec
 */

describe("SemicircleRadialEngine", function () {
  it("falls back to engine-owned range defaults when range props are absent", function () {
    let capturedRange = null;
    const modules = {
      RadialToolkit: {
        create() {
          return {
            theme: {
              resolveForRoot() {
                return makeThemeDefaults();
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
      SemicircleRadialLayout: loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js"),
      SemicircleRadialTextLayout: {
        create() {
          return {
            createFitCache() {
              return {};
            },
            drawModeText() {}
          };
        }
      },
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      GeometryScale: geometryScale
    };
    const spec = /** @type {SemicircleSpec} */ (makeBaseSpec());
    delete spec.rangeDefaults;
    spec.buildSectors = function (props, minV, maxV) {
      capturedRange = { min: minV, max: maxV };
      return [];
    };
    const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
      .create({}, makeComponentContext(modules))
      .createRenderer(spec);

    renderer(
      createMockCanvas({
        rectWidth: 300,
        rectHeight: 300,
        ctx: createMockContext2D()
      }),
      {
        value: 12.3,
        caption: "SPD",
        unit: "kn",
        speedRadialRatioThresholdNormal: 1.1,
        speedRadialRatioThresholdFlat: 3.5
      }
    );

    expect(capturedRange).toEqual({ min: 0, max: 30 });
  });
});
