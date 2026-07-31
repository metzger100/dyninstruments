const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

/**
 * @typedef {{ surface?: { fg?: string }, colors?: { pointer?: string, laylineStb?: string, laylinePort?: string, warning?: string, alarm?: string }, font?: { family?: string, weight?: number, labelWeight?: number }, strokeWeight?: number, pointerDepthWeight?: number }} XteThemeOverrides
 * @typedef {{ formatter?: string, formatterParameters?: unknown[] }} FormatterOptions
 * @typedef {{ distanceDivisor?: number, theme?: XteThemeOverrides, applyFormatter?: (value: unknown, formatterOptions: FormatterOptions) => unknown }} CreateHarnessOptions
 * @typedef {{ surface: { fg: string }, colors: { pointer: string, laylineStb: string, laylinePort: string, warning: string, alarm: string }, font: { family: string, weight: number, labelWeight: number }, strokeWeight: number, pointerDepthWeight: number }} XteTheme
 * @typedef {{ colors: Record<string, unknown>, xteNormalized: number, overflow: boolean, geom: unknown, primaryDim: unknown, strokeWeight: unknown, pointerDepthWeight: unknown }} DynamicDraw
 * @typedef {{ metricRects: null | Record<string, unknown>, nameRect: null | Record<string, unknown> }} LayoutRecord
 * @typedef {{ value: string, unit: string, w: number, h: number }} ValueRow
 * @typedef {{ caption: string, w: number, h: number }} CaptionRow
 * @typedef {{ calls: { dynamicDraws: DynamicDraw[], layoutHistory: LayoutRecord[], metricTextFillScales: number[], modeHistory: unknown[], overlays: number, staticDraws: unknown[], valueRows: ValueRow[], captionRows: CaptionRow[], waypointChecks: unknown[], waypointTextFillScales: number[] }, spec: { renderCanvas: (canvas: unknown, props: Record<string, unknown>) => void }, theme: XteTheme }} XteHarness
 */

/** @param {CreateHarnessOptions} [options] @returns {XteHarness} */
function createHarness(options) {
  const opts = options || {};
  const distanceDivisor =
    typeof opts.distanceDivisor === "number" && Number.isFinite(opts.distanceDivisor) ? opts.distanceDivisor : 1;
  const calls = /** @type {XteHarness["calls"]} */ ({
    staticDraws: [],
    dynamicDraws: [],
    modeHistory: [],
    layoutHistory: [],
    overlays: 0,
    valueRows: [],
    captionRows: [],
    waypointChecks: [],
    waypointTextFillScales: [],
    metricTextFillScales: []
  });

  const defaultTheme = {
    surface: {
      fg: "#ffffff"
    },
    colors: {
      pointer: "#aa0011",
      laylineStb: "#00aa66",
      laylinePort: "#cc4466",
      warning: "#ccaa33",
      alarm: "#ff3344"
    },
    font: {
      family: "sans-serif",
      weight: 720,
      labelWeight: 640
    },
    strokeWeight: 1,
    pointerDepthWeight: 1
  };
  const themeOverrides = opts.theme || {};
  const theme = {
    surface: Object.assign({}, defaultTheme.surface, themeOverrides.surface || {}),
    colors: Object.assign({}, defaultTheme.colors, themeOverrides.colors || {}),
    font: Object.assign({}, defaultTheme.font, themeOverrides.font || {}),
    strokeWeight: /** @type {number} */ (
      Object.prototype.hasOwnProperty.call(themeOverrides, "strokeWeight")
        ? themeOverrides.strokeWeight
        : defaultTheme.strokeWeight
    ),
    pointerDepthWeight: /** @type {number} */ (
      Object.prototype.hasOwnProperty.call(themeOverrides, "pointerDepthWeight")
        ? themeOverrides.pointerDepthWeight
        : defaultTheme.pointerDepthWeight
    )
  };

  const layerCache = loadFresh("shared/widget-kits/canvas/CanvasLayerCache.js");
  const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
  const geometryScale = loadFresh("shared/widget-kits/layout/GeometryScale.js");
  const realPrimitives = loadFresh("shared/widget-kits/xte/XteHighwayPrimitives.js").create(
    {},
    createComponentContextMock({
      modules: {
        GeometryScale: geometryScale
      }
    })
  );
  const realLayout = loadFresh("shared/widget-kits/xte/XteHighwayLayout.js").create(
    {},
    createComponentContextMock({
      modules: {
        ResponsiveScaleProfile: responsiveScaleProfile,
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js")
      }
    })
  );
  const realTileLayout = loadFresh("shared/widget-kits/text/TextTileLayout.js").create();
  const textTileLayout = {
    id: "TextTileLayout",
    /** @param {{ textFillScale?: unknown }} args */
    measureMetricTile(args) {
      const textFillScale = args && args.textFillScale;
      if (typeof textFillScale === "number" && isFinite(textFillScale)) {
        calls.metricTextFillScales.push(textFillScale);
      }
      return realTileLayout.measureMetricTile(args);
    },
    /** @param {{ textFillScale?: unknown }} args */
    drawMetricTile(args) {
      const textFillScale = args && args.textFillScale;
      if (typeof textFillScale === "number" && isFinite(textFillScale)) {
        calls.metricTextFillScales.push(textFillScale);
      }
      return realTileLayout.drawMetricTile(args);
    },
    /** @param {{ textFillScale?: unknown }} args */
    measureFittedLine(args) {
      const textFillScale = args && args.textFillScale;
      if (typeof textFillScale === "number" && isFinite(textFillScale)) {
        calls.waypointTextFillScales.push(textFillScale);
      }
      return realTileLayout.measureFittedLine(args);
    },
    /** @param {unknown} args */
    drawFittedLine(args) {
      return realTileLayout.drawFittedLine(args);
    }
  };

  const applyFormatter =
    typeof opts.applyFormatter === "function"
      ? opts.applyFormatter
      : /** @param {unknown} value @param {FormatterOptions} formatterOptions */
        function (value, formatterOptions) {
          if (formatterOptions.formatter === "formatDistance") {
            if (typeof value !== "number" || !isFinite(value)) {
              return "---";
            }
            return (value / distanceDivisor).toFixed(2);
          }
          if (formatterOptions.formatter === "formatDirection360") {
            if (typeof value !== "number" || !isFinite(value)) {
              return "---";
            }
            const rounded = ((Math.round(value) % 360) + 360) % 360;
            const leading = !!(formatterOptions.formatterParameters && formatterOptions.formatterParameters[0]);
            return leading ? String(rounded).padStart(3, "0") : String(rounded);
          }
          return String(value);
        };

  const spec = loadFresh("widgets/text/XteDisplayWidget/XteDisplayWidget.js").create(
    {},
    createComponentContextMock({
      modules: {
        CanvasLayerCache: layerCache,
        GaugeToolkit: {
          create() {
            return {
              theme: {
                resolveForRoot() {
                  return theme;
                }
              },
              value: {
                /** @param {unknown} value */
                isFiniteNumber(value) {
                  return typeof value === "number" && isFinite(value);
                },
                /** @param {number} W @param {number} H */
                computePad(W, H) {
                  return Math.max(6, Math.floor(Math.min(W, H) * 0.04));
                },
                /** @param {number} W @param {number} H */
                computeGap(W, H) {
                  return Math.max(6, Math.floor(Math.min(W, H) * 0.03));
                },
                /** @param {number} ratio @param {number} thresholdNormal @param {number} thresholdFlat */
                computeMode(ratio, thresholdNormal, thresholdFlat) {
                  if (ratio < thresholdNormal) return "high";
                  if (ratio > thresholdFlat) return "flat";
                  return "normal";
                }
              },
              text: {
                drawDisconnectOverlay() {
                  calls.overlays += 1;
                },
                fitSingleTextPx() {
                  return 12;
                },
                /** @param {CanvasRenderingContext2D} ctx @param {number} px @param {number} weight @param {string} family */
                setFont(ctx, px, weight, family) {
                  ctx.font = weight + " " + px + "px " + family;
                },
                /** @param {CanvasRenderingContext2D} ctx @param {unknown} text */
                measureTextWidth(ctx, text) {
                  return ctx.measureText(String(text || "")).width;
                },
                /** @param {CanvasRenderingContext2D} ctx @param {string} family @param {number} x @param {number} y @param {number} w @param {number} h @param {unknown} caption */
                drawCaptionMax(ctx, family, x, y, w, h, caption) {
                  calls.captionRows.push({ caption: String(caption), w, h });
                },
                measureValueUnitFit() {
                  return { vPx: 12, uPx: 10, gap: 6, total: 0 };
                },
                /** @param {CanvasRenderingContext2D} ctx @param {string} family @param {number} x @param {number} y @param {number} w @param {number} h @param {unknown} value @param {unknown} unit */
                drawValueUnitWithFit(ctx, family, x, y, w, h, value, unit) {
                  calls.valueRows.push({
                    value: String(value),
                    unit: String(unit || ""),
                    w,
                    h
                  });
                }
              }
            };
          }
        },
        XteHighwayPrimitives: {
          create() {
            return {
              highwayGeometry: realPrimitives.highwayGeometry,
              /** @param {CanvasRenderingContext2D} ctx @param {unknown} geom @param {Record<string, unknown>} colors @param {string} mode @param {unknown} primaryDim @param {unknown} strokeWeight */
              drawStaticHighway(ctx, geom, colors, mode, primaryDim, strokeWeight) {
                calls.staticDraws.push({
                  colors,
                  mode,
                  geom,
                  primaryDim,
                  strokeWeight
                });
              },
              /**
               * @param {CanvasRenderingContext2D} ctx
               * @param {unknown} geom
               * @param {Record<string, unknown>} colors
               * @param {number} xteNormalized
               * @param {boolean} overflow
               * @param {unknown} primaryDim
               * @param {unknown} strokeWeight
               * @param {unknown} pointerDepthWeight
               */
              drawDynamicHighway(
                ctx,
                geom,
                colors,
                xteNormalized,
                overflow,
                primaryDim,
                strokeWeight,
                pointerDepthWeight
              ) {
                calls.dynamicDraws.push({
                  colors,
                  xteNormalized,
                  overflow,
                  geom,
                  primaryDim,
                  strokeWeight,
                  pointerDepthWeight
                });
              },
              /** @param {string} mode @param {LayoutRecord} layout @param {unknown} showWpName @param {unknown} name @param {unknown} fit */
              shouldShowWaypoint(mode, layout, showWpName, name, fit) {
                const result = realPrimitives.shouldShowWaypoint(mode, layout, showWpName, name, fit);
                calls.waypointChecks.push({
                  mode,
                  showWpName,
                  name,
                  result,
                  rect: layout && layout.nameRect,
                  fit
                });
                return result;
              }
            };
          }
        },
        XteDisplayPropsNormalize: loadFresh("shared/widget-kits/xte/XteDisplayPropsNormalize.js"),
        XteDisplayRenderSetup: loadFresh("shared/widget-kits/xte/XteDisplayRenderSetup.js"),
        XteHighwayLayout: {
          create() {
            return {
              id: "XteHighwayLayout",
              /** @param {number} W @param {number} H @param {number} thresholdNormal @param {number} thresholdFlat */
              computeMode(W, H, thresholdNormal, thresholdFlat) {
                const mode = realLayout.computeMode(W, H, thresholdNormal, thresholdFlat);
                calls.modeHistory.push(mode);
                return mode;
              },
              computeInsets: realLayout.computeInsets,
              createContentRect: realLayout.createContentRect,
              /** @param {unknown} args */
              computeLayout(args) {
                const layout = realLayout.computeLayout(args);
                calls.layoutHistory.push(layout);
                return layout;
              },
              computeMetricTileSpacing: realLayout.computeMetricTileSpacing
            };
          }
        },
        TextTileLayout: textTileLayout,
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        UnitAwareFormatter: loadFresh("shared/widget-kits/format/UnitAwareFormatter.js"),
        StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
        SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
        XteDisplayMetrics: loadFresh("shared/widget-kits/xte/XteDisplayMetrics.js"),
        StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
        StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
        StateScreenCanvasOverlay: loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js")
      },
      services: {
        format: { applyFormatter },
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
          /** @param {unknown} target */
          requirePluginRoot(target) {
            return target;
          }
        }
      }
    })
  );

  return { spec, calls, theme };
}
module.exports = {
  createHarness,
  createMockCanvas,
  createMockContext2D
};
