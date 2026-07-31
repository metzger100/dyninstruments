const { loadFresh } = require("../../../helpers/load-umd");

const { createMockContext2D, createMockCanvas } = require("../../../helpers/mock-canvas");

const { createComponentContextMock } = require("../../../helpers/component-context-mock");

/**
 * @typedef {{ H?: number, W?: number, cx?: number, cy?: number, rOuter?: number }} StateOverrides
 * @typedef {{ buildStaticKey?: unknown, drawFrame: (state: object, props: unknown, api: object) => void, rebuildLayer?: unknown }} RendererConfig
 * @typedef {{ buildStaticKey?: unknown, drawFrame?: unknown, lastProps?: unknown, lastState?: unknown, rebuildLayer?: unknown, spec?: unknown }} Captured
 * @typedef {{ getContext?: (kind: string) => unknown }} CanvasLike
 */

/** @param {number} deg */
function mockDegToCanvasRad(deg) {
  const d = Number(deg);
  return ((d - 90) * Math.PI) / 180;
}

/** @param {unknown} ctx @param {StateOverrides} [overrides] */
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
      /** @param {number} v @param {number} lo @param {number} hi */
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

/** @param {{ overrides?: StateOverrides }} [options] */
function createWidget(options) {
  var opts = options || {};
  var captured = /** @type {Captured} */ ({});
  var mockEngine = {
    /** @param {RendererConfig} cfg */
    createRenderer: function (cfg) {
      captured.spec = cfg;
      captured.buildStaticKey = cfg.buildStaticKey;
      captured.rebuildLayer = cfg.rebuildLayer;
      captured.drawFrame = cfg.drawFrame;
      /** @param {CanvasLike} canvas @param {unknown} props */
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
          /** @param {{ getBoundingClientRect: () => DOMRect, getContext: (kind: string) => unknown }} canvas */
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
