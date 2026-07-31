const { loadFresh } = require("../../helpers/load-umd");

/** @typedef {{ startDeg: unknown, endDeg: unknown }} DyniHarnessArc */
/** @typedef {{ a0: number, a1: number, color?: unknown }} DyniHarnessColoredAngleRange */
/** @typedef {{ angleCfg?: unknown, [key: string]: unknown }} DyniHarnessDrawOptions */
/** @typedef {{ majors: number[], minors: number[] }} DyniHarnessTickAngles */
/** @typedef {Record<string, unknown>} DyniHarnessRenderState */
/** @typedef {Record<string, unknown>} DyniHarnessDisplay */

/**
 * @typedef {{
 *   sectorAngles: (from: unknown, to: unknown, minV: number, maxV: number, arc: DyniHarnessArc) => ({ a0: number, a1: number } | null),
 *   buildHighEndSectors: (props: Record<string, unknown> | undefined, minV: number, maxV: number, arc: DyniHarnessArc, options?: Record<string, unknown>) => DyniHarnessColoredAngleRange[],
 *   buildLowEndSectors: (props: Record<string, unknown> | undefined, minV: number, maxV: number, arc: DyniHarnessArc, options?: Record<string, unknown>) => DyniHarnessColoredAngleRange[]
 * }} DyniHarnessSectorMathUtils
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
 *   makeThemeDefaults: () => DyniHarnessResolvedTheme,
 *   createValueMath: () => unknown,
 *   makeComponentContext: (modules: Record<string, unknown>) => unknown,
 *   makeBaseSpec: () => Record<string, unknown>,
 *   geometryScale: unknown
 * }} DyniHarnessBaseModule
 */

/** @param {DyniHarnessColoredAngleRange[]} sectorList */
function createRenderOrderHarness(sectorList) {
  const base = /** @type {DyniHarnessBaseModule} */ (require("./SemicircleRadialEngine.harness"));
  /** @type {string[]} */
  const sequence = [];
  /** @type {(DyniHarnessDrawOptions | undefined)[]} */
  const arcRingCalls = [];
  /** @type {(DyniHarnessDrawOptions | undefined)[]} */
  const pointerCalls = [];
  /** @type {(DyniHarnessDrawOptions | undefined)[]} */
  const tickCalls = [];
  /** @type {(DyniHarnessDrawOptions | undefined)[]} */
  const labelCalls = [];
  /** @type {DyniHarnessBuildSectorsCall[]} */
  const buildSectorsCalls = [];
  const themeDefaults = base.makeThemeDefaults();
  const resolveTheme = vi.fn(function () {
    return themeDefaults;
  });
  const gaugeValueMath = base.createValueMath();
  const gaugeToolkit = {
    create() {
      return {
        theme: { resolveForRoot: resolveTheme },
        text: {
          drawDisconnectOverlay() {}
        },
        value: gaugeValueMath,
        draw: {
          /**
           * @param {CanvasRenderingContext2D} ctx
           * @param {number} cx
           * @param {number} cy
           * @param {number} rOuter
           * @param {unknown} startDeg
           * @param {unknown} endDeg
           * @param {DyniHarnessDrawOptions} [opts]
           */
          drawArcRing(ctx, cx, cy, rOuter, startDeg, endDeg, opts) {
            sequence.push("ring");
            arcRingCalls.push(opts);
          },
          /**
           * @param {CanvasRenderingContext2D} ctx
           * @param {number} cx
           * @param {number} cy
           * @param {number} rOuter
           * @param {DyniHarnessDrawOptions} [opts]
           */
          drawAnnularSector(ctx, cx, cy, rOuter, opts) {
            sequence.push("sector");
          },
          /**
           * @param {CanvasRenderingContext2D} ctx
           * @param {number} cx
           * @param {number} cy
           * @param {number} rOuter
           * @param {unknown} angleDeg
           * @param {DyniHarnessDrawOptions} [opts]
           */
          drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts) {
            sequence.push("pointer");
            pointerCalls.push(opts);
          },
          /**
           * @param {CanvasRenderingContext2D} ctx
           * @param {number} cx
           * @param {number} cy
           * @param {number} rOuter
           * @param {DyniHarnessTickAngles} [ticks]
           * @param {DyniHarnessDrawOptions} [opts]
           */
          drawTicksFromAngles(ctx, cx, cy, rOuter, ticks, opts) {
            sequence.push("ticks");
            tickCalls.push(opts);
          },
          /**
           * @param {CanvasRenderingContext2D} ctx
           * @param {number} cx
           * @param {number} cy
           * @param {number} rOuter
           * @param {DyniHarnessDrawOptions} [opts]
           */
          drawLabels(ctx, cx, cy, rOuter, opts) {
            sequence.push("labels");
            labelCalls.push(opts);
          }
        }
      };
    }
  };
  /** @type {{ state: DyniHarnessRenderState, display: DyniHarnessDisplay }[]} */
  const textLayoutCalls = [];
  const modules = {
    RadialToolkit: gaugeToolkit,
    SemicircleRadialLayout: loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js"),
    SemicircleRadialTextLayout: {
      create() {
        return {
          createFitCache() {
            return {};
          },
          /**
           * @param {DyniHarnessRenderState} state
           * @param {DyniHarnessDisplay} display
           */
          drawModeText(state, display) {
            textLayoutCalls.push({ state, display });
          }
        };
      }
    },
    ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
    LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
    GeometryScale: base.geometryScale
  };
  const renderer = loadFresh("shared/widget-kits/radial/SemicircleRadialEngine.js")
    .create({}, base.makeComponentContext(modules))
    .createRenderer({
      ...base.makeBaseSpec(),
      /**
       * @param {Record<string, unknown>} props
       * @param {number} minV
       * @param {number} maxV
       * @param {DyniHarnessArc} arc
       * @param {DyniHarnessSectorMathUtils} valueUtils
       * @param {DyniHarnessResolvedTheme} theme
       * @returns {DyniHarnessColoredAngleRange[]}
       */
      buildSectors(props, minV, maxV, arc, valueUtils, theme) {
        buildSectorsCalls.push({ props, minV, maxV, arc, valueUtils, theme });
        return sectorList;
      }
    });

  return {
    renderer,
    sequence,
    arcRingCalls,
    pointerCalls,
    tickCalls,
    labelCalls,
    buildSectorsCalls,
    textLayoutCalls,
    resolveTheme,
    themeDefaults
  };
}

module.exports = { createRenderOrderHarness };
