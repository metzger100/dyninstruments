const { loadFresh } = require("../../../helpers/load-umd");
const { createMockContext2D, createMockCanvas } = require("../../../helpers/mock-canvas");
const { createComponentContextMock } = require("../../../helpers/component-context-mock");

/** @param {any} deg */
function mockDegToCanvasRad(deg) {
  const d = Number(deg);
  return ((d - 90) * Math.PI) / 180;
}

/** @param {any} ctx @param {any} [overrides] */
function makeMockState(ctx, overrides) {
  var o = overrides || {};
  return {
    ctx: ctx,
    W: o.W || 240,
    H: o.H || 240,
    dpr: 1,
    color: "#000",
    family: "sans-serif",
    valueWeight: 700,
    labelWeight: 645,
    mode: "normal",
    geom: {
      cx: o.cx || 120,
      cy: o.cy || 120,
      rOuter: o.rOuter || 100
    },
    labels: {
      fontPx: 14,
      spriteRadius: 75
    },
    theme: {
      colors: { pointer: "#3366cc" },
      surface: { fg: "#000" }
    },
    angle: {
      degToCanvasRad: mockDegToCanvasRad
    },
    value: {
      /** @param {any} v @param {any} lo @param {any} hi */
      clamp: function (v, lo, hi) {
        var n = Number(v);
        if (!isFinite(n)) return lo;
        return Math.max(lo, Math.min(hi, n));
      }
    }
  };
}

function makeMockApi() {
  return {
    drawCachedLayer: function () {},
    drawFullCircleRing: function () {},
    drawFullCircleTicks: function () {},
    getCacheMeta: function () {
      return null;
    },
    setCacheMeta: function () {}
  };
}

describe("ClockRadialWidget", function () {
  function loadWidget() {
    return loadFresh("widgets/radial/ClockRadialWidget/ClockRadialWidget.js");
  }

  /** @param {any} [options] */
  function createWidget(options) {
    var opts = options || {};
    /** @type {Record<string, any>} */
    var captured = {};
    var mockEngine = {
      /** @param {any} cfg */
      createRenderer: function (cfg) {
        captured.spec = cfg;
        captured.buildStaticKey = cfg.buildStaticKey;
        captured.rebuildLayer = cfg.rebuildLayer;
        captured.drawFrame = cfg.drawFrame;
        /** @param {any} canvas @param {any} props */
        return function (canvas, props) {
          var ctx = canvas.getContext && canvas.getContext("2d");
          var state = makeMockState(ctx, opts.overrides);
          captured.lastState = state;
          captured.lastProps = props;
          cfg.drawFrame(state, props, makeMockApi());
        };
      }
    };
    var geometryScale = loadFresh("shared/widget-kits/layout/GeometryScale.js");
    var mod = loadWidget();
    var spec = mod.create(
      {},
      createComponentContextMock({
        modules: {
          FullCircleRadialEngine: {
            create: function () {
              return mockEngine;
            }
          },
          GeometryScale: geometryScale
        },
        services: {
          canvas: {
            /** @param {any} canvas */
            setupCanvas: function (canvas) {
              var ctx = canvas.getContext("2d");
              var rect = canvas.getBoundingClientRect();
              return {
                ctx: ctx,
                W: Math.round(rect.width),
                H: Math.round(rect.height)
              };
            }
          }
        }
      })
    );
    return { spec: spec, captured: captured };
  }

  it("exports module with id and create function", function () {
    var mod = loadWidget();
    expect(mod.id).toBe("ClockRadialWidget");
    expect(typeof mod.create).toBe("function");
  });

  it("returns widget spec with correct properties", function () {
    var result = createWidget();
    expect(result.spec.id).toBe("ClockRadialWidget");
    expect(result.spec.wantsHideNativeHead).toBe(true);
    expect(typeof result.spec.renderCanvas).toBe("function");
    expect(typeof result.spec.translateFunction).toBe("function");
  });

  it("configures renderer with clock-specific ratio props, single face layer, no text modes", function () {
    var result = createWidget();
    expect(result.captured.spec.ratioProps).toEqual({
      normal: "clockRadialRatioThresholdNormal",
      flat: "clockRadialRatioThresholdFlat"
    });
    expect(result.captured.spec.cacheLayers).toEqual(["face"]);
    expect(result.captured.spec).not.toHaveProperty("ratioDefaults");
    expect(result.captured.spec).not.toHaveProperty("hideTextualMetricsProp");
    expect(result.captured.spec).not.toHaveProperty("drawMode");
  });

  it("buildStaticKey returns label geometry and tick signature", function () {
    var result = createWidget();
    var state = makeMockState(createMockContext2D());
    var key = result.captured.buildStaticKey(state);
    expect(key).toEqual({
      labelPx: 14,
      labelRadius: 75,
      tickSig: "1-12|major30|minor6"
    });
  });

  it("rebuildLayer draws ring, ticks with major30/minor6, and hour labels 1-12", function () {
    var result = createWidget();
    var ctx = createMockContext2D();
    var state = makeMockState(ctx);
    result.captured.rebuildLayer(ctx, "face", state, {}, makeMockApi());
    var textCalls = ctx.calls.filter(
      /** @param {any} c */ function (c) {
        return c.name === "fillText";
      }
    );
    var labelTexts = textCalls.map(
      /** @param {any} c */ function (c) {
        return String(c.args[0]);
      }
    );
    expect(labelTexts).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);
    expect(ctx.fillStyle).toBe("#000");
    expect(ctx.textAlign).toBe("center");
    expect(ctx.textBaseline).toBe("middle");
  });

  it("skips non-face layer in rebuildLayer", function () {
    var result = createWidget();
    var ctx = createMockContext2D();
    var state = makeMockState(ctx);
    result.captured.rebuildLayer(ctx, "other", state, {}, makeMockApi());
    expect(
      ctx.calls.filter(
        /** @param {any} c */ function (c) {
          return c.name === "fillText";
        }
      )
    ).toHaveLength(0);
  });

  it("parses ISO 8601 date string and draws hands at correct positions", function () {
    var ctx = createMockContext2D();
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx
    });
    result.spec.renderCanvas(canvas, {
      value: "2026-05-25T12:00:00Z",
      hideSeconds: false
    });
    var moveTos = ctx.calls.filter(
      /** @param {any} c */ function (c) {
        return c.name === "moveTo";
      }
    );
    var lineTos = ctx.calls.filter(
      /** @param {any} c */ function (c) {
        return c.name === "lineTo";
      }
    );
    expect(moveTos.length).toBeGreaterThanOrEqual(3);
    expect(lineTos.length).toBeGreaterThanOrEqual(3);
  });

  it("computes correct hand angles for 3:00:00 — hour at 90°, minute at 0°, second at 0°", function () {
    var ctx = createMockContext2D();
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx
    });
    result.spec.renderCanvas(canvas, {
      value: "03:00:00",
      hideSeconds: false
    });
    var lineTos = ctx.calls.filter(
      /** @param {any} c */ function (c) {
        return c.name === "lineTo";
      }
    );
    expect(lineTos.length).toBe(3);
    expect(lineTos[1].args[0]).toBe(100);
    expect(lineTos[2].args[0]).toBe(100);
    expect(lineTos[0].args[0]).toBeGreaterThan(100);
  });

  it("computes correct hand angles for 6:30:00 — minute at 180° down, second at 0° up", function () {
    var ctx = createMockContext2D();
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx
    });
    result.spec.renderCanvas(canvas, {
      value: "06:30:00",
      hideSeconds: false
    });
    var lineTos = ctx.calls.filter(
      /** @param {any} c */ function (c) {
        return c.name === "lineTo";
      }
    );
    expect(lineTos.length).toBe(3);
    expect(lineTos[1].args[0]).toBe(100);
    expect(lineTos[1].args[1]).toBe(152);
    expect(lineTos[2].args[0]).toBe(100);
    expect(lineTos[2].args[1]).toBe(36);
  });

  it("computes correct hand angles for 9:15:30 — hour=277.5° left, minute=93° right, second=180° down", function () {
    var ctx = createMockContext2D();
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx
    });
    result.spec.renderCanvas(canvas, {
      value: "09:15:30",
      hideSeconds: false
    });
    var lineTos = ctx.calls.filter(
      /** @param {any} c */ function (c) {
        return c.name === "lineTo";
      }
    );
    expect(lineTos.length).toBe(3);
    expect(lineTos[0].args[0]).toBeLessThan(100);
    expect(lineTos[1].args[0]).toBeGreaterThan(100);
    expect(lineTos[2].args[0]).toBe(100);
    expect(lineTos[2].args[1]).toBeGreaterThan(100);
  });

  it("returns null for invalid inputs and draws no hands", function () {
    var ctx = createMockContext2D();
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx
    });
    result.spec.renderCanvas(canvas, { value: null, hideSeconds: false });
    var strokes = ctx.calls.filter(
      /** @param {any} c */ function (c) {
        return c.name === "stroke";
      }
    );
    expect(strokes.length).toBe(0);
  });

  it("returns null for empty string and draws no hands", function () {
    var ctx = createMockContext2D();
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx
    });
    result.spec.renderCanvas(canvas, { value: "", hideSeconds: false });
    var strokes = ctx.calls.filter(
      /** @param {any} c */ function (c) {
        return c.name === "stroke";
      }
    );
    expect(strokes.length).toBe(0);
  });
});
