const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("XteDisplayLinearWidget", function () {
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
      fillColors: []
    };

    const theme = {
      surface: { fg: "#ffffff" },
      colors: {
        pointer: "#44ccff",
        alarm: "#ff5533"
      },
      font: {
        family: "sans-serif",
        familyMono: "monospace",
        weight: 700,
        labelWeight: 620
      },
      opacity: {
        caption: 0.75,
        unit: 0.75
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
          minorWidthFactor: 0.014
        },
        pointer: {
          depthFactor: 0.24,
          sideFactor: 0.12
        },
        labels: {
          insetFactor: 1.8,
          fontFactor: 0.14
        }
      }
    };

    const realCacheApi = loadFresh("shared/widget-kits/canvas/CanvasLayerCache.js").create({}, createComponentContextMock());
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
          invalidate: cache.invalidate
        };
      }
    };

    const realPrimitives = loadFresh("shared/widget-kits/linear/LinearCanvasPrimitives.js").create();
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
      drawPointer: realPrimitives.drawPointer
    };

    const gaugeMathModule = loadFresh("shared/widget-kits/linear/LinearGaugeMath.js");
    const linearGaugeMath = {
      create(def, componentContext) {
        const api = gaugeMathModule.create(def, componentContext);
        const realFormatTickLabel = api.formatTickLabel;
        return Object.assign({}, api, {
          formatTickLabel(value) {
            calls.tickLabelValues.push(value);
            return realFormatTickLabel(value);
          }
        });
      }
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
            textW: 10
          };
        }
        return {
          fit: { total: 0 },
          textW: 10
        };
      },
      measureFittedLine(args) {
        calls.waypointMeasures.push(args);
        if (opts.blockWaypointName === true) {
          return null;
        }
        return {
          text: String(args.text || ""),
          px: Math.min(12, Number(args.maxPx) || 12)
        };
      },
      drawFittedLine(args) {
        calls.waypointDraws.push(args);
      }
    };

    const gaugeToolkit = {
      create() {
        return {
          theme: {
            resolveForRoot() {
              return theme;
            }
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
            }
          },
          text: {
            setFont(ctx, px, weight, family) {
              ctx.font = String(weight) + " " + String(px) + "px " + family;
            }
          }
        };
      }
    };

    const stateOverlay = {
      id: "StateScreenCanvasOverlay",
      drawStateScreen(args) {
        calls.stateKinds.push(args.kind);
      }
    };

    const applyFormatter = typeof opts.applyFormatter === "function"
      ? opts.applyFormatter
      : function (value, spec) {
        if (value == null || Number.isNaN(value)) {
          return spec && Object.prototype.hasOwnProperty.call(spec, "default")
            ? spec.default
            : "---";
        }
        if (spec && spec.formatter === "formatDistance") {
          return Number(value).toFixed(2);
        }
        if (spec && spec.formatter === "formatDirection360") {
          const rounded = ((Math.round(Number(value)) % 360) + 360) % 360;
          const leading = !!(spec.formatterParameters && spec.formatterParameters[0]);
          return leading ? String(rounded).padStart(3, "0") : String(rounded);
        }
        return String(value);
      };

    const spec = loadFresh("widgets/text/XteDisplayLinearWidget/XteDisplayLinearWidget.js").create({}, createComponentContextMock({
      modules: {
        CanvasLayerCache: canvasLayerCache,
        GaugeToolkit: gaugeToolkit,
        LinearCanvasPrimitives: primitives,
        LinearGaugeMath: linearGaugeMath,
        GeometryScale: loadFresh("shared/widget-kits/layout/GeometryScale.js"),
        XteLinearLayout: loadFresh("shared/widget-kits/xte/XteLinearLayout.js"),
        TextTileLayout: tileLayout,
        SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
        UnitAwareFormatter: loadFresh("shared/widget-kits/format/UnitAwareFormatter.js"),
        StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
        StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
        StateScreenCanvasOverlay: stateOverlay,
        ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
        LayoutSizingHelpers: loadFresh("shared/widget-kits/layout/LayoutSizingHelpers.js")
      },
      services: {
        format: { applyFormatter: applyFormatter },
        canvas: {
          setupCanvas(canvas) {
            const ctx = canvas.getContext("2d");
            const rect = canvas.getBoundingClientRect();
            return { ctx: ctx, W: Math.round(rect.width), H: Math.round(rect.height) };
          }
        },
        dom: {
          requirePluginRoot(target) {
            return target;
          }
        }
      }
    }));

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
      ctx: ctx
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
        disconnect: false
      },
      captions: {
        xte: "XTE",
        track: "COG",
        dtw: "DST",
        brg: "BRG"
      },
      units: {
        xte: "nm",
        track: "°",
        dtw: "nm",
        brg: "°"
      },
      formatUnits: {
        xte: "nm",
        dtw: "nm"
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
        showEndLabels: true
      },
      stableDigits: false,
      default: "---"
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
      merged.formatUnits = Object.assign({}, base.formatUnits, overrides.formatUnits);
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
          rightBase: ctxCalls[i + 3].args
        });
      }
    }
    return triangles;
  }

  it("creates widget with expected id and wantsHideNativeHead", function () {
    const h = createHarness();

    expect(h.spec.id).toBe("XteDisplayLinearWidget");
    expect(h.spec.wantsHideNativeHead).toBe(true);
    expect(typeof h.spec.renderCanvas).toBe("function");
  });

  it("renders disconnected and noTarget states through the state-screen overlay", function () {
    const h = createHarness();
    const disconnected = createCanvas(320, 180);
    const noTarget = createCanvas(320, 180);

    h.spec.renderCanvas(disconnected.canvas, makeProps({
      display: {
        disconnect: true,
        wpName: "Fairway Buoy"
      }
    }));
    h.spec.renderCanvas(noTarget.canvas, makeProps({
      display: {
        disconnect: false,
        wpName: "   "
      }
    }));

    expect(h.calls.stateKinds).toEqual(["disconnected", "noTarget"]);
    expect(h.calls.tracks).toHaveLength(0);
  });

  it("draws static gauge layer and uses flat/normal/high modes by canvas ratio", function () {
    const h = createHarness();

    h.spec.renderCanvas(createCanvas(520, 140).canvas, makeProps());
    h.spec.renderCanvas(createCanvas(220, 220).canvas, makeProps());
    h.spec.renderCanvas(createCanvas(120, 320).canvas, makeProps());

    expect(h.calls.tracks.length).toBeGreaterThanOrEqual(3);
    expect(h.calls.ticks.length).toBeGreaterThan(0);
    expect(h.calls.ensureKeys[0].mode).toBe("flat");
    expect(h.calls.ensureKeys[1].mode).toBe("normal");
    expect(h.calls.ensureKeys[2].mode).toBe("high");
  });

  it("draws an upward-pointing pointer below the track at the expected x position", function () {
    const h = createHarness();
    const cv = createCanvas(360, 180);

    h.spec.renderCanvas(cv.canvas, makeProps({
      display: {
        xte: 0,
        wpName: "Fairway Buoy"
      }
    }));

    const track = h.calls.tracks[0];
    const triangles = findPointerTriangles(cv.ctx.calls);
    const pointer = triangles[triangles.length - 1];
    const expectedCenter = Math.round((track.x0 + track.x1) / 2);

    expect(pointer).toBeTruthy();
    expect(pointer.tip[0]).toBe(expectedCenter);
    expect(pointer.tip[1]).toBeGreaterThan(track.y);
    expect(pointer.leftBase[1]).toBeGreaterThan(pointer.tip[1]);
    expect(pointer.rightBase[1]).toBeGreaterThan(pointer.tip[1]);
  });

  it("clamps overflow pointer to the gauge edge and uses alarm color", function () {
    const h = createHarness();
    const cv = createCanvas(360, 180);

    h.spec.renderCanvas(cv.canvas, makeProps({
      display: { xte: 3 },
      xteScale: 1
    }));

    const track = h.calls.tracks[0];
    const triangles = findPointerTriangles(cv.ctx.calls);
    const pointer = triangles[triangles.length - 1];

    expect(pointer.tip[0]).toBe(Math.round(track.x1));
    expect(cv.fillColors).toContain(h.theme.colors.alarm);
  });

  it("uses pointer color within range", function () {
    const h = createHarness();
    const cv = createCanvas(360, 180);

    h.spec.renderCanvas(cv.canvas, makeProps({
      display: { xte: 0.4 },
      xteScale: 1
    }));

    expect(cv.fillColors).toContain(h.theme.colors.pointer);
  });

  it("returns wantsFollowUpFrame when spring easing is active", function () {
    const h = createHarness();
    const cv = createCanvas(360, 180);
    const nowSpy = vi.spyOn(Date, "now");
    let now = 1000;
    nowSpy.mockImplementation(function () {
      now += 16;
      return now;
    });

    h.spec.renderCanvas(cv.canvas, makeProps({
      display: { xte: 0.1 }
    }));
    const followUp = h.spec.renderCanvas(cv.canvas, makeProps({
      display: { xte: 0.9 }
    }));

    expect(followUp).toEqual({ wantsFollowUpFrame: true });
    nowSpy.mockRestore();
  });

  it("suppresses text metrics when hideTextualMetrics is enabled", function () {
    const h = createHarness();
    const cv = createCanvas(360, 180);

    h.spec.renderCanvas(cv.canvas, makeProps({
      layout: {
        hideTextualMetrics: true
      }
    }));

    expect(h.calls.metricTiles).toHaveLength(0);
  });

  it("renders four metric tiles with expected captions and L/R suffix on XTE", function () {
    const h = createHarness();
    const cv = createCanvas(360, 180);

    h.spec.renderCanvas(cv.canvas, makeProps({
      display: {
        xte: -0.52,
        cog: 8,
        dtw: 1.24,
        btw: 12
      }
    }));

    expect(h.calls.metricTiles).toHaveLength(4);
    expect(h.calls.metricTiles.map(function (metric) { return metric.caption; })).toEqual(["COG", "XTE", "DST", "BRG"]);
    const xteMetric = h.calls.metricTiles.find(function (metric) { return metric.caption === "XTE"; });
    expect(xteMetric.value.endsWith("L")).toBe(true);
  });

  it("falls back from padded stable digits to plain text when tile fit clips", function () {
    const h = createHarness({ forceStableDigitsClip: true });
    const cv = createCanvas(360, 180);

    h.spec.renderCanvas(cv.canvas, makeProps({
      stableDigits: true,
      display: {
        xte: 1.2
      }
    }));

    const xteMetric = h.calls.metricTiles.find(function (metric) { return metric.caption === "XTE"; });
    expect(xteMetric.value).toBe("1.20R");
  });

  it("draws tick labels only for min/max and hides labels when showEndLabels is false", function () {
    const withLabels = createHarness();
    withLabels.spec.renderCanvas(createCanvas(360, 180).canvas, makeProps({
      xteScale: 1,
      layout: {
        tickMajor: 1,
        showEndLabels: true
      }
    }));
    expect(withLabels.calls.tickLabelValues).toEqual([-1, 1]);

    const withoutLabels = createHarness();
    withoutLabels.spec.renderCanvas(createCanvas(360, 180).canvas, makeProps({
      xteScale: 1,
      layout: {
        tickMajor: 1,
        showEndLabels: false
      }
    }));
    expect(withoutLabels.calls.tickLabelValues).toEqual([]);
  });

  it("renders waypoint name only when enabled and space check succeeds", function () {
    const shown = createHarness();
    const hidden = createHarness({ blockWaypointName: true });

    shown.spec.renderCanvas(createCanvas(360, 180).canvas, makeProps({
      layout: { showWpName: true },
      display: { wpName: "Waypoint Alpha" }
    }));
    hidden.spec.renderCanvas(createCanvas(360, 180).canvas, makeProps({
      layout: { showWpName: true },
      display: { wpName: "Waypoint Alpha" }
    }));

    expect(shown.calls.waypointMeasures.length).toBeGreaterThan(0);
    expect(shown.calls.waypointDraws.length).toBe(1);
    expect(hidden.calls.waypointDraws.length).toBe(0);
  });

  it("invalidates static layer cache in finalizeFunction", function () {
    const h = createHarness();
    const cv = createCanvas(360, 180);
    const props = makeProps();

    h.spec.renderCanvas(cv.canvas, props);
    h.spec.renderCanvas(cv.canvas, props);
    const beforeFinalize = h.calls.tracks.length;

    h.spec.finalizeFunction();
    h.spec.renderCanvas(cv.canvas, props);
    const afterFinalize = h.calls.tracks.length;

    expect(beforeFinalize).toBe(1);
    expect(afterFinalize).toBe(2);
  });
});
