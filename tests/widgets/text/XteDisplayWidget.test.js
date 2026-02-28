const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("XteDisplayWidget", function () {
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
      waypointChecks: []
    };

    const theme = {
      colors: {
        pointer: "#aa0011",
        laylineStb: "#00aa66",
        laylinePort: "#cc4466",
        warning: "#ccaa33",
        alarm: "#ff3344"
      },
      font: {
        weight: 720,
        labelWeight: 640
      }
    };

    const layerCache = loadFresh("shared/widget-kits/gauge/CanvasLayerCache.js");
    const realPrimitives = loadFresh("shared/widget-kits/gauge/XteHighwayPrimitives.js").create();

    const spec = loadFresh("widgets/text/XteDisplayWidget/XteDisplayWidget.js").create({}, {
      applyFormatter(value, opts) {
        if (opts.formatter === "formatDistance") {
          if (typeof value !== "number" || !isFinite(value)) {
            return "---";
          }
          return (value / distanceDivisor).toFixed(2);
        }
        if (opts.formatter === "formatDirection360") {
          if (typeof value !== "number" || !isFinite(value)) {
            return "---";
          }
          const rounded = ((Math.round(value) % 360) + 360) % 360;
          const leading = !!(opts.formatterParameters && opts.formatterParameters[0]);
          return leading ? String(rounded).padStart(3, "0") : String(rounded);
        }
        return String(value);
      },
      setupCanvas(canvas) {
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        return {
          ctx,
          W: Math.round(rect.width),
          H: Math.round(rect.height)
        };
      },
      resolveTextColor() {
        return "#ffffff";
      },
      resolveFontFamily() {
        return "sans-serif";
      },
      getModule(id) {
        if (id === "CanvasLayerCache") {
          return layerCache;
        }
        if (id === "GaugeToolkit") {
          return {
            create() {
              return {
                theme: {
                  resolve() {
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
                  drawCaptionMax(ctx, family, x, y, w, h, caption) {
                    calls.captionRows.push({ caption: String(caption), w, h });
                  },
                  measureValueUnitFit() {
                    return { vPx: 12, uPx: 10, gap: 6, total: 0 };
                  },
                  drawValueUnitWithFit(ctx, family, x, y, w, h, value, unit) {
                    calls.valueRows.push({ value: String(value), unit: String(unit || ""), w, h });
                  }
                }
              };
            }
          };
        }
        if (id === "XteHighwayPrimitives") {
          return {
            create() {
              return {
                computeMode(W, H, thresholdNormal, thresholdFlat, modeFn) {
                  const mode = realPrimitives.computeMode(W, H, thresholdNormal, thresholdFlat, modeFn);
                  calls.modeHistory.push(mode);
                  return mode;
                },
                computeLayout(W, H, pad, gap, mode, options) {
                  const layout = realPrimitives.computeLayout(W, H, pad, gap, mode, options);
                  calls.layoutHistory.push(layout);
                  return layout;
                },
                highwayGeometry: realPrimitives.highwayGeometry,
                drawStaticHighway(ctx, geom, colors, textColor, mode) {
                  calls.staticDraws.push({ colors, textColor, mode, geom });
                },
                drawDynamicHighway(ctx, geom, colors, xteNormalized, overflow) {
                  calls.dynamicDraws.push({ colors, xteNormalized, overflow, geom });
                },
                shouldShowWaypoint(mode, rect, showWpName, name) {
                  const result = realPrimitives.shouldShowWaypoint(mode, rect, showWpName, name);
                  calls.waypointChecks.push({ mode, showWpName, name, result, rect });
                  return result;
                }
              };
            }
          };
        }
        throw new Error("Unexpected module: " + id);
      }
    });

    return { spec, calls, theme };
  }

  function makeProps(overrides) {
    return Object.assign({
      xte: 0.25,
      cog: 93,
      dtw: 0.72,
      btw: 92,
      wpName: "Fairway Buoy",
      trackCaption: "COG",
      xteCaption: "XTE",
      dtwCaption: "DST",
      btwCaption: "BRG",
      xteUnit: "nm",
      trackUnit: "°",
      dtwUnit: "nm",
      btwUnit: "°",
      headingUnit: "°",
      leadingZero: true,
      showWpName: true,
      xteRatioThresholdNormal: 0.85,
      xteRatioThresholdFlat: 2.3
    }, overrides || {});
  }

  it("selects flat/normal/high modes from aspect ratio", function () {
    const harness = createHarness();

    harness.spec.renderCanvas(createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() }), makeProps());
    harness.spec.renderCanvas(createMockCanvas({ rectWidth: 220, rectHeight: 220, ctx: createMockContext2D() }), makeProps());
    harness.spec.renderCanvas(createMockCanvas({ rectWidth: 120, rectHeight: 300, ctx: createMockContext2D() }), makeProps());

    expect(harness.calls.modeHistory[0]).toBe("flat");
    expect(harness.calls.modeHistory[1]).toBe("normal");
    expect(harness.calls.modeHistory[2]).toBe("high");
  });

  it("uses theme token colors in static and dynamic highway calls", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({ rectWidth: 320, rectHeight: 180, ctx: createMockContext2D() });

    harness.spec.renderCanvas(canvas, makeProps());

    expect(harness.calls.staticDraws[0].colors.pointer).toBe(harness.theme.colors.pointer);
    expect(harness.calls.staticDraws[0].colors.warning).toBe(harness.theme.colors.warning);
    expect(harness.calls.staticDraws[0].colors.alarm).toBe(harness.theme.colors.alarm);
    expect(harness.calls.dynamicDraws[0].colors.laylineStb).toBe(harness.theme.colors.laylineStb);
    expect(harness.calls.dynamicDraws[0].colors.laylinePort).toBe(harness.theme.colors.laylinePort);
  });

  it("hides waypoint name before core metrics in constrained layouts", function () {
    const harness = createHarness();
    const narrowCtx = createMockContext2D();
    const narrowCanvas = createMockCanvas({ rectWidth: 160, rectHeight: 80, ctx: narrowCtx });

    harness.spec.renderCanvas(narrowCanvas, makeProps({ showWpName: true }));

    const fillTexts = narrowCtx.calls.filter((entry) => entry.name === "fillText");
    expect(fillTexts).toHaveLength(0);
    expect(harness.calls.valueRows).toHaveLength(4);
    expect(harness.calls.waypointChecks[harness.calls.waypointChecks.length - 1].result).toBe(false);
  });

  it("reuses header space for metric rows in flat mode when waypoint name is disabled", function () {
    const harness = createHarness();
    const wideCanvasA = createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() });
    const wideCanvasB = createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() });

    harness.spec.renderCanvas(wideCanvasA, makeProps({ showWpName: true, wpName: "Fairway Buoy" }));
    harness.spec.renderCanvas(wideCanvasB, makeProps({ showWpName: false, wpName: "Fairway Buoy" }));

    const layoutWithName = harness.calls.layoutHistory[0];
    const layoutWithoutName = harness.calls.layoutHistory[1];

    expect(layoutWithName.mode).toBe("flat");
    expect(layoutWithoutName.mode).toBe("flat");
    expect(layoutWithoutName.metricRects.cog.y).toBeLessThan(layoutWithName.metricRects.cog.y);
    expect(layoutWithoutName.metricRects.cog.h).toBeGreaterThan(layoutWithName.metricRects.cog.h);
  });

  it("uses equal two-column metric widths in high mode", function () {
    const harness = createHarness();

    harness.spec.renderCanvas(
      createMockCanvas({ rectWidth: 120, rectHeight: 300, ctx: createMockContext2D() }),
      makeProps({ showWpName: true, wpName: "Fairway Buoy" })
    );

    const layout = harness.calls.layoutHistory[0];
    expect(layout.mode).toBe("high");
    expect(layout.metricRects.cog.w).toBe(layout.metricRects.btw.w);
    expect(layout.metricRects.xte.w).toBe(layout.metricRects.dtw.w);
    expect(layout.metricRects.xte.w).toBe(layout.metricRects.cog.w);
  });

  it("reduces top highway whitespace in flat/normal/high when waypoint name is disabled", function () {
    const harness = createHarness();

    harness.spec.renderCanvas(
      createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() }),
      makeProps({ showWpName: true, wpName: "Fairway Buoy" })
    );
    harness.spec.renderCanvas(
      createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() }),
      makeProps({ showWpName: false, wpName: "Fairway Buoy" })
    );
    harness.spec.renderCanvas(
      createMockCanvas({ rectWidth: 220, rectHeight: 220, ctx: createMockContext2D() }),
      makeProps({ showWpName: true, wpName: "Fairway Buoy" })
    );
    harness.spec.renderCanvas(
      createMockCanvas({ rectWidth: 220, rectHeight: 220, ctx: createMockContext2D() }),
      makeProps({ showWpName: false, wpName: "Fairway Buoy" })
    );
    harness.spec.renderCanvas(
      createMockCanvas({ rectWidth: 120, rectHeight: 300, ctx: createMockContext2D() }),
      makeProps({ showWpName: true, wpName: "Fairway Buoy" })
    );
    harness.spec.renderCanvas(
      createMockCanvas({ rectWidth: 120, rectHeight: 300, ctx: createMockContext2D() }),
      makeProps({ showWpName: false, wpName: "Fairway Buoy" })
    );

    const flatOn = harness.calls.staticDraws[0].geom;
    const flatOff = harness.calls.staticDraws[1].geom;
    const normalOn = harness.calls.staticDraws[2].geom;
    const normalOff = harness.calls.staticDraws[3].geom;
    const highOn = harness.calls.staticDraws[4].geom;
    const highOff = harness.calls.staticDraws[5].geom;

    expect(flatOff.horizonY).toBeLessThan(flatOn.horizonY);
    expect(normalOff.horizonY).toBeLessThan(normalOn.horizonY);
    expect(highOff.horizonY).toBeLessThan(highOn.horizonY);
  });

  it("uses fixed +/-1 XTE scale for marker normalization", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({ rectWidth: 300, rectHeight: 180, ctx: createMockContext2D() });

    harness.spec.renderCanvas(canvas, makeProps({ xte: 0.1 }));
    harness.spec.renderCanvas(canvas, makeProps({ xte: 1.0 }));
    harness.spec.renderCanvas(canvas, makeProps({ xte: 0.2 }));
    harness.spec.renderCanvas(canvas, makeProps({ xte: 0.2 }));
    harness.spec.renderCanvas(canvas, makeProps({ xte: 0.2 }));
    harness.spec.renderCanvas(canvas, makeProps({ xte: 0.2 }));

    expect(harness.calls.dynamicDraws[0].xteNormalized).toBeCloseTo(0.1, 6);
    expect(harness.calls.dynamicDraws[1].xteNormalized).toBeCloseTo(1.0, 6);
    expect(harness.calls.dynamicDraws[2].xteNormalized).toBeCloseTo(0.2, 6);
    expect(harness.calls.dynamicDraws[5].xteNormalized).toBeCloseTo(0.2, 6);
  });

  it("reuses static cache for stable inputs and invalidates on geometry changes", function () {
    const harness = createHarness();
    const canvasA = createMockCanvas({ rectWidth: 320, rectHeight: 180, ctx: createMockContext2D() });
    const canvasB = createMockCanvas({ rectWidth: 360, rectHeight: 180, ctx: createMockContext2D() });

    harness.spec.renderCanvas(canvasA, makeProps());
    harness.spec.renderCanvas(canvasA, makeProps());
    expect(harness.calls.staticDraws).toHaveLength(1);

    harness.spec.renderCanvas(canvasB, makeProps());
    expect(harness.calls.staticDraws).toHaveLength(2);
  });

  it("fails closed with NO DATA overlay when required values are missing", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({ rectWidth: 320, rectHeight: 180, ctx: createMockContext2D() });

    harness.spec.renderCanvas(canvas, makeProps({ xte: undefined }));
    expect(harness.calls.overlays).toBe(1);
    expect(harness.calls.dynamicDraws).toHaveLength(0);

    harness.spec.renderCanvas(canvas, makeProps({ disconnect: true }));
    expect(harness.calls.overlays).toBe(2);
  });

  it("shows DST unit with nm fallback in metric rows", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({ rectWidth: 320, rectHeight: 180, ctx: createMockContext2D() });

    harness.spec.renderCanvas(canvas, makeProps({ dtwUnit: undefined }));

    expect(harness.calls.valueRows[2].unit).toBe("nm");
  });

  it("uses dedicated track and bearing units when provided", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({ rectWidth: 320, rectHeight: 180, ctx: createMockContext2D() });

    harness.spec.renderCanvas(canvas, makeProps({
      trackUnit: "degT",
      btwUnit: "degM"
    }));

    expect(harness.calls.valueRows[0].unit).toBe("degT");
    expect(harness.calls.valueRows[3].unit).toBe("degM");
  });

  it("falls back to heading unit when dedicated track/bearing units are missing", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({ rectWidth: 320, rectHeight: 180, ctx: createMockContext2D() });

    harness.spec.renderCanvas(canvas, makeProps({
      trackUnit: undefined,
      btwUnit: undefined,
      headingUnit: "degH"
    }));

    expect(harness.calls.valueRows[0].unit).toBe("degH");
    expect(harness.calls.valueRows[3].unit).toBe("degH");
  });

  it("normalizes marker placement using formatted distance magnitude", function () {
    const harness = createHarness({ distanceDivisor: 1852 });
    const canvas = createMockCanvas({ rectWidth: 320, rectHeight: 180, ctx: createMockContext2D() });

    harness.spec.renderCanvas(canvas, makeProps({ xte: 1852 }));

    expect(harness.calls.dynamicDraws).toHaveLength(1);
    expect(harness.calls.dynamicDraws[0].overflow).toBe(false);
    expect(harness.calls.dynamicDraws[0].xteNormalized).toBeCloseTo(1.0, 6);
  });
});
