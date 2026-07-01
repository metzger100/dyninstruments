const { loadFresh } = require("../../helpers/load-umd");
const {
  createMockCanvas,
  createMockContext2D,
} = require("../../helpers/mock-canvas");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

  function createHarness(options) {
    const opts = options || {};
    const calls = {
      stateKinds: [],
      tracks: [],
      ticks: [],
      metricTiles: [],
      metricMeasures: [],
      waypointMeasures: [],
      waypointDraws: [],
      ensureKeys: [],
      tickLabelValues: [],
      fillColors: [],
    };

    const theme = {
      surface: { fg: "#ffffff" },
      colors: {
        pointer: "#44ccff",
        alarm: "#ff5533",
      },
      font: {
        family: "sans-serif",
        familyMono: "monospace",
        weight: 700,
        labelWeight: 620,
      },
      opacity: {
        caption: 0.75,
        unit: 0.75,
      },
      strokeWeight: 1,
      pointerDepthWeight: 1,
      pointerSideWeight: 1,
      linear: {
        track: { widthFactor: 0.16, lineWidthFactor: 0.018 },
        ticks: {
          majorLenFactor: 0.109,
          majorWidthFactor: 0.027,
          minorLenFactor: 0.064,
          minorWidthFactor: 0.014,
        },
        pointer: {
          depthFactor: 0.24,
          sideFactor: 0.12,
        },
        labels: {
          insetFactor: 1.8,
          fontFactor: 0.14,
        },
      },
    };

    const realCacheApi = loadFresh(
      "shared/widget-kits/canvas/CanvasLayerCache.js",
    ).create({}, createComponentContextMock());
    const canvasLayerCache = {
      id: "CanvasLayerCache",
      createLayerCache(spec) {
        const cache = realCacheApi.createLayerCache(spec);
        return {
          ensureLayer(canvas, key, rebuildFn) {
            calls.ensureKeys.push(key);
            return cache.ensureLayer(canvas, key, rebuildFn);
          },
          blit: cache.blit,
          blitLayer: cache.blitLayer,
          invalidate: cache.invalidate,
        };
      },
    };

    const realPrimitives = loadFresh(
      "shared/widget-kits/linear/LinearCanvasPrimitives.js",
    ).create();
    const primitives = {
      id: "LinearCanvasPrimitives",
      drawTrack(ctx, x0, x1, y, style) {
        calls.tracks.push({ x0: x0, x1: x1, y: y, style: style });
        return realPrimitives.drawTrack(ctx, x0, x1, y, style);
      },
      drawBand: realPrimitives.drawBand,
      drawTick(ctx, x, y, len, style) {
        calls.ticks.push({ x: x, y: y, len: len, style: style });
        return realPrimitives.drawTick(ctx, x, y, len, style);
      },
      drawPointer: realPrimitives.drawPointer,
    };

    const gaugeMathModule = loadFresh(
      "shared/widget-kits/linear/LinearGaugeMath.js",
    );
    const linearGaugeMath = {
      create(def, componentContext) {
        const api = gaugeMathModule.create(def, componentContext);
        const realFormatTickLabel = api.formatTickLabel;
        return Object.assign({}, api, {
          formatTickLabel(value) {
            calls.tickLabelValues.push(value);
            return realFormatTickLabel(value);
          },
        });
      },
    };

    const tileLayout = {
      id: "TextTileLayout",
      drawMetricTile(args) {
        calls.metricTiles.push(args.metric);
      },
      measureMetricTile(args) {
        calls.metricMeasures.push(args.metric);
        if (opts.forceStableDigitsClip === true) {
          return {
            fit: { total: 100 },
            textW: 10,
          };
        }
        return {
          fit: { total: 0 },
          textW: 10,
        };
      },
      measureFittedLine(args) {
        calls.waypointMeasures.push(args);
        if (opts.blockWaypointName === true) {
          return null;
        }
        return {
          text: String(args.text || ""),
          px: Math.min(12, Number(args.maxPx) || 12),
        };
      },
      drawFittedLine(args) {
        calls.waypointDraws.push(args);
      },
    };

    const gaugeToolkit = {
      create() {
        return {
          theme: {
            resolveForRoot() {
              return theme;
            },
          },
          value: {
            isFiniteNumber(value) {
              return typeof value === "number" && Number.isFinite(value);
            },
            clampNumber(value, min, max, fallback) {
              const n = Number(value);
              if (!Number.isFinite(n)) {
                return fallback;
              }
              return Math.max(min, Math.min(max, n));
            },
            trimText(value) {
              return typeof value === "string" ? value.trim() : "";
            },
          },
          text: {
            setFont(ctx, px, weight, family) {
              ctx.font = String(weight) + " " + String(px) + "px " + family;
            },
          },
        };
      },
    };

    const stateOverlay = {
      id: "StateScreenCanvasOverlay",
      drawStateScreen(args) {
        calls.stateKinds.push(args.kind);
      },
    };

    const applyFormatter =
      typeof opts.applyFormatter === "function"
        ? opts.applyFormatter
        : function (value, spec) {
            if (value == null || Number.isNaN(value)) {
              return spec &&
                Object.prototype.hasOwnProperty.call(spec, "default")
                ? spec.default
                : "---";
            }
            if (spec && spec.formatter === "formatDistance") {
              return Number(value).toFixed(2);
            }
            if (spec && spec.formatter === "formatDirection360") {
              const rounded = ((Math.round(Number(value)) % 360) + 360) % 360;
              const leading = !!(
                spec.formatterParameters && spec.formatterParameters[0]
              );
              return leading
                ? String(rounded).padStart(3, "0")
                : String(rounded);
            }
            return String(value);
          };

    const spec = loadFresh(
      "widgets/text/XteDisplayLinearWidget/XteDisplayLinearWidget.js",
    ).create(
      {},
      createComponentContextMock({
        modules: {
          CanvasLayerCache: canvasLayerCache,
          GaugeToolkit: gaugeToolkit,
          LinearCanvasPrimitives: primitives,
          LinearGaugeMath: linearGaugeMath,
          GeometryScale: loadFresh(
            "shared/widget-kits/layout/GeometryScale.js",
          ),
          XteLinearLayout: loadFresh(
            "shared/widget-kits/xte/XteLinearLayout.js",
          ),
          TextTileLayout: tileLayout,
          SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
          PlaceholderNormalize: loadFresh(
            "shared/widget-kits/format/PlaceholderNormalize.js",
          ),
          StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
          UnitAwareFormatter: loadFresh(
            "shared/widget-kits/format/UnitAwareFormatter.js",
          ),
          StateScreenLabels: loadFresh(
            "shared/widget-kits/state/StateScreenLabels.js",
          ),
          StateScreenPrecedence: loadFresh(
            "shared/widget-kits/state/StateScreenPrecedence.js",
          ),
          StateScreenCanvasOverlay: stateOverlay,
          ResponsiveScaleProfile: loadFresh(
            "shared/widget-kits/layout/ResponsiveScaleProfile.js",
          ),
          LayoutRectMath: loadFresh(
            "shared/widget-kits/layout/LayoutRectMath.js",
          ),
          LayoutSizingHelpers: loadFresh(
            "shared/widget-kits/layout/LayoutSizingHelpers.js",
          ),
        },
        services: {
          format: { applyFormatter: applyFormatter },
          canvas: {
            setupCanvas(canvas) {
              const ctx = canvas.getContext("2d");
              const rect = canvas.getBoundingClientRect();
              return {
                ctx: ctx,
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

    return { spec: spec, calls: calls, theme: theme };
  }

  function createCanvas(width, height) {
    const ctx = createMockContext2D();
    const fill = ctx.fill.bind(ctx);
    const fillColors = [];
    ctx.fill = function () {
      fillColors.push(ctx.fillStyle);
      return fill.apply(null, arguments);
    };
    const canvas = createMockCanvas({
      rectWidth: width,
      rectHeight: height,
      ctx: ctx,
    });
    return { canvas: canvas, ctx: ctx, fillColors: fillColors };
  }

  function makeProps(overrides) {
    const base = {
      display: {
        xte: 0.25,
        cog: 93,
        dtw: 0.72,
        btw: 92,
        wpName: "Fairway Buoy",
        disconnect: false,
      },
      captions: {
        xte: "XTE",
        track: "COG",
        dtw: "DST",
        brg: "BRG",
      },
      units: {
        xte: "nm",
        track: "°",
        dtw: "nm",
        brg: "°",
      },
      formatUnits: {
        xte: "nm",
        dtw: "nm",
      },
      xteScale: 1,
      layout: {
        leadingZero: true,
        showWpName: false,
        hideTextualMetrics: false,
        easing: true,
        ratioThresholdNormal: 0.85,
        ratioThresholdFlat: 2.3,
        tickMajor: 1,
        tickMinor: 0.25,
        showEndLabels: true,
      },
      stableDigits: false,
      default: "---",
    };
    const merged = Object.assign({}, base, overrides || {});

    if (overrides && overrides.display) {
      merged.display = Object.assign({}, base.display, overrides.display);
    }
    if (overrides && overrides.captions) {
      merged.captions = Object.assign({}, base.captions, overrides.captions);
    }
    if (overrides && overrides.units) {
      merged.units = Object.assign({}, base.units, overrides.units);
    }
    if (overrides && overrides.formatUnits) {
      merged.formatUnits = Object.assign(
        {},
        base.formatUnits,
        overrides.formatUnits,
      );
    }
    if (overrides && overrides.layout) {
      merged.layout = Object.assign({}, base.layout, overrides.layout);
    }

    return merged;
  }

  function findPointerTriangles(ctxCalls) {
    const triangles = [];
    for (let i = 0; i + 5 < ctxCalls.length; i += 1) {
      if (
        ctxCalls[i].name === "beginPath" &&
        ctxCalls[i + 1].name === "moveTo" &&
        ctxCalls[i + 2].name === "lineTo" &&
        ctxCalls[i + 3].name === "lineTo" &&
        ctxCalls[i + 4].name === "closePath" &&
        ctxCalls[i + 5].name === "fill"
      ) {
        triangles.push({
          tip: ctxCalls[i + 1].args,
          leftBase: ctxCalls[i + 2].args,
          rightBase: ctxCalls[i + 3].args,
        });
      }
    }
    return triangles;
  }

module.exports = {
  createHarness,
  createMockCanvas,
  createMockContext2D,
  createCanvas,
  makeProps,
  findPointerTriangles,
};

globalThis.createCanvas = createCanvas;
globalThis.makeProps = makeProps;
globalThis.findPointerTriangles = findPointerTriangles;
