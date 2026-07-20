// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

function createHarness(options) {
  const opts = options || {};
  const distanceDivisor = Number.isFinite(opts.distanceDivisor) ? opts.distanceDivisor : 1;
  const calls = {
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
  };

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
    strokeWeight: Object.prototype.hasOwnProperty.call(themeOverrides, "strokeWeight")
      ? themeOverrides.strokeWeight
      : defaultTheme.strokeWeight,
    pointerDepthWeight: Object.prototype.hasOwnProperty.call(themeOverrides, "pointerDepthWeight")
      ? themeOverrides.pointerDepthWeight
      : defaultTheme.pointerDepthWeight
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
    measureMetricTile(args) {
      if (typeof (args && args.textFillScale) === "number" && isFinite(args.textFillScale)) {
        calls.metricTextFillScales.push(args.textFillScale);
      }
      return realTileLayout.measureMetricTile(args);
    },
    drawMetricTile(args) {
      if (typeof (args && args.textFillScale) === "number" && isFinite(args.textFillScale)) {
        calls.metricTextFillScales.push(args.textFillScale);
      }
      return realTileLayout.drawMetricTile(args);
    },
    measureFittedLine(args) {
      if (typeof (args && args.textFillScale) === "number" && isFinite(args.textFillScale)) {
        calls.waypointTextFillScales.push(args.textFillScale);
      }
      return realTileLayout.measureFittedLine(args);
    },
    drawFittedLine(args) {
      return realTileLayout.drawFittedLine(args);
    }
  };

  const applyFormatter =
    typeof opts.applyFormatter === "function"
      ? opts.applyFormatter
      : function (value, formatterOptions) {
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
                isFiniteNumber(value) {
                  return typeof value === "number" && isFinite(value);
                },
                computePad(W, H) {
                  return Math.max(6, Math.floor(Math.min(W, H) * 0.04));
                },
                computeGap(W, H) {
                  return Math.max(6, Math.floor(Math.min(W, H) * 0.03));
                },
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
                setFont(ctx, px, weight, family) {
                  ctx.font = weight + " " + px + "px " + family;
                },
                measureTextWidth(ctx, text) {
                  return ctx.measureText(String(text || "")).width;
                },
                drawCaptionMax(ctx, family, x, y, w, h, caption) {
                  calls.captionRows.push({ caption: String(caption), w, h });
                },
                measureValueUnitFit() {
                  return { vPx: 12, uPx: 10, gap: 6, total: 0 };
                },
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
              drawStaticHighway(ctx, geom, colors, mode, primaryDim, strokeWeight) {
                calls.staticDraws.push({
                  colors,
                  mode,
                  geom,
                  primaryDim,
                  strokeWeight
                });
              },
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
              computeMode(W, H, thresholdNormal, thresholdFlat) {
                const mode = realLayout.computeMode(W, H, thresholdNormal, thresholdFlat);
                calls.modeHistory.push(mode);
                return mode;
              },
              computeInsets: realLayout.computeInsets,
              createContentRect: realLayout.createContentRect,
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
