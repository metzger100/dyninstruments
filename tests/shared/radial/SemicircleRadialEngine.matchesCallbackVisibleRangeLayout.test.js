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
  it("matches callback-visible range and layout state with or without wrapper-owned rangeDefaults when config bounds are present", function () {
    // @ts-ignore -- pre-existing untyped test mock boundary
    function captureState(includeRangeDefaults) {
      let capturedState = null;
      let capturedRange = null;
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
      const spec = makeBaseSpec();
      if (!includeRangeDefaults) {
        // @ts-ignore -- pre-existing untyped test mock boundary
        delete spec.rangeDefaults;
      }
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
          minValue: 4,
          maxValue: 44,
          speedRadialRatioThresholdNormal: 1.1,
          speedRadialRatioThresholdFlat: 3.5
        }
      );

      return {
        state: capturedState,
        range: capturedRange
      };
    }

    expect(captureState(true)).toEqual(captureState(false));
  });
});
