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
  it("keeps default radial pointer sizing independent from ring width changes", function () {
    // @ts-ignore -- pre-existing untyped test mock boundary
    function renderPointer(ringWidthFactor) {
      // @ts-ignore -- pre-existing untyped test mock boundary
      const pointerCalls = [];
      const gaugeValueMath = createValueMath();
      const themeDefaults = makeThemeDefaults();
      themeDefaults.radial.ring.widthFactor = ringWidthFactor;
      const modules = {
        RadialToolkit: {
          create() {
            return {
              theme: {
                resolveForRoot() {
                  return themeDefaults;
                }
              },
              text: {
                drawDisconnectOverlay() {}
              },
              value: gaugeValueMath,
              draw: {
                drawArcRing() {},
                drawAnnularSector() {},
                // @ts-ignore -- pre-existing untyped test mock boundary
                drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts) {
                  pointerCalls.push(opts);
                },
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
      // @ts-ignore -- pre-existing untyped test mock boundary
      const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
        .create({}, makeComponentContext(modules))
        .createRenderer(makeBaseSpec());

      renderer(
        // @ts-ignore -- pre-existing untyped test mock boundary
        createMockCanvas({
          rectWidth: 480,
          rectHeight: 110,
          // @ts-ignore -- pre-existing untyped test mock boundary
          ctx: createMockContext2D()
        }),
        {
          value: 12.3,
          caption: "SPD",
          unit: "kn"
        }
      );

      // @ts-ignore -- pre-existing untyped test mock boundary
      return pointerCalls[0];
    }

    const thinPointer = renderPointer(0.1);
    const thickPointer = renderPointer(0.24);

    expect(thinPointer.depth).toBe(thickPointer.depth);
    expect(thinPointer.halfWidth).toBe(thickPointer.halfWidth);
    expect(thinPointer.fillStyle).toBe(thickPointer.fillStyle);
  });
});
