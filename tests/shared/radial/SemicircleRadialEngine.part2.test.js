const {
  makeThemeDefaults,
  makeComponentContext,
  createCanvas,
  createBaseSequence,
  createValueMath,
  makeBaseSpec,
  createRenderHarness,
} = require("./SemicircleRadialEngine.harness");

describe("SemicircleRadialEngine", function () {
  it("renders with ValueMath on RadialToolkit.value without requiring RadialValueMath methods", function () {
    const pointerCalls = [];
    const tickCalls = [];
    const baseValueMath = loadFresh(
      "shared/widget-kits/value/ValueMath.js",
    ).create({}, createComponentContextMock());
    const angleMath = loadFresh(
      "shared/widget-kits/radial/RadialAngleMath.js",
    ).create({}, createComponentContextMock());
    const modules = {
      RadialToolkit: {
        create() {
          return {
            theme: {
              resolveForRoot() {
                return makeThemeDefaults();
              },
            },
            text: {
              drawDisconnectOverlay() {},
            },
            value: baseValueMath,
            angle: angleMath,
            draw: {
              drawArcRing() {},
              drawAnnularSector() {},
              drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts) {
                pointerCalls.push(opts);
              },
              drawTicksFromAngles(ctx, cx, cy, rOuter, ticks, opts) {
                tickCalls.push(opts);
              },
              drawLabels() {},
            },
          };
        },
      },
      SemicircleRadialLayout: loadFresh(
        "shared/widget-kits/radial/SemicircleRadialLayout.js",
      ),
      SemicircleRadialTextLayout: {
        create() {
          return {
            createFitCache() {
              return {};
            },
            drawModeText() {},
          };
        },
      },
      ResponsiveScaleProfile: loadFresh(
        "shared/widget-kits/layout/ResponsiveScaleProfile.js",
      ),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      GeometryScale: geometryScale,
    };
    const renderer = loadFresh(
      "shared/widget-kits/radial/SemicircleRadialEngine.js",
    )
      .create({}, makeComponentContext(modules))
      .createRenderer(makeBaseSpec());

    renderer(
      createMockCanvas({
        rectWidth: 480,
        rectHeight: 110,
        ctx: createMockContext2D(),
      }),
      {
        value: 12.3,
        caption: "SPD",
        unit: "kn",
      },
    );

    expect(pointerCalls).toHaveLength(1);
    expect(tickCalls).toHaveLength(1);
  });

});
