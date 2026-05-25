const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");
const {
  createMockCanvas,
  createMockContext2D,
} = require("../../helpers/mock-canvas");

  function createHarness(options) {
    const opts = options || {};
    const cacheMod = loadFresh("shared/widget-kits/canvas/CanvasLayerCache.js");
    const calls = {
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
      drawInlineCapValUnit: 0,
    };

    const theme = opts.theme || {
      surface: {
        fg: "#fff",
      },
      strokeWeight: 1,
      pointerDepthWeight: 1,
      pointerSideWeight: 1,
      colors: {
        pointer: "#ff2b2b",
        warning: "#e7c66a",
        alarm: "#FA584A",
      },
      radial: {
        ticks: {
          majorLenFactor: 0.08,
          majorWidthFactor: 0.02,
          minorLenFactor: 0.047,
          minorWidthFactor: 0.01,
        },
        pointer: {
          sideFactor: 0.11,
          depthFactor: 0.22,
        },
        ring: {
          arcLineWidthFactor: 0.013,
          widthFactor: 0.12,
        },
        labels: {
          insetFactor: 1.8,
          fontFactor: 0.14,
        },
      },
      linear: {
        track: { widthFactor: 0.2, lineWidthFactor: 0.018 },
        ticks: {
          majorLenFactor: 0.109,
          majorWidthFactor: 0.027,
          minorLenFactor: 0.064,
          minorWidthFactor: 0.014,
        },
        pointer: { sideFactor: 0.12, depthFactor: 0.24 },
        labels: { insetFactor: 1.2, fontFactor: 0.2 },
      },
      font: {
        family: "sans-serif",
        weight: 700,
        labelWeight: 650,
      },
      xte: {
        lineWidthFactor: 1,
      },
    };
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
          drawTrack(ctx, x0, x1, y, optsTrack) {
            calls.track.push({ x0, x1, y, opts: optsTrack });
          },
          drawBand(ctx, x0, x1, y, thickness, optsBand) {
            calls.bands.push({ x0, x1, y, thickness, opts: optsBand });
          },
          drawTick(ctx, x, y, len, optsTick) {
            calls.ticks.push({ x, y, len, opts: optsTick });
          },
          drawPointer(ctx, x, y, optsPointer) {
            calls.pointer.push({ x, y, opts: optsPointer });
          },
        };
      },
    };

    const engineMod = loadFresh(
      "shared/widget-kits/linear/LinearGaugeEngine.js",
    );
    const engineSupportMod = loadFresh(
      "shared/widget-kits/linear/LinearGaugeEngineSupport.js",
    );
    const responsiveScaleProfileMod = loadFresh(
      "shared/widget-kits/layout/ResponsiveScaleProfile.js",
    );
    const layoutRectMathMod = loadFresh(
      "shared/widget-kits/layout/LayoutRectMath.js",
    );
    const layoutMod = loadFresh(
      "shared/widget-kits/linear/LinearGaugeLayout.js",
    );
    const mathMod = loadFresh("shared/widget-kits/linear/LinearGaugeMath.js");
    const labelFitMod = loadFresh(
      "shared/widget-kits/linear/LinearGaugeLabelFit.js",
    );
    const textLayoutMod = loadFresh(
      "shared/widget-kits/linear/LinearGaugeTextLayout.js",
    );
    const engine = engineMod.create(
      {},
      createComponentContextMock({
        modules: {
          StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
          PlaceholderNormalize: loadFresh(
            "shared/widget-kits/format/PlaceholderNormalize.js",
          ),
          StateScreenLabels: loadFresh(
            "shared/widget-kits/state/StateScreenLabels.js",
          ),
          StateScreenPrecedence: loadFresh(
            "shared/widget-kits/state/StateScreenPrecedence.js",
          ),
          StateScreenCanvasOverlay: loadFresh(
            "shared/widget-kits/state/StateScreenCanvasOverlay.js",
          ),
          SpringEasing:
            opts.springEasingModule ||
            loadFresh("shared/widget-kits/anim/SpringEasing.js"),
          CanvasLayerCache: cacheMod,
          LinearCanvasPrimitives: primitivesModule,
          LinearGaugeEngineDrawing: loadFresh(
            "shared/widget-kits/linear/LinearGaugeEngineDrawing.js",
          ),
          GeometryScale: loadFresh(
            "shared/widget-kits/layout/GeometryScale.js",
          ),
          ResponsiveScaleProfile: responsiveScaleProfileMod,
          LayoutRectMath: layoutRectMathMod,
          LinearGaugeMath: mathMod,
          LinearGaugeLayout: layoutMod,
          LinearGaugeTextLayout: textLayoutMod,
          LinearGaugeLabelFit: labelFitMod,
          LinearGaugeEngineSupport: engineSupportMod,
          GaugeToolkit: {
            create() {
              return {
                theme: {
                  resolveForRoot() {
                    return theme;
                  },
                },
                value: {
                  isFiniteNumber(v) {
                    return typeof v === "number" && isFinite(v);
                  },
                  toOptionalFiniteNumber(v) {
                    if (v == null) return undefined;
                    if (typeof v === "string" && v.trim() === "")
                      return undefined;
                    const n = Number(v);
                    return isFinite(n) ? n : undefined;
                  },
                  normalizeRange(minRaw, maxRaw, fallbackMin, fallbackMax) {
                    const min = Number(minRaw);
                    const max = Number(maxRaw);
                    const rMin = isFinite(min) ? min : Number(fallbackMin);
                    const rMax = isFinite(max) ? max : Number(fallbackMax);
                    const safeMax = rMax > rMin ? rMax : rMin + 1;
                    return { min: rMin, max: safeMax, range: safeMax - rMin };
                  },
                  clamp(v, lo, hi) {
                    const n = Number(v);
                    if (!isFinite(n)) return lo;
                    return Math.max(lo, Math.min(hi, n));
                  },
                },
                text: {
                  measureValueUnitFit(
                    ctx,
                    family,
                    valueText,
                    unitText,
                    maxW,
                    maxH,
                    secScale,
                  ) {
                    calls.measureValueUnitFitScales.push(secScale);
                    return { vPx: 20, uPx: 14, gap: 6 };
                  },
                  fitInlineCapValUnit(
                    ctx,
                    family,
                    caption,
                    valueText,
                    unitText,
                    maxW,
                    maxH,
                    secScale,
                  ) {
                    calls.fitInlineCapValUnitScales.push(secScale);
                    calls.fitInlineCaptions.push(caption);
                    return {
                      cPx: 12,
                      vPx: 20,
                      uPx: 14,
                      g1: 6,
                      g2: 6,
                      total: 120,
                    };
                  },
                  drawCaptionMax(ctx, family, x, y, w, h, caption, capMaxPx) {
                    calls.captionRowHeights.push(h);
                    calls.captionMaxPx.push(capMaxPx);
                    calls.drawCaptionMax += 1;
                  },
                  drawValueUnitWithFit(
                    ctx,
                    family,
                    x,
                    y,
                    w,
                    h,
                    valueText,
                    unitText,
                    fit,
                  ) {
                    calls.valueRowHeights.push(h);
                    calls.valueFits.push(fit);
                    calls.drawValueUnitWithFit += 1;
                  },
                  drawInlineCapValUnit(
                    ctx,
                    family,
                    x,
                    y,
                    w,
                    h,
                    caption,
                    valueText,
                    unitText,
                    fit,
                  ) {
                    calls.inlineFits.push(fit);
                    calls.drawInlineCapValUnit += 1;
                  },
                  drawDisconnectOverlay() {},
                },
                resolveSurface(canvas) {
                  const ctx = canvas.getContext("2d");
                  const rect = canvas.getBoundingClientRect();
                  return {
                    ctx: ctx,
                    W: Math.round(rect.width),
                    H: Math.round(rect.height),
                  };
                },
              };
            },
          },
        },
        services: {
          canvas: {
            setupCanvas(canvas) {
              const ctx = canvas.getContext("2d");
              const rect = canvas.getBoundingClientRect();
              return {
                ctx,
                W: Math.round(rect.width),
                H: Math.round(rect.height),
              };
            },
          },
          dom: {
            requirePluginRoot(target) {
              return target;
            },
          },
        },
      }),
    );

    return { engine, calls, theme };
  }

module.exports = {
  createHarness,
  createMockCanvas,
  createMockContext2D,
};
