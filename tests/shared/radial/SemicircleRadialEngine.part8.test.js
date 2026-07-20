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
  it("matches callback-visible range and layout state with or without wrapper-owned rangeDefaults when config bounds are present", function () {
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
        SemicircleRadialLayout: loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js"),
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
                  textFillScale: state.textFillScale
                };
              }
            };
          }
        },
        ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
        GeometryScale: geometryScale
      };
      const spec = makeBaseSpec();
      if (!includeRangeDefaults) {
        delete spec.rangeDefaults;
      }
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
