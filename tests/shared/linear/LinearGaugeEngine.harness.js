const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

/**
 * @typedef {{ [key: string]: unknown }} LinearDrawOptions
 * @typedef {{ x0: number, x1: number, y: number, opts: LinearDrawOptions }} TrackCall
 * @typedef {{ x0: number, x1: number, y: number, thickness: unknown, opts: LinearDrawOptions }} BandCall
 * @typedef {{ x: number, y: number, len: unknown, opts: LinearDrawOptions }} TickCall
 * @typedef {{ x: number, y: number, opts: LinearDrawOptions }} PointerCall
 * @typedef {{ vPx: number, uPx: number, gap: number }} ValueUnitFit
 * @typedef {{ cPx: number, vPx: number, uPx: number, g1: number, g2: number, total: number }} InlineCapValUnitFit
 * @typedef {{ createRenderer: (config: Record<string, unknown>) => (canvas: unknown, props: Record<string, unknown>) => void }} LinearGaugeEngine
 * @typedef {{ calls: { bands: BandCall[], captionMaxPx: number[], captionRowHeights: number[], drawCaptionMax: number, drawInlineCapValUnit: number, drawValueUnitWithFit: number, fitInlineCapValUnitScales: number[], fitInlineCaptions: unknown[], inlineFits: InlineCapValUnitFit[], measureValueUnitFitScales: number[], pointer: PointerCall[], ticks: TickCall[], track: TrackCall[], valueFits: ValueUnitFit[], valueRowHeights: number[] }, engine: LinearGaugeEngine, theme: { linear: { labels: { insetFactor: number } } } }} LinearGaugeHarness
 * @typedef {{ fg?: string, [key: string]: unknown }} HarnessSurfaceTheme
 * @typedef {{ family?: string, weight?: number, labelWeight?: number, [key: string]: unknown }} HarnessFontTheme
 * @typedef {{ insetFactor: number, fontFactor?: number, [key: string]: unknown }} HarnessLinearLabelsTheme
 * @typedef {{ labels: HarnessLinearLabelsTheme, [key: string]: unknown }} HarnessLinearTheme
 * @typedef {{ surface?: HarnessSurfaceTheme, font?: HarnessFontTheme, [key: string]: unknown }} HarnessThemeInput
 * @typedef {{ surface: HarnessSurfaceTheme, font: HarnessFontTheme, linear: HarnessLinearTheme, [key: string]: unknown }} HarnessTheme
 * @typedef {{ theme?: HarnessThemeInput, springEasingModule?: unknown }} HarnessOptions
 */

/** @param {HarnessOptions} [options] @returns {LinearGaugeHarness} */
function createHarness(options) {
  const opts = options || /** @type {HarnessOptions} */ ({});
  const cacheMod = loadFresh("shared/widget-kits/canvas/CanvasLayerCache.js");
  const calls = /** @type {LinearGaugeHarness["calls"]} */ ({
    track: [],
    bands: [],
    ticks: [],
    pointer: [],
    captionMaxPx: [],
    valueFits: [],
    inlineFits: [],
    measureValueUnitFitScales: [],
    fitInlineCapValUnitScales: [],
    fitInlineCaptions: [],
    captionRowHeights: [],
    valueRowHeights: [],
    drawCaptionMax: 0,
    drawValueUnitWithFit: 0,
    drawInlineCapValUnit: 0
  });

  const theme = /** @type {HarnessTheme} */ (
    opts.theme || {
      surface: {
        fg: "#fff"
      },
      strokeWeight: 1,
      pointerDepthWeight: 1,
      pointerSideWeight: 1,
      colors: {
        pointer: "#3366cc",
        warning: "#e0a92e",
        alarm: "#d9534a"
      },
      radial: {
        ticks: {
          majorLenFactor: 0.08,
          majorWidthFactor: 0.02,
          minorLenFactor: 0.047,
          minorWidthFactor: 0.01
        },
        pointer: {
          sideFactor: 0.11,
          depthFactor: 0.22
        },
        ring: {
          arcLineWidthFactor: 0.013,
          widthFactor: 0.12
        },
        labels: {
          insetFactor: 1.8,
          fontFactor: 0.14
        }
      },
      linear: {
        track: { widthFactor: 0.2, lineWidthFactor: 0.018 },
        ticks: {
          majorLenFactor: 0.109,
          majorWidthFactor: 0.027,
          minorLenFactor: 0.064,
          minorWidthFactor: 0.014
        },
        pointer: { sideFactor: 0.12, depthFactor: 0.24 },
        labels: { insetFactor: 1.2, fontFactor: 0.2 }
      },
      font: {
        family: "sans-serif",
        weight: 700,
        labelWeight: 650
      },
      xte: {
        lineWidthFactor: 1
      }
    }
  );
  if (!theme.surface || typeof theme.surface !== "object") {
    theme.surface = { fg: "#fff" };
  } else if (!theme.surface.fg) {
    theme.surface.fg = "#fff";
  }
  if (!theme.font || typeof theme.font !== "object") {
    theme.font = { family: "sans-serif", weight: 700, labelWeight: 650 };
  } else if (!theme.font.family) {
    theme.font.family = "sans-serif";
  }

  const primitivesModule = {
    create() {
      return {
        /**
         * @param {DyniTestCanvasContext} ctx
         * @param {number} x0
         * @param {number} x1
         * @param {number} y
         * @param {LinearDrawOptions} optsTrack
         */
        drawTrack(ctx, x0, x1, y, optsTrack) {
          calls.track.push({ x0, x1, y, opts: optsTrack });
        },
        /**
         * @param {DyniTestCanvasContext} ctx
         * @param {number} x0
         * @param {number} x1
         * @param {number} y
         * @param {unknown} thickness
         * @param {LinearDrawOptions} optsBand
         */
        drawBand(ctx, x0, x1, y, thickness, optsBand) {
          calls.bands.push({ x0, x1, y, thickness, opts: optsBand });
        },
        /**
         * @param {DyniTestCanvasContext} ctx
         * @param {number} x
         * @param {number} y
         * @param {unknown} len
         * @param {LinearDrawOptions} optsTick
         */
        drawTick(ctx, x, y, len, optsTick) {
          calls.ticks.push({ x, y, len, opts: optsTick });
        },
        /**
         * @param {DyniTestCanvasContext} ctx
         * @param {number} x
         * @param {number} y
         * @param {LinearDrawOptions} optsPointer
         */
        drawPointer(ctx, x, y, optsPointer) {
          calls.pointer.push({ x, y, opts: optsPointer });
        }
      };
    }
  };

  const engineMod = loadFresh("shared/widget-kits/linear/LinearGaugeEngine.js");
  const engineSupportMod = loadFresh("shared/widget-kits/linear/LinearGaugeEngineSupport.js");
  const responsiveScaleProfileMod = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
  const layoutRectMathMod = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
  const layoutMod = loadFresh("shared/widget-kits/linear/LinearGaugeLayout.js");
  const layoutVariantsMod = loadFresh("shared/widget-kits/linear/LinearGaugeLayoutVariants.js");
  const mathMod = loadFresh("shared/widget-kits/linear/LinearGaugeMath.js");
  const labelFitMod = loadFresh("shared/widget-kits/linear/LinearGaugeLabelFit.js");
  const textLayoutMod = loadFresh("shared/widget-kits/linear/LinearGaugeTextLayout.js");
  const engine = engineMod.create(
    {},
    createComponentContextMock({
      modules: {
        StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
        StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
        StateScreenCanvasOverlay: loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js"),
        SpringEasing: opts.springEasingModule || loadFresh("shared/widget-kits/anim/SpringEasing.js"),
        CanvasLayerCache: cacheMod,
        LinearCanvasPrimitives: primitivesModule,
        LinearGaugeEngineDrawing: loadFresh("shared/widget-kits/linear/LinearGaugeEngineDrawing.js"),
        LinearGaugeEngineFrame: loadFresh("shared/widget-kits/linear/LinearGaugeEngineFrame.js"),
        GeometryScale: loadFresh("shared/widget-kits/layout/GeometryScale.js"),
        ResponsiveScaleProfile: responsiveScaleProfileMod,
        LayoutRectMath: layoutRectMathMod,
        LinearGaugeMath: mathMod,
        LinearGaugeLayout: layoutMod,
        LinearGaugeLayoutVariants: layoutVariantsMod,
        LinearGaugeTextLayout: textLayoutMod,
        LinearGaugeLabelFit: labelFitMod,
        LinearGaugeEngineSupport: engineSupportMod,
        GaugeToolkit: {
          create() {
            return {
              theme: {
                resolveForRoot() {
                  return theme;
                }
              },
              value: {
                /** @param {unknown} v */
                isFiniteNumber(v) {
                  return typeof v === "number" && isFinite(v);
                },
                /** @param {unknown} v */
                toOptionalFiniteNumber(v) {
                  if (v === null || v === undefined) return undefined;
                  if (typeof v === "string" && v.trim() === "") return undefined;
                  const n = Number(v);
                  return isFinite(n) ? n : undefined;
                },
                /**
                 * @param {unknown} minRaw
                 * @param {unknown} maxRaw
                 * @param {unknown} fallbackMin
                 * @param {unknown} fallbackMax
                 */
                normalizeRange(minRaw, maxRaw, fallbackMin, fallbackMax) {
                  const min = Number(minRaw);
                  const max = Number(maxRaw);
                  const rMin = isFinite(min) ? min : Number(fallbackMin);
                  const rMax = isFinite(max) ? max : Number(fallbackMax);
                  const safeMax = rMax > rMin ? rMax : rMin + 1;
                  return { min: rMin, max: safeMax, range: safeMax - rMin };
                },
                /**
                 * @param {unknown} v
                 * @param {number} lo
                 * @param {number} hi
                 */
                clamp(v, lo, hi) {
                  const n = Number(v);
                  if (!isFinite(n)) return lo;
                  return Math.max(lo, Math.min(hi, n));
                }
              },
              text: {
                /**
                 * @param {DyniTestCanvasContext} ctx
                 * @param {unknown} family
                 * @param {unknown} valueText
                 * @param {unknown} unitText
                 * @param {number} maxW
                 * @param {number} maxH
                 * @param {number} secScale
                 * @returns {ValueUnitFit}
                 */
                measureValueUnitFit(ctx, family, valueText, unitText, maxW, maxH, secScale) {
                  calls.measureValueUnitFitScales.push(secScale);
                  return { vPx: 20, uPx: 14, gap: 6 };
                },
                /**
                 * @param {DyniTestCanvasContext} ctx
                 * @param {unknown} family
                 * @param {unknown} caption
                 * @param {unknown} valueText
                 * @param {unknown} unitText
                 * @param {number} maxW
                 * @param {number} maxH
                 * @param {number} secScale
                 * @returns {InlineCapValUnitFit}
                 */
                fitInlineCapValUnit(ctx, family, caption, valueText, unitText, maxW, maxH, secScale) {
                  calls.fitInlineCapValUnitScales.push(secScale);
                  calls.fitInlineCaptions.push(caption);
                  return {
                    cPx: 12,
                    vPx: 20,
                    uPx: 14,
                    g1: 6,
                    g2: 6,
                    total: 120
                  };
                },
                /**
                 * @param {DyniTestCanvasContext} ctx
                 * @param {unknown} family
                 * @param {number} x
                 * @param {number} y
                 * @param {number} w
                 * @param {number} h
                 * @param {unknown} caption
                 * @param {number} capMaxPx
                 */
                drawCaptionMax(ctx, family, x, y, w, h, caption, capMaxPx) {
                  calls.captionRowHeights.push(h);
                  calls.captionMaxPx.push(capMaxPx);
                  calls.drawCaptionMax += 1;
                },
                /**
                 * @param {DyniTestCanvasContext} ctx
                 * @param {unknown} family
                 * @param {number} x
                 * @param {number} y
                 * @param {number} w
                 * @param {number} h
                 * @param {unknown} valueText
                 * @param {unknown} unitText
                 * @param {ValueUnitFit} fit
                 */
                drawValueUnitWithFit(ctx, family, x, y, w, h, valueText, unitText, fit) {
                  calls.valueRowHeights.push(h);
                  calls.valueFits.push(fit);
                  calls.drawValueUnitWithFit += 1;
                },
                /**
                 * @param {DyniTestCanvasContext} ctx
                 * @param {unknown} family
                 * @param {number} x
                 * @param {number} y
                 * @param {number} w
                 * @param {number} h
                 * @param {unknown} caption
                 * @param {unknown} valueText
                 * @param {unknown} unitText
                 * @param {InlineCapValUnitFit} fit
                 */
                drawInlineCapValUnit(ctx, family, x, y, w, h, caption, valueText, unitText, fit) {
                  calls.inlineFits.push(fit);
                  calls.drawInlineCapValUnit += 1;
                },
                drawDisconnectOverlay() {}
              },
              /** @param {HTMLCanvasElement} canvas */
              resolveSurface(canvas) {
                const ctx = canvas.getContext("2d");
                const rect = canvas.getBoundingClientRect();
                return {
                  ctx: ctx,
                  W: Math.round(rect.width),
                  H: Math.round(rect.height)
                };
              }
            };
          }
        }
      },
      services: {
        canvas: {
          /** @param {HTMLCanvasElement} canvas */
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
          /** @param {Element} target */
          requirePluginRoot(target) {
            return target;
          }
        }
      }
    })
  );

  return { engine, calls, theme };
}

module.exports = {
  createHarness,
  createMockCanvas,
  createMockContext2D
};
