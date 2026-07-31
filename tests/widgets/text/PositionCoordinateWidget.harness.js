const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

/**
 * @typedef {{ formatter?: string | ((...args: unknown[]) => unknown), formatterParameters?: unknown, default?: unknown }} FormatterCallProps
 * @typedef {(raw: unknown, props?: FormatterCallProps) => unknown} ApplyFormatterFn
 * @typedef {{ applyFormatter?: ApplyFormatterFn, fitKeyCalls?: unknown[] }} MakeComponentContextOptions
 * @typedef {{ makeFitCacheKey: (parts: unknown) => unknown } & Record<string, unknown>} TextLayoutEngineHandle
 * @typedef {{ create(def: unknown, helperApi: unknown): TextLayoutEngineHandle }} TextLayoutEngineFactory
 * @typedef {{
 *   TextLayoutPrimitives: unknown,
 *   TextLayoutComposite: unknown,
 *   ResponsiveScaleProfile: unknown,
 *   TextLayoutEngine?: TextLayoutEngineFactory
 * }} ModulesBag
 * @typedef {{ weight: number, px: number }} FontCallRecord
 * @typedef {DyniTestComponentContext & { fontWeightCalls: number[], fontCalls: FontCallRecord[] }} PositionCoordinateComponentContext
 * @typedef {{ text: string, x: number, y: number, font: string }} CapturedTextCall
 */

/** @type {{ api?: DyniTestAvnavApi } | undefined} */
let previousAvnav;

beforeEach(function () {
  previousAvnav = globalThis.avnav;
  delete globalThis.avnav;
});

afterEach(function () {
  if (typeof previousAvnav === "undefined") delete globalThis.avnav;
  else globalThis.avnav = previousAvnav;
});

/**
 * @param {MakeComponentContextOptions} [options]
 * @returns {PositionCoordinateComponentContext}
 */
function makeComponentContext(options) {
  const opts = options || {};
  const fitKeyCalls = Array.isArray(opts.fitKeyCalls) ? opts.fitKeyCalls : null;
  const themeTokens = {
    surface: { fg: "#fff" },
    font: {
      family: "sans-serif",
      familyMono: "monospace",
      weight: 730,
      labelWeight: 610
    }
  };
  /** @type {number[]} */
  const fontWeightCalls = [];
  /** @type {FontCallRecord[]} */
  const fontCalls = [];
  const textLayoutEngineModule = /** @type {TextLayoutEngineFactory} */ (
    loadFresh("shared/widget-kits/text/TextLayoutEngine.js")
  );
  const modules = /** @type {ModulesBag} */ ({
    TextLayoutPrimitives: loadFresh("shared/widget-kits/text/TextLayoutPrimitives.js"),
    TextLayoutComposite: loadFresh("shared/widget-kits/text/TextLayoutComposite.js"),
    ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js")
  });
  modules.TextLayoutEngine = {
    create(def, helperApi) {
      const engine = textLayoutEngineModule.create(def, helperApi);
      if (!fitKeyCalls) {
        return engine;
      }
      const originalMakeFitCacheKey = engine.makeFitCacheKey;
      engine.makeFitCacheKey = function (parts) {
        fitKeyCalls.push(parts);
        return originalMakeFitCacheKey.call(engine, parts);
      };
      return engine;
    }
  };
  /** @type {ApplyFormatterFn} */
  const defaultApplyFormatter = (raw, props) => {
    const fpRaw = props && props.formatterParameters;
    /** @type {unknown[]} */
    let fp;
    if (Array.isArray(fpRaw)) {
      fp = fpRaw;
    } else if (typeof fpRaw === "string") {
      fp = fpRaw.split(",");
    } else {
      fp = [];
    }
    try {
      if (props && typeof props.formatter === "function") {
        return props.formatter.apply(null, [raw].concat(fp));
      }
      if (
        props &&
        typeof props.formatter === "string" &&
        globalThis.avnav &&
        globalThis.avnav.api &&
        globalThis.avnav.api.formatter &&
        typeof globalThis.avnav.api.formatter[props.formatter] === "function"
      ) {
        return globalThis.avnav.api.formatter[props.formatter].apply(globalThis.avnav.api.formatter, [raw].concat(fp));
      }
    } catch (ignore) {}

    if (raw === null || raw === undefined || Number.isNaN(raw)) return (props && props.default) || "---";
    if (props && props.formatter === "formatClock") return "CLOCK:" + String(raw);
    return String(raw);
  };
  const applyFormatter = vi.fn(typeof opts.applyFormatter === "function" ? opts.applyFormatter : defaultApplyFormatter);

  const componentContext = /** @type {PositionCoordinateComponentContext} */ (
    createComponentContextMock({
      modules: {
        ThemeResolver: {
          resolveForRoot() {
            return themeTokens;
          }
        },
        CanvasTextLayout: {
          create() {
            return {
              /**
               * @param {string} family
               * @param {{ useMono?: boolean, monoFamily?: string }} [options]
               */
              resolveFamily(family, options) {
                if (options && options.useMono === true) {
                  return options.monoFamily || family;
                }
                return family;
              },
              /**
               * @param {DyniTestCanvasContext} ctx
               * @param {unknown} px
               * @param {unknown} weight
               * @param {string} [family]
               */
              setFont(ctx, px, weight, family) {
                const size = Math.max(1, Math.floor(Number(px) || 0));
                const weightNum = Math.floor(Number(weight));
                fontWeightCalls.push(weightNum);
                fontCalls.push({ weight: weightNum, px: size });
                ctx.font = String(weightNum) + " " + size + "px " + (family || "sans-serif");
              },
              /**
               * @param {DyniTestCanvasContext} ctx
               * @param {unknown} text
               * @param {number} basePx
               * @param {number} maxW
               * @param {number} maxH
               * @param {string} [family]
               * @param {unknown} [weight]
               * @returns {number}
               */
              fitSingleTextPx(ctx, text, basePx, maxW, maxH, family, weight) {
                let px = Math.max(1, Math.floor(Math.min(basePx, maxH)));
                if (!text) return px;
                const size = Math.max(1, Math.floor(Number(px) || 0));
                const weightNum = Math.floor(Number(weight));
                fontWeightCalls.push(weightNum);
                fontCalls.push({ weight: weightNum, px: size });
                ctx.font = String(weightNum) + " " + size + "px " + (family || "sans-serif");
                const width = ctx.measureText(String(text)).width;
                if (width <= maxW + 0.01) return px;
                const scale = Math.max(0.1, maxW / Math.max(1, width));
                px = Math.max(1, Math.floor(px * scale));
                return Math.min(px, Math.floor(maxH));
              },
              /**
               * @param {DyniTestCanvasContext} ctx
               * @param {number} W
               * @param {number} H
               * @param {string} [family]
               * @param {string} [color]
               * @param {string} [label]
               * @param {unknown} [labelWeight]
               */
              drawDisconnectOverlay(ctx, W, H, family, color, label, labelWeight) {
                ctx.save();
                ctx.globalAlpha = 0.2;
                ctx.fillStyle = color || "#000";
                ctx.fillRect(0, 0, W, H);
                ctx.globalAlpha = 1;
                ctx.fillStyle = color || "#000";
                const px = Math.max(12, Math.floor(Math.min(W, H) * 0.18));
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                const size = Math.max(1, Math.floor(Number(px) || 0));
                const overlayWeight = Math.floor(Number(labelWeight));
                fontWeightCalls.push(overlayWeight);
                fontCalls.push({ weight: overlayWeight, px: size });
                ctx.font = String(overlayWeight) + " " + size + "px " + (family || "sans-serif");
                ctx.fillText(label || "DISCONNECTED", Math.floor(W / 2), Math.floor(H / 2));
                ctx.restore();
              }
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
              /** @param {unknown} value */
              toOptionalFiniteNumber(value) {
                if (value === null || value === undefined) return undefined;
                if (typeof value === "string" && value.trim() === "") return undefined;
                const n = Number(value);
                return Number.isFinite(n) ? n : undefined;
              },
              /**
               * @param {unknown} n
               * @param {number} lo
               * @param {number} hi
               */
              clamp(n, lo, hi) {
                const num = Number(n);
                if (!isFinite(num)) return lo;
                return Math.max(lo, Math.min(hi, num));
              },
              /**
               * @param {unknown} value
               * @param {unknown} lo
               * @param {unknown} hi
               * @param {unknown} fallbackValue
               */
              clampNumber(value, lo, hi, fallbackValue) {
                const n = Number(value);
                if (!Number.isFinite(n)) {
                  return Number(fallbackValue);
                }
                return Math.max(Number(lo), Math.min(Number(hi), n));
              },
              /**
               * @param {number} from
               * @param {number} to
               * @param {number} t
               */
              lerp(from, to, t) {
                return from + (to - from) * t;
              },
              /** @param {unknown} value */
              toText(value) {
                return value === null || value === undefined ? "" : String(value).trim();
              },
              /**
               * @param {number} ratio
               * @param {number} thresholdNormal
               * @param {number} thresholdFlat
               */
              computeMode(ratio, thresholdNormal, thresholdFlat) {
                if (ratio < thresholdNormal) return "high";
                if (ratio > thresholdFlat) return "flat";
                return "normal";
              }
            };
          }
        },
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
        StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
        StateScreenCanvasOverlay: loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js"),
        TextLayoutEngine: modules.TextLayoutEngine,
        TextLayoutPrimitives: modules.TextLayoutPrimitives,
        TextLayoutComposite: modules.TextLayoutComposite,
        ResponsiveScaleProfile: modules.ResponsiveScaleProfile
      },
      services: {
        format: { applyFormatter },
        canvas: {
          /** @param {HTMLCanvasElement} canvas */
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
          /** @param {unknown} target */
          requirePluginRoot(target) {
            return target;
          }
        },
        themeTokens: {
          resolveForRoot() {
            return themeTokens;
          }
        }
      }
    })
  );
  componentContext.fontWeightCalls = fontWeightCalls;
  componentContext.fontCalls = fontCalls;
  return componentContext;
}

/** @param {DyniTestCanvasContext} ctx */
function fillTextValues(ctx) {
  return ctx.calls.filter((c) => c.name === "fillText").map((c) => String(c.args[0]));
}

/** @param {DyniTestCanvasContext} ctx */
function captureTextCalls(ctx) {
  /** @type {CapturedTextCall[]} */
  const captured = [];
  const originalFillText = ctx.fillText;
  ctx.fillText = function (text, x, y) {
    captured.push({
      text: String(text),
      x: x,
      y: y,
      font: ctx.font
    });
    return originalFillText.call(ctx, text, x, y);
  };
  return captured;
}

/** @param {unknown} font */
function parseFontPx(font) {
  const match = /(\d+)px/.exec(String(font || ""));
  return match ? Number(match[1]) : 0;
}

/**
 * @template {{ text: string }} T
 * @param {T[]} calls
 * @param {string} text
 * @returns {T | undefined}
 */
function findTextCall(calls, text) {
  return calls.find((entry) => entry.text === text);
}

module.exports = {
  loadFresh,
  createMockCanvas,
  createMockContext2D,
  makeComponentContext,
  fillTextValues,
  captureTextCalls,
  parseFontPx,
  findTextCall
};

/** @type {Record<string, unknown>} */ (globalThis).loadFresh = loadFresh;
/** @type {Record<string, unknown>} */ (globalThis).createMockCanvas = createMockCanvas;
/** @type {Record<string, unknown>} */ (globalThis).createMockContext2D = createMockContext2D;
