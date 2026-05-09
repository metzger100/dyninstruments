const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("CompassRadialWidget", function () {
  it("passes full-circle ratio props without wrapper-owned ratioDefaults", function () {
    let captured;
    const renderCanvas = vi.fn();

    const spec = loadFresh("widgets/radial/CompassRadialWidget/CompassRadialWidget.js").create({}, createComponentContextMock({
      modules: {
        StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
        FullCircleRadialTextLayout: { create() { return {}; } },
        FullCircleRadialEngine: { create() { return { createRenderer(cfg) { captured = cfg; return renderCanvas; } }; } }
      }
    }));

    expect(spec.renderCanvas).toBe(renderCanvas);
    expect(captured.ratioProps).toEqual({
      normal: "compassRadialRatioThresholdNormal",
      flat: "compassRadialRatioThresholdFlat"
    });
    expect(captured.hideTextualMetricsProp).toBe("compassRadialHideTextualMetrics");
    expect(captured).not.toHaveProperty("ratioDefaults");
  });

  it("eases markerCourse independently from heading and keeps follow-up frames alive while either motion is active", function () {
    const headingMotion = {
      active: false,
      resolves: [],
      resolve(canvas, target, easingEnabled, nowMs) {
        this.resolves.push({ canvas, target, easingEnabled, nowMs });
        this.active = false;
        return Number(target);
      },
      isActive() {
        return this.active;
      }
    };
    const markerMotion = {
      active: false,
      resolves: [],
      resolve(canvas, target, easingEnabled, nowMs) {
        this.resolves.push({ canvas, target, easingEnabled, nowMs });
        this.active = easingEnabled === true;
        return Number(target) + 100;
      },
      isActive() {
        return this.active;
      }
    };
    const springEasingModule = {
      create() {
        let motionIndex = 0;
        return {
          createMotion(spec) {
            expect(spec).toEqual({ wrap: 360 });
            const motion = motionIndex === 0 ? headingMotion : markerMotion;
            motionIndex += 1;
            return motion;
          }
        };
      }
    };
    const harness = createCompassCachingHarness({ springEasingModule: springEasingModule });
    const canvas = createMockCanvas({ rectWidth: 480, rectHeight: 110, ctx: createMockContext2D() });
    const layout = harness.computeLayout(480, 110);

    expect(harness.spec.renderCanvas(canvas, makeCompassProps({ heading: 20, markerCourse: 10 }))).toEqual({ wantsFollowUpFrame: true });
    expect(harness.spec.renderCanvas(canvas, makeCompassProps({ heading: 20, markerCourse: 300 }))).toEqual({ wantsFollowUpFrame: true });
    expect(headingMotion.resolves).toHaveLength(2);
    expect(markerMotion.resolves).toHaveLength(2);
    expect(headingMotion.resolves[0]).toEqual(expect.objectContaining({ canvas, target: 20, easingEnabled: true }));
    expect(markerMotion.resolves[0]).toEqual(expect.objectContaining({ canvas, target: 10, easingEnabled: true }));
    expect(markerMotion.resolves[1]).toEqual(expect.objectContaining({ canvas, target: 300, easingEnabled: true }));
    expect(harness.calls.rimMarker).toHaveLength(2);
    expect(harness.calls.rimMarker[0]).toEqual({
      angle: 90,
      opts: {
        len: layout.geom.markerLen,
        width: layout.geom.markerWidth,
        strokeStyle: harness.theme.colors.pointer
      }
    });
    expect(harness.calls.rimMarker[1]).toEqual({
      angle: 380,
      opts: {
        len: layout.geom.markerLen,
        width: layout.geom.markerWidth,
        strokeStyle: harness.theme.colors.pointer
      }
    });
  });

  it("skips drawing a stale marker when markerCourse is invalid", function () {
    const markerMotion = {
      active: false,
      resolve: vi.fn(),
      isActive() {
        return false;
      }
    };
    const springEasingModule = {
      create() {
        let motionIndex = 0;
        return {
          createMotion() {
            motionIndex += 1;
            return motionIndex === 1
              ? {
                active: false,
                resolve: vi.fn(function (canvas, target, easingEnabled, nowMs) {
                  void canvas;
                  void target;
                  void easingEnabled;
                  void nowMs;
                  return 20;
                }),
                isActive() {
                  return false;
                }
              }
              : markerMotion;
          }
        };
      }
    };
    const harness = createCompassCachingHarness({ springEasingModule: springEasingModule });
    const canvas = createMockCanvas({ rectWidth: 480, rectHeight: 110, ctx: createMockContext2D() });

    expect(harness.spec.renderCanvas(canvas, makeCompassProps({ heading: 20, markerCourse: undefined }))).toBeUndefined();
    expect(markerMotion.resolve).not.toHaveBeenCalled();
    expect(harness.calls.rimMarker).toHaveLength(0);
  });

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
        pointer: "#ff2b2b"
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

    const spec = loadFresh("widgets/radial/CompassRadialWidget/CompassRadialWidget.js")
      .create({}, createComponentContextMock({
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
      }));

    return {
      spec,
      calls,
      theme,
      computeLayout(width, height) {
        const api = fullCircleLayout.create({}, createComponentContextMock({
          modules: {
            ResponsiveScaleProfile: responsiveScaleProfile,
            LayoutRectMath: layoutRectMath,
            GeometryScale: geometryScale
          }
        }));
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
    const layout = harness.computeLayout(480, 110);

    expect(harness.calls.pointer[0].fillStyle).toBe(harness.theme.colors.pointer);
    expect(harness.calls.pointer[0].depth).toBe(layout.geom.fixedPointerDepth);
    expect(harness.calls.pointer[0].halfWidth).toBe(Math.max(1, Math.floor(layout.geom.pointerSide / 2)));
    expect(harness.calls.rimMarker[0].opts).toEqual({
      len: layout.geom.markerLen,
      width: layout.geom.markerWidth,
      strokeStyle: harness.theme.colors.pointer
    });
    expect(harness.calls.ring[0].lineWidth).toBe(layout.geom.arcLineWidth);
    expect(harness.calls.ticks[0].major).toEqual({
      len: layout.geom.majorTickLen,
      width: layout.geom.majorTickWidth
    });
    expect(harness.calls.ticks[0].minor).toEqual({
      len: layout.geom.minorTickLen,
      width: layout.geom.minorTickWidth
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

    harness.theme.radial.ring.arcLineWidthFactor = 0.08;
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

  it("keeps spring state keyed by canvas and snaps immediately when easing is disabled", function () {
    const harness = createCompassCachingHarness();
    const canvasA = createMockCanvas({ rectWidth: 480, rectHeight: 110, ctx: createMockContext2D() });
    const canvasB = createMockCanvas({ rectWidth: 480, rectHeight: 110, ctx: createMockContext2D() });
    const nowSpy = vi.spyOn(Date, "now");

    try {
      nowSpy.mockReturnValue(0);
      expect(harness.spec.renderCanvas(canvasA, makeCompassProps({ heading: 12 }))).toBeUndefined();

      nowSpy.mockReturnValue(16);
      expect(harness.spec.renderCanvas(canvasA, makeCompassProps({ heading: 42 }))).toEqual({ wantsFollowUpFrame: true });

      nowSpy.mockReturnValue(16);
      expect(harness.spec.renderCanvas(canvasB, makeCompassProps({ heading: 42 }))).toBeUndefined();

      nowSpy.mockReturnValue(32);
      expect(harness.spec.renderCanvas(canvasA, makeCompassProps({ heading: 42, easing: false }))).toBeUndefined();
    }
    finally {
      nowSpy.mockRestore();
    }
  });
});
