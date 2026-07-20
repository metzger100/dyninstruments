const {
  makeThemeDefaults,
  makeComponentContext,
  createValueMath,
  createLayoutModule,
  makeBaseSpec
} = require("./SemicircleRadialEngine.harness");
const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

const geometryScale = loadFresh("shared/widget-kits/layout/GeometryScale.js");

describe("SemicircleRadialEngine", function () {
  it("resolves theme once and applies tokenized geometry and label metrics from the layout owner", function () {
    const pointerCalls = /** @type {any[]} */ ([]);
    const tickCalls = /** @type {any[]} */ ([]);
    const labelCalls = /** @type {any[]} */ ([]);
    const arcRingCalls = /** @type {any[]} */ ([]);
    const buildSectorsCalls = /** @type {any[]} */ ([]);
    const themeDefaults = makeThemeDefaults();
    const resolveTheme = vi.fn(function () {
      return themeDefaults;
    });
    const gaugeValueMath = createValueMath();
    const gaugeToolkit = {
      create() {
        return {
          theme: { resolveForRoot: resolveTheme },
          text: {
            drawDisconnectOverlay() {}
          },
          value: gaugeValueMath,
          draw: {
            drawArcRing(
              /** @type {any} */ ctx,
              /** @type {any} */ cx,
              /** @type {any} */ cy,
              /** @type {any} */ rOuter,
              /** @type {any} */ startDeg,
              /** @type {any} */ endDeg,
              /** @type {any} */ opts
            ) {
              arcRingCalls.push(opts);
            },
            drawAnnularSector() {},
            drawPointerAtRim(
              /** @type {any} */ ctx,
              /** @type {any} */ cx,
              /** @type {any} */ cy,
              /** @type {any} */ rOuter,
              /** @type {any} */ angleDeg,
              /** @type {any} */ opts
            ) {
              pointerCalls.push(opts);
            },
            drawTicksFromAngles(
              /** @type {any} */ ctx,
              /** @type {any} */ cx,
              /** @type {any} */ cy,
              /** @type {any} */ rOuter,
              /** @type {any} */ ticks,
              /** @type {any} */ opts
            ) {
              tickCalls.push(opts);
            },
            drawLabels(
              /** @type {any} */ ctx,
              /** @type {any} */ cx,
              /** @type {any} */ cy,
              /** @type {any} */ rOuter,
              /** @type {any} */ opts
            ) {
              labelCalls.push(opts);
            }
          }
        };
      }
    };
    const textLayoutCalls = /** @type {any[]} */ ([]);
    const modules = {
      RadialToolkit: gaugeToolkit,
      SemicircleRadialLayout: loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js"),
      SemicircleRadialTextLayout: {
        create() {
          return {
            createFitCache() {
              return {};
            },
            drawModeText(/** @type {any} */ state, /** @type {any} */ display) {
              textLayoutCalls.push({ state, display });
            }
          };
        }
      },
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      GeometryScale: geometryScale
    };
    const helpers = makeComponentContext(modules);
    const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
      .create({}, helpers)
      .createRenderer({
        ...makeBaseSpec(),
        buildSectors(
          /** @type {any} */ props,
          /** @type {any} */ minV,
          /** @type {any} */ maxV,
          /** @type {any} */ arc,
          /** @type {any} */ valueUtils,
          /** @type {any} */ theme
        ) {
          buildSectorsCalls.push({ props, minV, maxV, arc, valueUtils, theme });
          return [];
        }
      });

    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D()
    });

    renderer(canvas, {
      value: 12.3,
      caption: "SPD",
      unit: "kn"
    });

    const layoutApi = createLayoutModule();
    const insets = layoutApi.computeInsets(480, 110);
    const expectedLayout = layoutApi.computeLayout({
      W: 480,
      H: 110,
      mode: "flat",
      theme: themeDefaults,
      insets: insets,
      responsive: insets.responsive
    });

    expect(resolveTheme).toHaveBeenCalledTimes(1);
    expect(resolveTheme).toHaveBeenCalledWith(canvas);
    expect(buildSectorsCalls[0].theme).toBe(themeDefaults);
    expect(pointerCalls[0].fillStyle).toBe(themeDefaults.colors.pointer);
    expect(pointerCalls[0].depth).toBe(expectedLayout.geom.pointerDepth);
    expect(pointerCalls[0].halfWidth).toBe(Math.max(1, Math.floor(expectedLayout.geom.pointerSide / 2)));
    expect(arcRingCalls[0].lineWidth).toBe(expectedLayout.geom.arcLineWidth);
    expect(tickCalls[0].major).toEqual({
      len: expectedLayout.geom.majorTickLen,
      width: expectedLayout.geom.majorTickWidth
    });
    expect(tickCalls[0].minor).toEqual({
      len: expectedLayout.geom.minorTickLen,
      width: expectedLayout.geom.minorTickWidth
    });
    expect(labelCalls[0].radiusOffset).toBe(expectedLayout.labels.radiusOffset);
    expect(labelCalls[0].fontPx).toBe(expectedLayout.labels.fontPx);
    expect(labelCalls[0].weight).toBe(themeDefaults.font.labelWeight);
    expect(textLayoutCalls).toHaveLength(1);
    expect(textLayoutCalls[0].state.layout.mode).toBe("flat");
  });
});
