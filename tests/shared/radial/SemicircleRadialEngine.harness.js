const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

/**
 * @typedef {{
 *   sectorAngles: (from: unknown, to: unknown, minV: number, maxV: number, arc: DyniHarnessArc) => ({ a0: number, a1: number } | null),
 *   buildHighEndSectors: (props: Record<string, unknown> | undefined, minV: number, maxV: number, arc: DyniHarnessArc, options?: Record<string, unknown>) => DyniHarnessColoredAngleRange[],
 *   buildLowEndSectors: (props: Record<string, unknown> | undefined, minV: number, maxV: number, arc: DyniHarnessArc, options?: Record<string, unknown>) => DyniHarnessColoredAngleRange[]
 * }} DyniHarnessSectorMathUtils
 */

/** @typedef {{ startDeg: unknown, endDeg: unknown }} DyniHarnessArc */

/** @typedef {{ a0: number, a1: number, color?: unknown }} DyniHarnessColoredAngleRange */

/** @typedef {{ angleCfg?: unknown, [key: string]: unknown }} DyniHarnessDrawOptions */

/** @typedef {{ majors: number[], minors: number[] }} DyniHarnessTickAngles */

/** @typedef {(layerCtx: CanvasRenderingContext2D, layerName: string, layerCanvas: HTMLCanvasElement) => void} DyniHarnessLayerRebuildFn */

/**
 * @typedef {{
 *   surface?: Record<string, unknown>,
 *   colors?: Record<string, unknown>,
 *   font?: Record<string, unknown>,
 *   strokeWeight?: unknown,
 *   pointerDepthWeight?: unknown,
 *   pointerSideWeight?: unknown,
 *   radial?: {
 *     ticks?: Record<string, unknown>,
 *     pointer?: Record<string, unknown>,
 *     ring?: Record<string, unknown>,
 *     labels?: Record<string, unknown>
 *   }
 * }} DyniHarnessThemeOverrides
 */

/**
 * @typedef {{
 *   surface: Record<string, unknown>,
 *   colors: Record<string, unknown>,
 *   font: Record<string, unknown>,
 *   strokeWeight: unknown,
 *   pointerDepthWeight: unknown,
 *   pointerSideWeight: unknown,
 *   radial: {
 *     ticks: Record<string, unknown>,
 *     pointer: Record<string, unknown>,
 *     ring: Record<string, unknown>,
 *     labels: Record<string, unknown>
 *   }
 * }} DyniHarnessResolvedTheme
 */

/** @typedef {{ surface?: Record<string, unknown>, font?: Record<string, unknown>, [key: string]: unknown }} DyniHarnessThemeSnapshot */

/**
 * @typedef {{
 *   theme?: { resolveForRoot?: (rootEl: unknown) => DyniHarnessThemeSnapshot },
 *   angle?: unknown,
 *   resolveSurface?: (canvas: HTMLCanvasElement) => unknown,
 *   [key: string]: unknown
 * }} DyniHarnessToolkitInstance
 */

/** @typedef {{ create: (def: unknown, componentContext: unknown) => DyniHarnessToolkitInstance }} DyniHarnessToolkitFactory */

/** @typedef {{ ctx: unknown, W: number, H: number }} DyniHarnessCanvasSetup */

/** @typedef {{ canvas: { setupCanvas(canvas: HTMLCanvasElement): DyniHarnessCanvasSetup | null } }} DyniHarnessComponentContext */

/** @typedef {{ layers?: string[] }} DyniHarnessLayerCacheSpec */

/**
 * @typedef {{
 *   props: Record<string, unknown>,
 *   minV: number,
 *   maxV: number,
 *   arc: DyniHarnessArc,
 *   valueUtils: DyniHarnessSectorMathUtils,
 *   theme: DyniHarnessResolvedTheme
 * }} DyniHarnessBuildSectorsCall
 */

/**
 * @typedef {{
 *   rawValueKey?: string,
 *   unitDefault?: unknown,
 *   rangeDefaults?: { min: number, max: number },
 *   ratioProps?: { normal: string, flat: string },
 *   hideTextualMetricsProp?: unknown,
 *   ratioDefaults?: { normal: number, flat: number },
 *   tickSteps?: (range: number) => { major: unknown, minor: unknown },
 *   formatDisplay?: (raw: unknown) => DyniHarnessFormattedDisplay,
 *   buildSectors?: (
 *     props: Record<string, unknown>,
 *     minV: number,
 *     maxV: number,
 *     arc: DyniHarnessArc,
 *     valueUtils: DyniHarnessSectorMathUtils,
 *     theme: DyniHarnessResolvedTheme
 *   ) => DyniHarnessColoredAngleRange[]
 * }} DyniHarnessRendererSpec
 */

/** @typedef {{ num: unknown, text: string }} DyniHarnessFormattedDisplay */

/** @typedef {Record<string, unknown>} DyniHarnessRenderState */

/** @typedef {Record<string, unknown>} DyniHarnessDisplay */

const geometryScale = loadFresh("shared/widget-kits/layout/GeometryScale.js");

function createValueMath() {
  const valueMod = loadFresh("shared/widget-kits/radial/RadialValueMath.js");
  const baseValueMod = loadFresh("shared/widget-kits/value/ValueMath.js");
  const angleMod = loadFresh("shared/widget-kits/radial/RadialAngleMath.js");
  return valueMod.create(
    {},
    createComponentContextMock({
      modules: {
        ValueMath: baseValueMod,
        RadialAngleMath: angleMod
      }
    })
  );
}

function createLayoutModule() {
  const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
  return loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js").create(
    {},
    createComponentContextMock({
      modules: {
        ResponsiveScaleProfile: responsiveScaleProfile,
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
        GeometryScale: geometryScale
      }
    })
  );
}

/** @returns {DyniHarnessRendererSpec} */
function makeBaseSpec() {
  return {
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
    /** @param {unknown} raw @returns {DyniHarnessFormattedDisplay} */
    formatDisplay(raw) {
      const n = Number(raw);
      return { num: n, text: String(n.toFixed(1)) };
    },
    buildSectors() {
      return [];
    }
  };
}

/**
 * @param {DyniHarnessThemeOverrides} [overrides]
 * @returns {DyniHarnessResolvedTheme}
 */
function makeThemeDefaults(overrides) {
  const extra = overrides || {};
  const radial = extra.radial || {};
  return {
    surface: Object.assign({ fg: "#fff" }, extra.surface || {}),
    colors: Object.assign(
      {
        pointer: "#3366cc",
        warning: "#e0a92e",
        alarm: "#d9534a",
        laylineStb: "#2e9e6b",
        laylinePort: "#d9534a"
      },
      extra.colors || {}
    ),
    font: Object.assign(
      {
        family: "sans-serif",
        weight: 710,
        labelWeight: 680
      },
      extra.font || {}
    ),
    strokeWeight: extra.strokeWeight !== null && extra.strokeWeight !== undefined ? extra.strokeWeight : 1,
    pointerDepthWeight:
      extra.pointerDepthWeight !== null && extra.pointerDepthWeight !== undefined ? extra.pointerDepthWeight : 1,
    pointerSideWeight:
      extra.pointerSideWeight !== null && extra.pointerSideWeight !== undefined ? extra.pointerSideWeight : 1,
    radial: {
      ticks: Object.assign(
        {
          majorLenFactor: 0.08,
          majorWidthFactor: 0.02,
          minorLenFactor: 0.047,
          minorWidthFactor: 0.01
        },
        radial.ticks || {}
      ),
      pointer: Object.assign(
        {
          depthFactor: 0.22,
          sideFactor: 0.11
        },
        radial.pointer || {}
      ),
      ring: Object.assign(
        {
          arcLineWidthFactor: 0.013,
          widthFactor: 0.18
        },
        radial.ring || {}
      ),
      labels: Object.assign(
        {
          insetFactor: 2.2,
          fontFactor: 0.2
        },
        radial.labels || {}
      )
    }
  };
}

/** @param {Record<string, unknown>} modules */
function makeComponentContext(modules) {
  const fallbackAngleMath = loadFresh("shared/widget-kits/radial/RadialAngleMath.js").create(
    {},
    createComponentContextMock()
  );

  /**
   * @param {unknown} toolkit
   * @returns {unknown}
   */
  function withCanonicalThemeTokens(toolkit) {
    const candidate = /** @type {{ create?: unknown } | null | undefined} */ (toolkit);
    if (!candidate || typeof candidate.create !== "function") {
      return toolkit;
    }
    const factory = /** @type {DyniHarnessToolkitFactory} */ (candidate);
    return {
      /**
       * @param {unknown} def
       * @param {DyniHarnessComponentContext} componentContext
       * @returns {DyniHarnessToolkitInstance}
       */
      create(def, componentContext) {
        const created = factory.create(def, componentContext);
        if (!created || !created.theme || typeof created.theme.resolveForRoot !== "function") {
          return created;
        }
        const originalResolveForRoot = created.theme.resolveForRoot;
        created.theme.resolveForRoot = function (/** @type {unknown} */ rootEl) {
          const resolved = originalResolveForRoot(rootEl);
          if (!resolved.surface || typeof resolved.surface !== "object") {
            resolved.surface = { fg: "#fff" };
          } else if (!resolved.surface.fg) {
            resolved.surface.fg = "#fff";
          }
          if (!resolved.font || typeof resolved.font !== "object") {
            resolved.font = {
              family: "sans-serif",
              weight: 700,
              labelWeight: 700
            };
          } else if (!resolved.font.family) {
            resolved.font.family = "sans-serif";
          }
          return resolved;
        };
        if (!created.angle) {
          created.angle = fallbackAngleMath;
        }
        if (typeof created.resolveSurface !== "function") {
          created.resolveSurface = function resolveSurface(/** @type {HTMLCanvasElement} */ canvas) {
            const setup = componentContext.canvas.setupCanvas(canvas);
            return setup && setup.W && setup.H && setup.ctx ? setup : null;
          };
        }
        return created;
      }
    };
  }

  return createComponentContextMock({
    modules: Object.assign({}, modules, {
      CanvasLayerCache: {
        create() {
          return {
            /** @param {DyniHarnessLayerCacheSpec} [spec] */
            createLayerCache(spec) {
              const layers = spec && Array.isArray(spec.layers) && spec.layers.length ? spec.layers : ["layer"];
              return {
                /**
                 * @param {HTMLCanvasElement} canvas
                 * @param {unknown} _key
                 * @param {DyniHarnessLayerRebuildFn} rebuild
                 */
                ensureLayer(canvas, _key, rebuild) {
                  for (let i = 0; i < layers.length; i += 1) {
                    rebuild(/** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d")), layers[i], canvas);
                  }
                },
                blit() {},
                blitLayer() {}
              };
            }
          };
        }
      },
      StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
      PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
      StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
      StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
      StateScreenCanvasOverlay: loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js"),
      SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
      RadialToolkit: withCanonicalThemeTokens(modules.RadialToolkit),
      RadialMajorValueLabels: loadFresh("shared/widget-kits/radial/RadialMajorValueLabels.js")
    }),
    services: {
      canvas: {
        /**
         * @param {HTMLCanvasElement} canvas
         * @returns {DyniHarnessCanvasSetup}
         */
        setupCanvas(canvas) {
          const ctx = canvas.getContext("2d");
          const rect = canvas.getBoundingClientRect();
          return {
            ctx,
            W: Math.round(rect.width),
            H: Math.round(rect.height)
          };
        }
      },
      dom: {
        /** @param {unknown} target @returns {unknown} */
        requirePluginRoot(target) {
          return target;
        }
      }
    }
  });
}

const { createRenderOrderHarness } = require("./SemicircleRadialEngine.render-order-harness");

/** @param {number} width @param {number} height */
function createCanvas(width, height) {
  const ctx = createMockContext2D();
  const canvas = createMockCanvas({
    rectWidth: width,
    rectHeight: height,
    ctx: ctx
  });
  return { canvas: canvas, ctx: ctx };
}

/** @param {DyniHarnessColoredAngleRange[]} [sectorList] */
function createBaseSequence(sectorList) {
  return createRenderOrderHarness(sectorList || []);
}

const createRenderHarness = createRenderOrderHarness;

module.exports = {
  makeThemeDefaults,
  makeComponentContext,
  createCanvas,
  createBaseSequence,
  createValueMath,
  createLayoutModule,
  makeBaseSpec,
  createRenderOrderHarness,
  createRenderHarness,
  loadFresh,
  geometryScale,
  createMockCanvas,
  createMockContext2D,
  createComponentContextMock
};
