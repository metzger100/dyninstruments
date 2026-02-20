const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("PositionCoordinateWidget", function () {
  let previousAvnav;

  beforeEach(function () {
    previousAvnav = globalThis.avnav;
    delete globalThis.avnav;
  });

  afterEach(function () {
    if (typeof previousAvnav === "undefined") delete globalThis.avnav;
    else globalThis.avnav = previousAvnav;
  });

  function makeHelpers() {
    return {
      applyFormatter(raw, props) {
        const fpRaw = props && props.formatterParameters;
        const fp = Array.isArray(fpRaw) ? fpRaw : (typeof fpRaw === "string" ? fpRaw.split(",") : []);
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
        return String(raw);
      },
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
        if (id === "GaugeTextLayout") {
          return {
            create() {
              return {
                setFont(ctx, px, bold, family) {
                  const size = Math.max(1, Math.floor(Number(px) || 0));
                  ctx.font = (bold ? "700 " : "400 ") + size + "px " + (family || "sans-serif");
                },
                fitSingleTextPx(ctx, text, basePx, maxW, maxH, family, bold) {
                  let px = Math.max(1, Math.floor(Math.min(basePx, maxH)));
                  if (!text) return px;
                  const size = Math.max(1, Math.floor(Number(px) || 0));
                  ctx.font = (bold ? "700 " : "400 ") + size + "px " + (family || "sans-serif");
                  const w = ctx.measureText(String(text)).width;
                  if (w <= maxW + 0.01) return px;
                  const scale = Math.max(0.1, (maxW / Math.max(1, w)));
                  px = Math.max(1, Math.floor(px * scale));
                  return Math.min(px, Math.floor(maxH));
                },
                drawDisconnectOverlay(ctx, W, H, family, color) {
                  ctx.save();
                  ctx.globalAlpha = 0.20;
                  ctx.fillStyle = color;
                  ctx.fillRect(0, 0, W, H);
                  ctx.globalAlpha = 1;
                  ctx.fillStyle = color;
                  const px = Math.max(12, Math.floor(Math.min(W, H) * 0.18));
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  const size = Math.max(1, Math.floor(Number(px) || 0));
                  ctx.font = "700 " + size + "px " + (family || "sans-serif");
                  ctx.fillText("NO DATA", Math.floor(W / 2), Math.floor(H / 2));
                  ctx.restore();
                }
              };
            }
          };
        }
        if (id === "GaugeValueMath") {
          return {
            create() {
              return {
                clamp(n, lo, hi) {
                  const num = Number(n);
                  if (!isFinite(num)) return lo;
                  return Math.max(lo, Math.min(hi, num));
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
        throw new Error("unexpected module: " + id);
      }
    };
  }

  function fillTextValues(ctx) {
    return ctx.calls
      .filter((c) => c.name === "fillText")
      .map((c) => String(c.args[0]));
  }

  it("renders flat mode in one line using formatter output", function () {
    const flatFormatter = vi.fn((value) => {
      if (!value || typeof value !== "object") return "NA";
      return Number(value.lat).toFixed(2) + "," + Number(value.lon).toFixed(2);
    });
    globalThis.avnav = { api: { formatter: { formatLonLats: flatFormatter } } };

    const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js")
      .create({}, makeHelpers());

    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 420,
      rectHeight: 100,
      ctx
    });
    const props = {
      value: { lat: 53.5, lon: 8.2 },
      caption: "POS",
      unit: "",
      formatter: "formatLonLats",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0
    };

    spec.renderCanvas(canvas, props);
    const texts = fillTextValues(ctx);
    expect(texts).toContain("POS");
    expect(texts).toContain("53.50,8.20");
    expect(flatFormatter).toHaveBeenCalled();
  });

  it("renders stacked coordinates in normal and high modes", function () {
    const formatter = vi.fn((value, axis) => {
      return axis === "lat" ? "LAT:" + Number(value).toFixed(2) : "LON:" + Number(value).toFixed(2);
    });
    globalThis.avnav = { api: { formatter: { formatLonLatsDecimal: formatter } } };

    const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js")
      .create({}, makeHelpers());

    [
      { w: 220, h: 140 }, // normal
      { w: 120, h: 220 }  // high
    ].forEach((size) => {
      const ctx = createMockContext2D();
      const canvas = createMockCanvas({
        rectWidth: size.w,
        rectHeight: size.h,
        ctx
      });

      spec.renderCanvas(canvas, {
        value: { lat: 54.1234, lon: 10.9876 },
        caption: "POS",
        unit: "",
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.0
      });

      const texts = fillTextValues(ctx);
      expect(texts.some((t) => t.startsWith("LAT:54.12"))).toBe(true);
      expect(texts.some((t) => t.startsWith("LON:10.99"))).toBe(true);
    });

    expect(formatter).toHaveBeenCalled();
  });

  it("uses default text for invalid coordinates", function () {
    const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js")
      .create({}, makeHelpers());

    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx
    });

    spec.renderCanvas(canvas, {
      value: null,
      default: "NA",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0
    });

    const naCount = fillTextValues(ctx).filter((t) => t === "NA").length;
    expect(naCount).toBeGreaterThanOrEqual(2);
  });

  it("uses default text when formatter is unavailable", function () {
    const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js")
      .create({}, makeHelpers());

    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx
    });

    spec.renderCanvas(canvas, {
      value: { lat: 54.1, lon: 10.9 },
      default: "NA",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0
    });

    const naCount = fillTextValues(ctx).filter((t) => t === "NA").length;
    expect(naCount).toBeGreaterThanOrEqual(2);
  });

  it("draws disconnect overlay text", function () {
    const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js")
      .create({}, makeHelpers());

    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx
    });

    spec.renderCanvas(canvas, {
      value: { lat: 1, lon: 2 },
      disconnect: true,
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0
    });

    expect(fillTextValues(ctx)).toContain("NO DATA");
  });
});
