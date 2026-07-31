const { loadFresh } = require("../../helpers/load-umd");

const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

/**
 * @typedef {{ applyFormatter?: (raw: unknown, props?: Record<string, unknown>) => unknown }} ContextOptions
 * @typedef {{ args: unknown[], name: string }} CanvasCall
 * @typedef {{ __ctx: DyniTestCanvasContext, getBoundingClientRect: () => DOMRect, getContext: (kind: string) => DyniTestCanvasContext | null }} TestCanvas
 * @typedef {{ renderCanvas: (canvas: TestCanvas, props: unknown) => void }} CanvasRenderer
 * @typedef {{ font: string, text: string, x: unknown, y: unknown }} TextCall
 */

/** @param {ContextOptions} [options] */
function makeComponentContext(options) {
  const opts = options || {};
  /** @param {unknown} raw @param {Record<string, unknown>} [props] */
  const defaultApplyFormatter = (raw, props) => {
    const fallback = props && Object.prototype.hasOwnProperty.call(props, "default") ? props.default : "---";
    if (raw === null || raw === undefined || Number.isNaN(raw)) return fallback;
    return String(raw);
  };
  const applyFormatter = vi.fn(typeof opts.applyFormatter === "function" ? opts.applyFormatter : defaultApplyFormatter);
  const modules = {
    TextLayoutEngine: loadFresh("shared/widget-kits/text/TextLayoutEngine.js"),
    TextLayoutPrimitives: loadFresh("shared/widget-kits/text/TextLayoutPrimitives.js"),
    TextLayoutComposite: loadFresh("shared/widget-kits/text/TextLayoutComposite.js"),
    ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
    ThemeResolver: {
      resolveForRoot() {
        return {
          surface: { fg: "#fff" },
          font: {
            family: "sans-serif",
            familyMono: "monospace",
            weight: 730,
            labelWeight: 610
          }
        };
      }
    },
    CanvasTextLayout: {
      create() {
        return {
          /** @param {string} family @param {{ monoFamily?: string, useMono?: boolean }} [options] */
          resolveFamily(family, options) {
            if (options && options.useMono === true) {
              return options.monoFamily || family;
            }
            return family;
          },
          /** @param {DyniTestCanvasContext} ctx @param {number} px @param {number} weight @param {string} family */
          setFont(ctx, px, weight, family) {
            const size = Math.max(1, Math.floor(Number(px) || 0));
            const fontWeight = Math.floor(Number(weight));
            ctx.font = String(fontWeight) + " " + size + "px " + (family || "sans-serif");
          },
          drawDisconnectOverlay() {}
        };
      }
    },
    ValueMath: {
      create() {
        return {
          /** @param {unknown} value */
          isFiniteNumber(value) {
            return typeof value === "number" && isFinite(value);
          },
          /** @param {number} value @param {number} lo @param {number} hi */
          clamp(value, lo, hi) {
            const n = Number(value);
            if (!isFinite(n)) return Number(lo);
            return Math.max(Number(lo), Math.min(Number(hi), n));
          },
          /** @param {number} value @param {number} lo @param {number} hi @param {number} fallbackValue */
          clampNumber(value, lo, hi, fallbackValue) {
            const n = Number(value);
            if (!Number.isFinite(n)) {
              return Number(fallbackValue);
            }
            return Math.max(Number(lo), Math.min(Number(hi), n));
          },
          /** @param {number} from @param {number} to @param {number} t */
          lerp(from, to, t) {
            return from + (to - from) * t;
          },
          /** @param {unknown} value */
          toText(value) {
            return value === null || value === undefined ? "" : String(value).trim();
          },
          /** @param {number} ratio @param {number} thresholdNormal @param {number} thresholdFlat */
          computeMode(ratio, thresholdNormal, thresholdFlat) {
            if (ratio < thresholdNormal) return "high";
            if (ratio > thresholdFlat) return "flat";
            return "normal";
          }
        };
      }
    },
    PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
    StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
    StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
    StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
    StateScreenCanvasOverlay: loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js")
  };
  return createComponentContextMock({
    modules,
    services: {
      format: { applyFormatter },
      canvas: {
        /** @param {TestCanvas} canvas */
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
        /** @param {Element} target */
        requirePluginRoot(target) {
          return target;
        }
      }
    }
  });
}

/** @param {CanvasCall[]} calls @param {string} name */
function countByName(calls, name) {
  return calls.filter((entry) => entry.name === name).length;
}

/** @param {CanvasRenderer} spec @param {TestCanvas} canvas @param {unknown} props */
function renderFrame(spec, canvas, props) {
  const ctx = canvas.__ctx;
  const beforeCallCount = ctx.calls.length;
  spec.renderCanvas(canvas, props);
  const frameCalls = ctx.calls.slice(beforeCallCount);
  return {
    measureDelta: countByName(frameCalls, "measureText"),
    fillDelta: countByName(frameCalls, "fillText"),
    fillEntries: frameCalls
      .filter((entry) => entry.name === "fillText")
      .map((entry) => ({
        text: String(entry.args[0]),
        x: entry.args[1],
        y: entry.args[2]
      }))
  };
}

/** @param {DyniTestCanvasContext} ctx @returns {TextCall[]} */
function captureTextCalls(ctx) {
  const captured = /** @type {TextCall[]} */ ([]);
  const originalFillText = ctx.fillText;
  /** @this {DyniTestCanvasContext} @param {...unknown} args */
  ctx.fillText = function (...args) {
    captured.push({
      text: String(args[0]),
      x: args[1],
      y: args[2],
      font: ctx.font
    });
    return originalFillText.call(this, String(args[0]), Number(args[1]), Number(args[2]));
  };
  return captured;
}

/** @param {string} font */
function parseFontPx(font) {
  const match = /(\d+)px/.exec(String(font || ""));
  return match ? Number(match[1]) : 0;
}

/** @param {CanvasRenderer} spec @param {number} width @param {number} height @param {unknown} props */
function renderCaptured(spec, width, height, props) {
  const ctx = createMockContext2D();
  const canvas = createMockCanvas({
    rectWidth: width,
    rectHeight: height,
    ctx: ctx
  });
  const captured = captureTextCalls(ctx);
  spec.renderCanvas(canvas, props);
  return captured;
}

/** @param {TextCall[]} calls @param {string} text */
function findTextCall(calls, text) {
  return calls.find((entry) => entry.text === text);
}

module.exports = {
  captureTextCalls,
  countByName,
  createComponentContextMock,
  createMockCanvas,
  createMockContext2D,
  findTextCall,
  loadFresh,
  makeComponentContext,
  parseFontPx,
  renderCaptured,
  renderFrame
};
