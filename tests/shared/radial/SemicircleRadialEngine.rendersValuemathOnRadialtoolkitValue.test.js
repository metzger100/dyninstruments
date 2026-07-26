// @ts-check
const {
  makeThemeDefaults,
  makeComponentContext,
  makeBaseSpec,
  loadFresh,
  geometryScale,
  createMockCanvas,
  createMockContext2D,
  createComponentContextMock
} = require("./SemicircleRadialEngine.harness");

describe("SemicircleRadialEngine", function () {
  it("renders with ValueMath on RadialToolkit.value without requiring RadialValueMath methods", function () {
    // @ts-ignore -- pre-existing untyped test mock boundary
    const pointerCalls = [];
    // @ts-ignore -- pre-existing untyped test mock boundary
    const tickCalls = [];
    // @ts-ignore -- pre-existing untyped test mock boundary
    const baseValueMath = loadFresh("shared/widget-kits/value/ValueMath.js").create({}, createComponentContextMock());
    // @ts-ignore -- pre-existing untyped test mock boundary
    const angleMath = loadFresh("shared/widget-kits/radial/RadialAngleMath.js").create(
      {},
      // @ts-ignore -- pre-existing untyped test mock boundary
      createComponentContextMock()
    );
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
            value: baseValueMath,
            angle: angleMath,
            draw: {
              drawArcRing() {},
              drawAnnularSector() {},
              // @ts-ignore -- pre-existing untyped test mock boundary
              drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts) {
                pointerCalls.push(opts);
              },
              // @ts-ignore -- pre-existing untyped test mock boundary
              drawTicksFromAngles(ctx, cx, cy, rOuter, ticks, opts) {
                tickCalls.push(opts);
              },
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
    expect(pointerCalls).toHaveLength(1);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(tickCalls).toHaveLength(1);
  });
});
