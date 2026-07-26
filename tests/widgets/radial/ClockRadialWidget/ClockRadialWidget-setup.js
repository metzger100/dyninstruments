const { loadFresh } = require("../../../helpers/load-umd");

const { createMockContext2D, createMockCanvas } = require("../../../helpers/mock-canvas");

const { createComponentContextMock } = require("../../../helpers/component-context-mock");

// @ts-ignore -- pre-existing untyped test mock boundary
function mockDegToCanvasRad(deg) {
  const d = Number(deg);
  return ((d - 90) * Math.PI) / 180;
}

// @ts-ignore -- pre-existing untyped test mock boundary
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
      // @ts-ignore -- pre-existing untyped test mock boundary
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

function loadWidget() {
  return loadFresh("widgets/radial/ClockRadialWidget/ClockRadialWidget.js");
}

// @ts-ignore -- pre-existing untyped test mock boundary
function createWidget(options) {
  var opts = options || {};
  var captured = {};
  var mockEngine = {
    // @ts-ignore -- pre-existing untyped test mock boundary
    createRenderer: function (cfg) {
      // @ts-ignore -- pre-existing untyped test mock boundary
      captured.spec = cfg;
      // @ts-ignore -- pre-existing untyped test mock boundary
      captured.buildStaticKey = cfg.buildStaticKey;
      // @ts-ignore -- pre-existing untyped test mock boundary
      captured.rebuildLayer = cfg.rebuildLayer;
      // @ts-ignore -- pre-existing untyped test mock boundary
      captured.drawFrame = cfg.drawFrame;
      // @ts-ignore -- pre-existing untyped test mock boundary
      return function (canvas, props) {
        var ctx = canvas.getContext && canvas.getContext("2d");
        var state = makeMockState(ctx, opts.overrides);
        // @ts-ignore -- pre-existing untyped test mock boundary
        captured.lastState = state;
        // @ts-ignore -- pre-existing untyped test mock boundary
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
          // @ts-ignore -- pre-existing untyped test mock boundary
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

module.exports = {
  createComponentContextMock,
  createMockCanvas,
  createMockContext2D,
  createWidget,
  loadFresh,
  loadWidget,
  makeMockApi,
  makeMockState,
  mockDegToCanvasRad
};
