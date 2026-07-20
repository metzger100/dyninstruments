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
  it("uses placeholder text for missing input on the default formatDisplay fallback", function () {
    const textLayoutCalls = [];
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
            drawModeText(state, display) {
              textLayoutCalls.push({ state, display });
            }
          };
        }
      },
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      GeometryScale: geometryScale
    };
    const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
      .create({}, makeComponentContext(modules))
      .createRenderer({
        rawValueKey: "speed",
        unitDefault: "kn",
        rangeDefaults: { min: 0, max: 30 },
        ratioProps: {
          normal: "speedRadialRatioThresholdNormal",
          flat: "speedRadialRatioThresholdFlat"
        },
        hideTextualMetricsProp: "speedRadialHideTextualMetrics",
        ratioDefaults: { normal: 1.1, flat: 3.5 },
        tickSteps() {
          return { major: 10, minor: 2 };
        },
        buildSectors() {
          return [];
        }
      });

    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D()
    });
    [null, undefined, "", "   "].forEach(function (rawSpeed) {
      renderer(canvas, {
        speed: rawSpeed,
        default: "---",
        caption: "SPD",
        unit: "kn"
      });

      expect(textLayoutCalls.length).toBeGreaterThan(0);
      expect(textLayoutCalls[textLayoutCalls.length - 1].display.valueText).toBe("---");
    });

    renderer(canvas, {
      speed: "4.2",
      default: "---",
      caption: "SPD",
      unit: "kn"
    });
    expect(textLayoutCalls.length).toBeGreaterThan(0);
    expect(textLayoutCalls[textLayoutCalls.length - 1].display.valueText).toBe("4.2");
  });
});
