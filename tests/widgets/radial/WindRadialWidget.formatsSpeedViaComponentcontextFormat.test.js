// @ts-check
const {
  computeWindLayout,
  createComponentContextMock,
  createMockCanvas,
  createMockContext2D,
  loadFresh
} = require("./WindRadialWidget-setup");

describe("WindRadialWidget", function () {
  it("formats speed via componentContext.format.applyFormatter in graphic mode", function () {
    const fullCircleEngine = loadFresh("shared/widget-kits/radial/FullCircleRadialEngine.js");
    const fullCircleLayout = loadFresh("shared/widget-kits/radial/FullCircleRadialLayout.js");
    const layerCache = loadFresh("shared/widget-kits/canvas/CanvasLayerCache.js");
    const textLayout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js");
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMath = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const geometryScale = loadFresh("shared/widget-kits/layout/GeometryScale.js");
    // @ts-ignore -- pre-existing untyped test mock boundary
    const valueDrawCalls = [];
    // @ts-ignore -- pre-existing untyped test mock boundary
    const laylineCalls = [];
    // @ts-ignore -- pre-existing untyped test mock boundary
    const pointerCalls = [];
    // @ts-ignore -- pre-existing untyped test mock boundary
    const ringCalls = [];
    // @ts-ignore -- pre-existing untyped test mock boundary
    const tickCalls = [];
    // @ts-ignore -- pre-existing untyped test mock boundary
    const labelCalls = [];
    const themeDefaults = {
      surface: {
        fg: "#fff"
      },
      colors: {
        pointer: "#3366cc",
        laylineStb: "#2e9e6b",
        laylinePort: "#d9534a"
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
        weight: 720,
        labelWeight: 660
      }
    };
    const applyFormatter = vi.fn((value, spec) => {
      return "spd:" + String(value) + ":" + String(spec.formatterParameters[0]);
    });

    const spec = loadFresh("widgets/radial/WindRadialWidget/WindRadialWidget.js").create(
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
          ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js"),
          SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
          RadialToolkit: {
            create() {
              return {
                draw: {
                  // @ts-ignore -- pre-existing untyped test mock boundary
                  drawRing(ctx, cx, cy, rOuter, opts) {
                    ringCalls.push(opts);
                  },
                  // @ts-ignore -- pre-existing untyped test mock boundary
                  drawAnnularSector(ctx, cx, cy, rOuter, opts) {
                    laylineCalls.push(opts);
                  },
                  // @ts-ignore -- pre-existing untyped test mock boundary
                  drawPointerAtRim(ctx, cx, cy, rOuter, angle, opts) {
                    pointerCalls.push(opts);
                  },
                  // @ts-ignore -- pre-existing untyped test mock boundary
                  drawTicks(ctx, cx, cy, rOuter, opts) {
                    tickCalls.push(opts);
                  },
                  // @ts-ignore -- pre-existing untyped test mock boundary
                  drawLabels(ctx, cx, cy, rOuter, opts) {
                    labelCalls.push(opts);
                  }
                },
                theme: {
                  resolveForRoot() {
                    return themeDefaults;
                  }
                },
                text: {
                  measureValueUnitFit() {
                    return { vPx: 12, uPx: 10, gap: 6 };
                  },
                  drawCaptionMax() {},
                  // @ts-ignore -- pre-existing untyped test mock boundary
                  drawValueUnitWithFit(ctx, family, x, y, w, h, valueText, unitText) {
                    valueDrawCalls.push({
                      valueText: String(valueText),
                      unitText: String(unitText || "")
                    });
                  },
                  fitInlineCapValUnit() {
                    return { cPx: 10, vPx: 12, uPx: 10, gap: 6 };
                  },
                  drawInlineCapValUnit() {},
                  fitTextPx() {
                    return 12;
                  },
                  drawThreeRowsBlock() {}
                },
                value: {
                  // @ts-ignore -- pre-existing untyped test mock boundary
                  clamp(value, lo, hi) {
                    const n = Number(value);
                    if (!isFinite(n)) return lo;
                    return Math.max(lo, Math.min(hi, n));
                  },
                  // @ts-ignore -- pre-existing untyped test mock boundary
                  isFiniteNumber(value) {
                    return typeof value === "number" && isFinite(value);
                  },
                  // @ts-ignore -- pre-existing untyped test mock boundary
                  resolveFiniteNumber(value, defaultValue) {
                    const n = Number(value);
                    return isFinite(n) ? n : defaultValue;
                  },
                  // @ts-ignore -- pre-existing untyped test mock boundary
                  formatAngle180(value) {
                    const n = Number(value);
                    if (!isFinite(n)) return "---";
                    return String(Math.round(n));
                  }
                },
                angle: {}
              };
            }
          }
        },
        services: {
          format: { applyFormatter },
          canvas: {
            // @ts-ignore -- pre-existing untyped test mock boundary
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
            // @ts-ignore -- pre-existing untyped test mock boundary
            requirePluginRoot(target) {
              return target;
            }
          }
        }
      })
    );

    const canvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D()
    });
    spec.renderCanvas(canvas, {
      angle: 23,
      speed: 5.5,
      angleCaption: "AWA",
      speedCaption: "AWS",
      angleUnit: "°",
      speedUnit: "kn",
      windRadialLayMin: 35,
      windRadialLayMax: 45,
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    });
    const layout = computeWindLayout(themeDefaults, 480, 110);

    expect(applyFormatter).toHaveBeenCalledWith(
      5.5,
      expect.objectContaining({
        formatter: "formatSpeed",
        formatterParameters: ["kn"]
      })
    );
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(valueDrawCalls.some((c) => c.valueText === "spd:5.5:kn" && c.unitText === "kn")).toBe(true);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(laylineCalls[0].fillStyle).toBe(themeDefaults.colors.laylineStb);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(laylineCalls[1].fillStyle).toBe(themeDefaults.colors.laylinePort);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(laylineCalls[0].thickness).toBe(layout.geom.ringW);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(laylineCalls[1].thickness).toBe(layout.geom.ringW);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(pointerCalls[0].fillStyle).toBe(themeDefaults.colors.pointer);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(pointerCalls[0].depth).toBe(layout.geom.pointerDepth);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(pointerCalls[0].halfWidth).toBe(Math.max(1, Math.floor(layout.geom.pointerSide / 2)));
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(ringCalls[0].lineWidth).toBe(layout.geom.arcLineWidth);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(tickCalls[0].major).toEqual({
      len: layout.geom.majorTickLen,
      width: layout.geom.majorTickWidth
    });
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(tickCalls[0].minor).toEqual({
      len: layout.geom.minorTickLen,
      width: layout.geom.minorTickWidth
    });
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(labelCalls[0].radiusOffset).toBe(layout.labels.radiusOffset);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(labelCalls[0].fontPx).toBe(layout.labels.fontPx);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(labelCalls[0].weight).toBe(themeDefaults.font.labelWeight);

    [null, undefined, "", "   "].forEach(function (speedRaw) {
      const applyCallsBefore = applyFormatter.mock.calls.length;
      const drawCallsBefore = valueDrawCalls.length;
      spec.renderCanvas(canvas, {
        angle: 23,
        speed: speedRaw,
        angleCaption: "AWA",
        speedCaption: "AWS",
        angleUnit: "°",
        speedUnit: "kn",
        windRadialLayMin: 35,
        windRadialLayMax: 45,
        formatter: "formatSpeed",
        formatterParameters: ["kn"]
      });

      expect(applyFormatter.mock.calls.length).toBe(applyCallsBefore);
      // @ts-ignore -- pre-existing untyped test mock boundary
      const newDraws = valueDrawCalls.slice(drawCallsBefore);
      expect(newDraws.some((c) => c.valueText === "---" && c.unitText === "kn")).toBe(true);
    });

    const applyCallsBeforeValid = applyFormatter.mock.calls.length;
    spec.renderCanvas(canvas, {
      angle: 23,
      speed: "4.2",
      angleCaption: "AWA",
      speedCaption: "AWS",
      angleUnit: "°",
      speedUnit: "kn",
      windRadialLayMin: 35,
      windRadialLayMax: 45,
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    });
    expect(applyFormatter.mock.calls.length).toBeGreaterThan(applyCallsBeforeValid);
    expect(applyFormatter).toHaveBeenLastCalledWith(
      4.2,
      expect.objectContaining({
        formatter: "formatSpeed",
        formatterParameters: ["kn"]
      })
    );
  });
});
