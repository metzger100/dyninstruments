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
      // @ts-ignore -- pre-existing untyped test mock boundary
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
      // @ts-ignore -- pre-existing untyped test mock boundary
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
      // @ts-ignore -- pre-existing untyped test mock boundary
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      // @ts-ignore -- pre-existing untyped test mock boundary
      GeometryScale: geometryScale
    };
    const spec = makeBaseSpec();
    // @ts-ignore -- pre-existing untyped test mock boundary
    delete spec.rangeDefaults;
    // @ts-ignore -- pre-existing untyped test mock boundary
    spec.buildSectors = function (props, minV, maxV) {
      capturedRange = { min: minV, max: maxV };
      return [];
    };
    // @ts-ignore -- pre-existing untyped test mock boundary
    const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
      .create({}, makeComponentContext(modules))
      .createRenderer(spec);

    renderer(
      // @ts-ignore -- pre-existing untyped test mock boundary
      createMockCanvas({
        rectWidth: 300,
        rectHeight: 300,
        // @ts-ignore -- pre-existing untyped test mock boundary
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
