const { loadFresh } = require("../../helpers/load-umd");
const {
  createMockCanvas,
  createMockContext2D,
} = require("../../helpers/mock-canvas");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

describe("ThreeValueTextWidget", function () {
  function makeComponentContext(options) {
    const opts = options || {};
    const defaultApplyFormatter = (raw, props) => {
      const fallback =
        props && Object.prototype.hasOwnProperty.call(props, "default")
          ? props.default
          : "---";
      if (raw == null || Number.isNaN(raw)) return fallback;
      return String(raw);
    };
    const applyFormatter = vi.fn(
      typeof opts.applyFormatter === "function"
        ? opts.applyFormatter
        : defaultApplyFormatter,
    );
    const modules = {
      TextLayoutEngine: loadFresh(
        "shared/widget-kits/text/TextLayoutEngine.js",
      ),
      TextLayoutPrimitives: loadFresh(
        "shared/widget-kits/text/TextLayoutPrimitives.js",
      ),
      TextLayoutComposite: loadFresh(
        "shared/widget-kits/text/TextLayoutComposite.js",
      ),
      ResponsiveScaleProfile: loadFresh(
        "shared/widget-kits/layout/ResponsiveScaleProfile.js",
      ),
      ThemeResolver: {
        resolveForRoot() {
          return {
            surface: { fg: "#fff" },
            font: {
              family: "sans-serif",
              familyMono: "monospace",
              weight: 730,
              labelWeight: 610,
            },
          };
        },
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
              const fontWeight = Math.floor(Number(weight));
              ctx.font =
                String(fontWeight) +
                " " +
                size +
                "px " +
                (family || "sans-serif");
            },
            drawDisconnectOverlay() {},
          };
        },
      },
      ValueMath: {
        create() {
          return {
            isFiniteNumber(value) {
              return typeof value === "number" && isFinite(value);
            },
            clamp(value, lo, hi) {
              const n = Number(value);
              if (!isFinite(n)) return Number(lo);
              return Math.max(Number(lo), Math.min(Number(hi), n));
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
            },
          };
        },
      },
      PlaceholderNormalize: loadFresh(
        "shared/widget-kits/format/PlaceholderNormalize.js",
      ),
      StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
      StateScreenLabels: loadFresh(
        "shared/widget-kits/state/StateScreenLabels.js",
      ),
      StateScreenPrecedence: loadFresh(
        "shared/widget-kits/state/StateScreenPrecedence.js",
      ),
      StateScreenCanvasOverlay: loadFresh(
        "shared/widget-kits/state/StateScreenCanvasOverlay.js",
      ),
    };
    return createComponentContextMock({
      modules,
      services: {
        format: { applyFormatter },
        canvas: {
          setupCanvas(canvas) {
            const ctx = canvas.getContext("2d");
            const rect = canvas.getBoundingClientRect();
            return {
              ctx,
              W: Math.round(rect.width),
              H: Math.round(rect.height),
            };
          },
        },
        dom: {
          requirePluginRoot(target) {
            return target;
          },
        },
      },
    });
  }

  function countByName(calls, name) {
    return calls.filter((entry) => entry.name === name).length;
  }

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
          y: entry.args[2],
        })),
    };
  }

  function captureTextCalls(ctx) {
    const captured = [];
    const originalFillText = ctx.fillText;
    ctx.fillText = function () {
      captured.push({
        text: String(arguments[0]),
        x: arguments[1],
        y: arguments[2],
        font: ctx.font,
      });
      return originalFillText.apply(this, arguments);
    };
    return captured;
  }

  function parseFontPx(font) {
    const match = /(\d+)px/.exec(String(font || ""));
    return match ? Number(match[1]) : 0;
  }

  function renderCaptured(spec, width, height, props) {
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: width,
      rectHeight: height,
      ctx: ctx,
    });
    const captured = captureTextCalls(ctx);
    spec.renderCanvas(canvas, props);
    return captured;
  }

  function findTextCall(calls, text) {
    return calls.find((entry) => entry.text === text);
  }

  it("reuses cached fitting for unchanged keys in high/normal/flat modes", function () {
    const cases = [
      {
        name: "high",
        rectWidth: 120,
        rectHeight: 220,
        props: { value: "12.3", caption: "SPD", unit: "kn" },
      },
      {
        name: "normal",
        rectWidth: 220,
        rectHeight: 140,
        props: { value: "12.3", caption: "SPD", unit: "kn" },
      },
      {
        name: "flat",
        rectWidth: 420,
        rectHeight: 100,
        props: { value: "12.3", caption: "SPD", unit: "kn" },
      },
    ];

    cases.forEach(function (item) {
      const helpers = makeComponentContext();
      const spec = loadFresh(
        "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js",
      ).create({}, helpers);
      const canvas = createMockCanvas({
        rectWidth: item.rectWidth,
        rectHeight: item.rectHeight,
        ctx: createMockContext2D(),
      });

      const first = renderFrame(spec, canvas, item.props);
      const second = renderFrame(spec, canvas, item.props);

      expect(first.measureDelta).toBeGreaterThan(0);
      expect(second.measureDelta).toBe(0);
      expect(second.fillDelta).toBeGreaterThan(0);
    });
  });

  it("misses cache when text content changes", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh(
      "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js",
    ).create({}, helpers);
    const canvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx: createMockContext2D(),
    });

    const props = { value: "12.3", caption: "SPD", unit: "kn" };
    const first = renderFrame(spec, canvas, props);
    const second = renderFrame(spec, canvas, props);
    const third = renderFrame(spec, canvas, {
      value: "13.1",
      caption: "SPD",
      unit: "kn",
    });

    expect(first.measureDelta).toBeGreaterThan(0);
    expect(second.measureDelta).toBe(0);
    expect(third.measureDelta).toBeGreaterThan(0);
  });

});
