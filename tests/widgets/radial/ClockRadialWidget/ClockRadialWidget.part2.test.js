const { loadFresh } = require("../../../helpers/load-umd");
const {
  createMockContext2D,
  createMockCanvas,
} = require("../../../helpers/mock-canvas");
const {
  createComponentContextMock,
} = require("../../../helpers/component-context-mock");

function mockDegToCanvasRad(deg) {
  const d = Number(deg);
  return ((d - 90) * Math.PI) / 180;
}

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
      rOuter: o.rOuter || 100,
    },
    labels: {
      fontPx: 14,
      spriteRadius: 75,
    },
    theme: {
      colors: { pointer: "#3366cc" },
      surface: { fg: "#000" },
    },
    angle: {
      degToCanvasRad: mockDegToCanvasRad,
    },
    value: {
      clamp: function (v, lo, hi) {
        var n = Number(v);
        if (!isFinite(n)) return lo;
        return Math.max(lo, Math.min(hi, n));
      },
    },
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
    setCacheMeta: function () {},
  };
}

describe("ClockRadialWidget", function () {
  function loadWidget() {
    return loadFresh("widgets/radial/ClockRadialWidget/ClockRadialWidget.js");
  }

  function createWidget(options) {
    var opts = options || {};
    var captured = {};
    var mockEngine = {
      createRenderer: function (cfg) {
        captured.spec = cfg;
        captured.buildStaticKey = cfg.buildStaticKey;
        captured.rebuildLayer = cfg.rebuildLayer;
        captured.drawFrame = cfg.drawFrame;
        return function (canvas, props) {
          var ctx = canvas.getContext && canvas.getContext("2d");
          var state = makeMockState(ctx, opts.overrides);
          captured.lastState = state;
          captured.lastProps = props;
          cfg.drawFrame(state, props, makeMockApi());
        };
      },
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
            },
          },
          GeometryScale: geometryScale,
        },
        services: {
          canvas: {
            setupCanvas: function (canvas) {
              var ctx = canvas.getContext("2d");
              var rect = canvas.getBoundingClientRect();
              return {
                ctx: ctx,
                W: Math.round(rect.width),
                H: Math.round(rect.height),
              };
            },
          },
        },
      }),
    );
    return { spec: spec, captured: captured };
  }

  it("returns null for unparseable strings and draws no hands", function () {
    var ctx = createMockContext2D();
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx,
    });
    result.spec.renderCanvas(canvas, {
      value: "not-a-time",
      hideSeconds: false,
    });
    var strokes = ctx.calls.filter(function (c) {
      return c.name === "stroke";
    });
    expect(strokes.length).toBe(0);
  });

  it("returns null for NaN and draws no hands", function () {
    var ctx = createMockContext2D();
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx,
    });
    result.spec.renderCanvas(canvas, { value: NaN, hideSeconds: false });
    var strokes = ctx.calls.filter(function (c) {
      return c.name === "stroke";
    });
    expect(strokes.length).toBe(0);
  });

  it("parses Date objects correctly", function () {
    var ctx = createMockContext2D();
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx,
    });
    var d = new Date("2026-05-25T15:30:00Z");
    result.spec.renderCanvas(canvas, { value: d, hideSeconds: false });
    var lineTos = ctx.calls.filter(function (c) {
      return c.name === "lineTo";
    });
    expect(lineTos.length).toBe(3);
  });

  it("parses numeric timestamps correctly", function () {
    var ctx = createMockContext2D();
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx,
    });
    var ts = new Date("2026-05-25T12:00:00Z").getTime();
    result.spec.renderCanvas(canvas, { value: ts, hideSeconds: false });
    var lineTos = ctx.calls.filter(function (c) {
      return c.name === "lineTo";
    });
    expect(lineTos.length).toBe(3);
  });

  it("skips second hand when hideSeconds is true", function () {
    var ctx = createMockContext2D();
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx,
    });
    result.spec.renderCanvas(canvas, { value: "12:00:00", hideSeconds: true });
    var lineTos = ctx.calls.filter(function (c) {
      return c.name === "lineTo";
    });
    expect(lineTos.length).toBe(2);
  });

  it("draws second hand when hideSeconds is false", function () {
    var ctx = createMockContext2D();
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx,
    });
    result.spec.renderCanvas(canvas, { value: "12:00:00", hideSeconds: false });
    var lineTos = ctx.calls.filter(function (c) {
      return c.name === "lineTo";
    });
    expect(lineTos.length).toBe(3);
  });

  it("uses pointer color for second hand", function () {
    var ctx = createMockContext2D();
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx,
    });
    result.spec.renderCanvas(canvas, { value: "12:00:00", hideSeconds: false });
    var strokeCalls = ctx.calls.filter(function (c) {
      return c.name === "stroke";
    });
    expect(strokeCalls.length).toBe(3);
  });

  it("draws center cap circle after hands", function () {
    var ctx = createMockContext2D();
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx,
    });
    result.spec.renderCanvas(canvas, { value: "12:00:00", hideSeconds: false });
    var arcCalls = ctx.calls.filter(function (c) {
      return c.name === "arc";
    });
    expect(arcCalls.length).toBeGreaterThan(0);
  });

  it("draws hour hand with lineCap round", function () {
    var ctx = createMockContext2D();
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx,
    });
    result.spec.renderCanvas(canvas, { value: "12:00:00", hideSeconds: false });
    expect(ctx.lineCap).toBe("round");
  });
});
