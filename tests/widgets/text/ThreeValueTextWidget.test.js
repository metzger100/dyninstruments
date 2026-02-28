const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("ThreeValueTextWidget", function () {
  function makeHelpers() {
    const applyFormatter = vi.fn((raw, props) => {
      const fallback = (props && Object.prototype.hasOwnProperty.call(props, "default"))
        ? props.default
        : "---";
      if (raw == null || Number.isNaN(raw)) return fallback;
      return String(raw);
    });
    const modules = {
      TextLayoutEngine: loadFresh("shared/widget-kits/gauge/TextLayoutEngine.js"),
      TextLayoutPrimitives: loadFresh("shared/widget-kits/gauge/TextLayoutPrimitives.js"),
      TextLayoutComposite: loadFresh("shared/widget-kits/gauge/TextLayoutComposite.js")
    };

    return {
      applyFormatter,
      setupCanvas(canvas) {
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        return {
          ctx,
          W: Math.round(rect.width),
          H: Math.round(rect.height)
        };
      },
      resolveFontFamily() {
        return "sans-serif";
      },
      resolveTextColor() {
        return "#fff";
      },
      getModule(id) {
        if (id === "ThemeResolver") {
          return {
            create() {
              return {
                resolve() {
                  return { font: { weight: 730, labelWeight: 610 } };
                }
              };
            }
          };
        }
        if (id === "GaugeTextLayout") {
          return {
            create() {
              return {
                setFont(ctx, px, weight, family) {
                  const size = Math.max(1, Math.floor(Number(px) || 0));
                  const fontWeight = Math.floor(Number(weight));
                  ctx.font = String(fontWeight) + " " + size + "px " + (family || "sans-serif");
                },
                drawDisconnectOverlay() {}
              };
            }
          };
        }
        if (id === "GaugeValueMath") {
          return {
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
                computeMode(ratio, thresholdNormal, thresholdFlat) {
                  if (ratio < thresholdNormal) return "high";
                  if (ratio > thresholdFlat) return "flat";
                  return "normal";
                }
              };
            }
          };
        }
        if (modules[id]) {
          return modules[id];
        }
        throw new Error("unexpected module: " + id);
      }
    };
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
          y: entry.args[2]
        }))
    };
  }

  it("reuses cached fitting for unchanged keys in high/normal/flat modes", function () {
    const cases = [
      {
        name: "high",
        rectWidth: 120,
        rectHeight: 220,
        props: { value: "12.3", caption: "SPD", unit: "kn" }
      },
      {
        name: "normal",
        rectWidth: 220,
        rectHeight: 140,
        props: { value: "12.3", caption: "SPD", unit: "kn" }
      },
      {
        name: "flat",
        rectWidth: 420,
        rectHeight: 100,
        props: { value: "12.3", caption: "SPD", unit: "kn" }
      }
    ];

    cases.forEach(function (item) {
      const helpers = makeHelpers();
      const spec = loadFresh("widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js").create({}, helpers);
      const canvas = createMockCanvas({
        rectWidth: item.rectWidth,
        rectHeight: item.rectHeight,
        ctx: createMockContext2D()
      });

      const first = renderFrame(spec, canvas, item.props);
      const second = renderFrame(spec, canvas, item.props);

      expect(first.measureDelta).toBeGreaterThan(0);
      expect(second.measureDelta).toBe(0);
      expect(second.fillDelta).toBeGreaterThan(0);
    });
  });

  it("misses cache when text content changes", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js").create({}, helpers);
    const canvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx: createMockContext2D()
    });

    const props = { value: "12.3", caption: "SPD", unit: "kn" };
    const first = renderFrame(spec, canvas, props);
    const second = renderFrame(spec, canvas, props);
    const third = renderFrame(spec, canvas, { value: "13.1", caption: "SPD", unit: "kn" });

    expect(first.measureDelta).toBeGreaterThan(0);
    expect(second.measureDelta).toBe(0);
    expect(third.measureDelta).toBeGreaterThan(0);
  });

  it("misses cache when dimensions change", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js").create({}, helpers);
    const props = { value: "12.3", caption: "SPD", unit: "kn" };
    const canvasWide = createMockCanvas({
      rectWidth: 420,
      rectHeight: 100,
      ctx: createMockContext2D()
    });
    const canvasWider = createMockCanvas({
      rectWidth: 500,
      rectHeight: 100,
      ctx: createMockContext2D()
    });

    const first = renderFrame(spec, canvasWide, props);
    const second = renderFrame(spec, canvasWide, props);
    const third = renderFrame(spec, canvasWider, props);

    expect(first.measureDelta).toBeGreaterThan(0);
    expect(second.measureDelta).toBe(0);
    expect(third.measureDelta).toBeGreaterThan(0);
  });

  it("keeps draw output semantics unchanged on cache hits", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js").create({}, helpers);
    const canvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx: createMockContext2D()
    });
    const props = { value: "12.3", caption: "SPD", unit: "kn" };

    const first = renderFrame(spec, canvas, props);
    const second = renderFrame(spec, canvas, props);

    expect(second.fillDelta).toBeGreaterThan(0);
    expect(second.fillEntries).toEqual(first.fillEntries);
    expect(second.fillEntries.map((entry) => entry.text)).toEqual(first.fillEntries.map((entry) => entry.text));
  });
});
