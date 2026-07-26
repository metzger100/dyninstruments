const { loadFresh } = require("../../helpers/load-umd");

const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

// @ts-ignore -- pre-existing untyped test mock boundary
function makeComponentContext(options) {
  const opts = options || {};
  // @ts-ignore -- pre-existing untyped test mock boundary
  const defaultApplyFormatter = (raw, props) => {
    const fallback = props && Object.prototype.hasOwnProperty.call(props, "default") ? props.default : "---";
    if (raw == null || Number.isNaN(raw)) return fallback;
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
          // @ts-ignore -- pre-existing untyped test mock boundary
          resolveFamily(family, options) {
            if (options && options.useMono === true) {
              return options.monoFamily || family;
            }
            return family;
          },
          // @ts-ignore -- pre-existing untyped test mock boundary
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
          // @ts-ignore -- pre-existing untyped test mock boundary
          isFiniteNumber(value) {
            return typeof value === "number" && isFinite(value);
          },
          // @ts-ignore -- pre-existing untyped test mock boundary
          clamp(value, lo, hi) {
            const n = Number(value);
            if (!isFinite(n)) return Number(lo);
            return Math.max(Number(lo), Math.min(Number(hi), n));
          },
          // @ts-ignore -- pre-existing untyped test mock boundary
          clampNumber(value, lo, hi, fallbackValue) {
            const n = Number(value);
            if (!Number.isFinite(n)) {
              return Number(fallbackValue);
            }
            return Math.max(Number(lo), Math.min(Number(hi), n));
          },
          // @ts-ignore -- pre-existing untyped test mock boundary
          lerp(from, to, t) {
            return from + (to - from) * t;
          },
          // @ts-ignore -- pre-existing untyped test mock boundary
          toText(value) {
            return value == null ? "" : String(value).trim();
          },
          // @ts-ignore -- pre-existing untyped test mock boundary
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
  });
}

// @ts-ignore -- pre-existing untyped test mock boundary
function countByName(calls, name) {
  // @ts-ignore -- pre-existing untyped test mock boundary
  return calls.filter((entry) => entry.name === name).length;
}

// @ts-ignore -- pre-existing untyped test mock boundary
function renderFrame(spec, canvas, props) {
  const ctx = canvas.__ctx;
  const beforeCallCount = ctx.calls.length;
  spec.renderCanvas(canvas, props);
  const frameCalls = ctx.calls.slice(beforeCallCount);
  return {
    measureDelta: countByName(frameCalls, "measureText"),
    fillDelta: countByName(frameCalls, "fillText"),
    fillEntries: frameCalls
      // @ts-ignore -- pre-existing untyped test mock boundary
      .filter((entry) => entry.name === "fillText")
      // @ts-ignore -- pre-existing untyped test mock boundary
      .map((entry) => ({
        text: String(entry.args[0]),
        x: entry.args[1],
        y: entry.args[2]
      }))
  };
}

// @ts-ignore -- pre-existing untyped test mock boundary
function captureTextCalls(ctx) {
  // @ts-ignore -- pre-existing untyped test mock boundary
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
  // @ts-ignore -- pre-existing untyped test mock boundary
  return captured;
}

// @ts-ignore -- pre-existing untyped test mock boundary
function parseFontPx(font) {
  const match = /(\d+)px/.exec(String(font || ""));
  return match ? Number(match[1]) : 0;
}

// @ts-ignore -- pre-existing untyped test mock boundary
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

// @ts-ignore -- pre-existing untyped test mock boundary
function findTextCall(calls, text) {
  // @ts-ignore -- pre-existing untyped test mock boundary
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
