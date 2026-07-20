// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

let previousAvnav;

beforeEach(function () {
  previousAvnav = globalThis.avnav;
  delete globalThis.avnav;
});

afterEach(function () {
  if (typeof previousAvnav === "undefined") delete globalThis.avnav;
  else globalThis.avnav = previousAvnav;
});

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
  const fontWeightCalls = [];
  const fontCalls = [];
  const textLayoutEngineModule = loadFresh("shared/widget-kits/text/TextLayoutEngine.js");
  const modules = {
    TextLayoutPrimitives: loadFresh("shared/widget-kits/text/TextLayoutPrimitives.js"),
    TextLayoutComposite: loadFresh("shared/widget-kits/text/TextLayoutComposite.js"),
    ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js")
  };
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
  const defaultApplyFormatter = (raw, props) => {
    const fpRaw = props && props.formatterParameters;
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

    if (raw == null || Number.isNaN(raw)) return (props && props.default) || "---";
    if (props && props.formatter === "formatClock") return "CLOCK:" + String(raw);
    return String(raw);
  };
  const applyFormatter = vi.fn(typeof opts.applyFormatter === "function" ? opts.applyFormatter : defaultApplyFormatter);

  const componentContext = createComponentContextMock({
    modules: {
      ThemeResolver: {
        resolveForRoot() {
          return themeTokens;
        }
      },
      CanvasTextLayout: {
        create() {
          return {
            resolveFamily(family, options) {
              if (options && options.useMono === true) {
                return options.monoFamily || family;
              }
              return family;
            },
            setFont(ctx, px, weight, family) {
              const size = Math.max(1, Math.floor(Number(px) || 0));
              const weightNum = Math.floor(Number(weight));
              fontWeightCalls.push(weightNum);
              fontCalls.push({ weight: weightNum, px: size });
              ctx.font = String(weightNum) + " " + size + "px " + (family || "sans-serif");
            },
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
            drawDisconnectOverlay(ctx, W, H, family, color, label, labelWeight) {
              ctx.save();
              ctx.globalAlpha = 0.2;
              ctx.fillStyle = color;
              ctx.fillRect(0, 0, W, H);
              ctx.globalAlpha = 1;
              ctx.fillStyle = color;
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
            isFiniteNumber(value) {
              return typeof value === "number" && isFinite(value);
            },
            toOptionalFiniteNumber(value) {
              if (value == null) return undefined;
              if (typeof value === "string" && value.trim() === "") return undefined;
              const n = Number(value);
              return Number.isFinite(n) ? n : undefined;
            },
            clamp(n, lo, hi) {
              const num = Number(n);
              if (!isFinite(num)) return lo;
              return Math.max(lo, Math.min(hi, num));
            },
            clampNumber(value, lo, hi, fallbackValue) {
              const n = Number(value);
              if (!Number.isFinite(n)) {
                return Number(fallbackValue);
              }
              return Math.max(Number(lo), Math.min(Number(hi), n));
            },
            lerp(from, to, t) {
              return from + (to - from) * t;
            },
            toText(value) {
              return value == null ? "" : String(value).trim();
            },
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
      },
      themeTokens: {
        resolveForRoot() {
          return themeTokens;
        }
      }
    }
  });
  componentContext.fontWeightCalls = fontWeightCalls;
  componentContext.fontCalls = fontCalls;
  return componentContext;
}

function fillTextValues(ctx) {
  return ctx.calls.filter((c) => c.name === "fillText").map((c) => String(c.args[0]));
}

function captureTextCalls(ctx) {
  const captured = [];
  const originalFillText = ctx.fillText;
  ctx.fillText = function () {
    captured.push({
      text: String(arguments[0]),
      x: arguments[1],
      y: arguments[2],
      font: ctx.font
    });
    return originalFillText.apply(this, arguments);
  };
  return captured;
}

function parseFontPx(font) {
  const match = /(\d+)px/.exec(String(font || ""));
  return match ? Number(match[1]) : 0;
}

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

globalThis.loadFresh = loadFresh;
globalThis.createMockCanvas = createMockCanvas;
globalThis.createMockContext2D = createMockContext2D;
