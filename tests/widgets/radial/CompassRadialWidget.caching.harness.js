// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

function createCompassCachingHarness(options) {
  const opts = options || {};
  const fullCircleEngine = loadFresh("shared/widget-kits/radial/FullCircleRadialEngine.js");
  const fullCircleLayout = loadFresh("shared/widget-kits/radial/FullCircleRadialLayout.js");
  const layerCache = loadFresh("shared/widget-kits/canvas/CanvasLayerCache.js");
  const textLayout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js");
  const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
  const layoutRectMath = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
  const geometryScale = loadFresh("shared/widget-kits/layout/GeometryScale.js");
  const calls = {
    ring: [],
    ticks: [],
    pointer: [],
    rimMarker: [],
    textDraws: 0
  };
  const theme = {
    surface: {
      fg: "#fff"
    },
    colors: {
      pointer: "#3366cc"
    },
    radial: {
      ticks: {
        majorLenFactor: 0.08,
        majorWidthFactor: 0.02,
        minorLenFactor: 0.047,
        minorWidthFactor: 0.01
      },
      pointer: {
        depthFactor: 0.22,
        sideFactor: 0.11
      },
      ring: {
        arcLineWidthFactor: 0.013,
        widthFactor: 0.35
      },
      labels: {
        insetFactor: 2.1,
        fontFactor: 0.35
      }
    },
    strokeWeight: 1,
    pointerDepthWeight: 1,
    pointerSideWeight: 1,
    font: {
      family: "sans-serif",
      weight: 705,
      labelWeight: 645
    }
  };

  const spec = loadFresh("widgets/radial/CompassRadialWidget/CompassRadialWidget.js").create(
    {},
    createComponentContextMock({
      modules: {
        FullCircleRadialEngine: fullCircleEngine,
        FullCircleRadialLayout: fullCircleLayout,
        FullCircleRadialTextLayout: textLayout,
        CanvasLayerCache: layerCache,
        ResponsiveScaleProfile: responsiveScaleProfile,
        LayoutRectMath: layoutRectMath,
        GeometryScale: geometryScale,
        StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
        StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
        StateScreenCanvasOverlay: loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js"),
        StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        SpringEasing: opts.springEasingModule || loadFresh("shared/widget-kits/anim/SpringEasing.js"),
        RadialToolkit: {
          create() {
            return {
              draw: {
                drawRing(ctx, cx, cy, rOuter, opts) {
                  calls.ring.push(opts);
                },
                drawTicks(ctx, cx, cy, rOuter, opts) {
                  calls.ticks.push(opts);
                },
                drawPointerAtRim(ctx, cx, cy, rOuter, angle, opts) {
                  calls.pointer.push(opts);
                },
                drawRimMarker(ctx, cx, cy, rOuter, angle, opts) {
                  calls.rimMarker.push({ angle, opts });
                }
              },
              angle: {
                degToCanvasRad(deg, cfg, rotationDeg) {
                  const d = Number(deg) + (Number(rotationDeg) || 0);
                  const norm = ((d % 360) + 360) % 360;
                  return ((norm - 90) * Math.PI) / 180;
                }
              },
              theme: {
                resolveForRoot() {
                  return theme;
                }
              },
              text: {
                measureValueUnitFit() {
                  return { vPx: 12, uPx: 10, gap: 6 };
                },
                drawCaptionMax() {
                  calls.textDraws += 1;
                },
                drawValueUnitWithFit() {
                  calls.textDraws += 1;
                },
                fitInlineCapValUnit() {
                  return { cPx: 10, vPx: 12, uPx: 10, gap: 6 };
                },
                drawInlineCapValUnit() {
                  calls.textDraws += 1;
                },
                fitTextPx() {
                  return 12;
                },
                drawThreeRowsBlock() {
                  calls.textDraws += 1;
                },
                drawDisconnectOverlay() {}
              },
              value: {
                clamp(value, lo, hi) {
                  const n = Number(value);
                  if (!isFinite(n)) return lo;
                  return Math.max(lo, Math.min(hi, n));
                },
                isFiniteNumber(value) {
                  return typeof value === "number" && isFinite(value);
                },
                resolveFiniteNumber(value, defaultValue) {
                  const n = Number(value);
                  return isFinite(n) ? n : defaultValue;
                },
                formatDirection360(value) {
                  const n = Number(value);
                  if (!isFinite(n)) return "---";
                  const norm = ((Math.round(n) % 360) + 360) % 360;
                  return String(norm).padStart(3, "0");
                }
              }
            };
          }
        }
      },
      services: {
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

  return {
    spec,
    calls,
    theme,
    computeLayout(width, height) {
      const api = fullCircleLayout.create(
        {},
        createComponentContextMock({
          modules: {
            ResponsiveScaleProfile: responsiveScaleProfile,
            LayoutRectMath: layoutRectMath,
            GeometryScale: geometryScale
          }
        })
      );
      const mode = api.computeMode(width, height, 0.8, 2.2);
      const insets = api.computeInsets(width, height);
      return api.computeLayout({
        W: width,
        H: height,
        mode: mode,
        theme: theme,
        insets: insets,
        responsive: insets.responsive,
        layoutConfig: { highTopFactor: 0.9, highBottomFactor: 0.9 }
      });
    }
  };
}

function makeCompassProps(overrides) {
  return Object.assign(
    {
      heading: 12,
      markerCourse: 30,
      caption: "HDG",
      unit: "°"
    },
    overrides || {}
  );
}

module.exports = {
  createCompassCachingHarness,
  makeCompassProps,
  createMockCanvas,
  createMockContext2D
};
