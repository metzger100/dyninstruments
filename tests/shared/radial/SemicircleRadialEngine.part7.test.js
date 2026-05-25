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
  it("matches callback-visible layout state with or without wrapper-owned ratioDefaults when config thresholds are present", function () {
    function captureState(specOverrides) {
      let capturedState = null;
      const themeDefaults = makeThemeDefaults();
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
              value: createValueMath(),
              draw: {
                drawArcRing() {},
                drawAnnularSector() {},
                drawPointerAtRim() {},
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
              drawModeText(state) {
                capturedState = {
                  mode: state.layout.mode,
                  labelFontPx: state.layout.labels.fontPx,
                  ringW: state.geom.ringW,
                  pointerDepth: state.geom.pointerDepth,
                  pointerSide: state.geom.pointerSide,
                  textFillScale: state.textFillScale,
                };
              },
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
        .createRenderer(Object.assign({}, makeBaseSpec(), specOverrides || {}));

      renderer(
        createMockCanvas({
          rectWidth: 300,
          rectHeight: 300,
          ctx: createMockContext2D(),
        }),
        {
          value: 12.3,
          caption: "SPD",
          unit: "kn",
          speedRadialRatioThresholdNormal: 1.1,
          speedRadialRatioThresholdFlat: 3.5,
        },
      );

      return capturedState;
    }

    expect(
      captureState({
        ratioDefaults: { normal: 1.1, flat: 3.5 },
      }),
    ).toEqual(captureState());
  });

});
