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
  it("matches callback-visible layout state with or without wrapper-owned ratioDefaults when config thresholds are present", function () {
    // @ts-ignore -- pre-existing untyped test mock boundary
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
              // @ts-ignore -- pre-existing untyped test mock boundary
              drawModeText(state) {
                capturedState = {
                  mode: state.layout.mode,
                  labelFontPx: state.layout.labels.fontPx,
                  ringW: state.geom.ringW,
                  pointerDepth: state.geom.pointerDepth,
                  pointerSide: state.geom.pointerSide,
                  textFillScale: state.textFillScale
                };
              }
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
        .createRenderer(Object.assign({}, makeBaseSpec(), specOverrides || {}));

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

      return capturedState;
    }

    expect(
      captureState({
        ratioDefaults: { normal: 1.1, flat: 3.5 }
      })
    ).toEqual(captureState());
  });
});
