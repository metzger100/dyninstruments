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
  it("keeps default radial pointer sizing independent from ring width changes", function () {
    function renderPointer(ringWidthFactor) {
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
                },
              },
              text: {
                drawDisconnectOverlay() {},
              },
              value: gaugeValueMath,
              draw: {
                drawArcRing() {},
                drawAnnularSector() {},
                drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts) {
                  pointerCalls.push(opts);
                },
                drawTicksFromAngles() {},
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
        LayoutRectMath: loadFresh(
          "shared/widget-kits/layout/LayoutRectMath.js",
        ),
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

      return pointerCalls[0];
    }

    const thinPointer = renderPointer(0.1);
    const thickPointer = renderPointer(0.24);

    expect(thinPointer.depth).toBe(thickPointer.depth);
    expect(thinPointer.halfWidth).toBe(thickPointer.halfWidth);
    expect(thinPointer.fillStyle).toBe(thickPointer.fillStyle);
  });

});
