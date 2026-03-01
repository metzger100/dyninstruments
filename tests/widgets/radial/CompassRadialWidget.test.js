const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("CompassRadialWidget", function () {
  function createCompassCachingHarness() {
    const fullCircleEngine = loadFresh("shared/widget-kits/radial/FullCircleRadialEngine.js");
    const layerCache = loadFresh("shared/widget-kits/canvas/CanvasLayerCache.js");
    const textLayout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js");
    const calls = {
      ring: [],
      ticks: [],
      pointer: [],
      rimMarker: [],
      textDraws: 0
    };
    const theme = {
      colors: {
        pointer: "#ff2b2b"
      },
      radial: {
        ticks: {
          majorLen: 11,
          majorWidth: 3,
          minorLen: 4,
          minorWidth: 1.5
        },
        pointer: {
          sideFactor: 0.28,
          lengthFactor: 1.6
        },
        ring: {
          arcLineWidth: 2.2,
          widthFactor: 0.35
        },
        labels: {
          insetFactor: 2.1,
          fontFactor: 0.35
        }
      },
      font: {
        weight: 705,
        labelWeight: 645
      }
    };

    const spec = loadFresh("widgets/radial/CompassRadialWidget/CompassRadialWidget.js")
      .create({}, {
        setupCanvas(canvas) {
          const ctx = canvas.getContext("2d");
          const rect = canvas.getBoundingClientRect();
          return {
            ctx,
            W: Math.round(rect.width),
            H: Math.round(rect.height)
          };
        },
        resolveFontFamily() {
          return "sans-serif";
        },
        resolveTextColor() {
          return "#fff";
        },
        getModule(id) {
          if (id === "FullCircleRadialEngine") return fullCircleEngine;
          if (id === "FullCircleRadialTextLayout") return textLayout;
          if (id === "CanvasLayerCache") return layerCache;
          if (id !== "RadialToolkit") throw new Error("unexpected module: " + id);
          return {
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
                    calls.rimMarker.push(opts);
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
                  resolve() {
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
          };
        }
      });

    return { spec, calls, theme };
  }

  function makeCompassProps(overrides) {
    return Object.assign({
      heading: 12,
      markerCourse: 30,
      caption: "HDG",
      unit: "°"
    }, overrides || {});
  }

  it("uses theme pointer color for the fixed lubber marker", function () {
    const harness = createCompassCachingHarness();
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx
    });

    harness.spec.renderCanvas(canvas, makeCompassProps());

    expect(harness.calls.pointer[0].fillStyle).toBe(harness.theme.colors.pointer);
    expect(harness.calls.pointer[0].sideFactor).toBe(harness.theme.radial.pointer.sideFactor);
    expect(harness.calls.pointer[0].lengthFactor).toBe(harness.theme.radial.pointer.lengthFactor);
    expect(harness.calls.pointer[0].depth).toBe(15);
    expect(harness.calls.rimMarker[0]).toEqual({
      len: 15,
      width: 6,
      strokeStyle: harness.theme.colors.pointer
    });
    expect(harness.calls.ring[0].lineWidth).toBe(harness.theme.radial.ring.arcLineWidth);
    expect(harness.calls.ticks[0].major).toEqual({
      len: harness.theme.radial.ticks.majorLen,
      width: harness.theme.radial.ticks.majorWidth
    });
    expect(harness.calls.ticks[0].minor).toEqual({
      len: harness.theme.radial.ticks.minorLen,
      width: harness.theme.radial.ticks.minorWidth
    });
  });

  it("reuses static cache when heading changes (rotation does not invalidate)", function () {
    const harness = createCompassCachingHarness();
    const canvas = createMockCanvas({ rectWidth: 480, rectHeight: 110, ctx: createMockContext2D() });

    harness.spec.renderCanvas(canvas, makeCompassProps({ heading: 12 }));
    harness.spec.renderCanvas(canvas, makeCompassProps({ heading: 42 }));

    expect(harness.calls.ring).toHaveLength(1);
    expect(harness.calls.ticks).toHaveLength(1);
    expect(harness.calls.pointer).toHaveLength(2);
    expect(harness.calls.rimMarker).toHaveLength(2);
  });

  it("invalidates static cache on geometry/style changes", function () {
    const harness = createCompassCachingHarness();
    const canvasA = createMockCanvas({ rectWidth: 480, rectHeight: 110, ctx: createMockContext2D() });
    const canvasB = createMockCanvas({ rectWidth: 520, rectHeight: 110, ctx: createMockContext2D() });
    const props = makeCompassProps();

    harness.spec.renderCanvas(canvasA, props);
    harness.spec.renderCanvas(canvasA, props);
    expect(harness.calls.ring).toHaveLength(1);

    harness.spec.renderCanvas(canvasB, props);
    expect(harness.calls.ring).toHaveLength(2);

    harness.theme.radial.ring.arcLineWidth = 3.2;
    harness.spec.renderCanvas(canvasB, props);
    expect(harness.calls.ring).toHaveLength(3);
  });

  it("keeps dynamic text redraw active on static cache hits", function () {
    const harness = createCompassCachingHarness();
    const canvas = createMockCanvas({ rectWidth: 480, rectHeight: 110, ctx: createMockContext2D() });
    const props = makeCompassProps();

    harness.spec.renderCanvas(canvas, props);
    const firstTextCount = harness.calls.textDraws;
    harness.spec.renderCanvas(canvas, props);

    expect(harness.calls.ring).toHaveLength(1);
    expect(harness.calls.textDraws).toBeGreaterThan(firstTextCount);
  });
});
