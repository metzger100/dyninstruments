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
    const themeTokens = { font: { weight: 730, labelWeight: 610 } };
    const fontWeightCalls = [];
    const fontCalls = [];
    const applyFormatter = vi.fn((raw, props) => {
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
    });

    return {
      fontWeightCalls,
      fontCalls,
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
                  return themeTokens;
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
                  const scale = Math.max(0.1, (maxW / Math.max(1, width)));
                  px = Math.max(1, Math.floor(px * scale));
                  return Math.min(px, Math.floor(maxH));
                },
                drawDisconnectOverlay(ctx, W, H, family, color, label, labelWeight) {
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
                  const overlayWeight = Math.floor(Number(labelWeight));
                  fontWeightCalls.push(overlayWeight);
                  fontCalls.push({ weight: overlayWeight, px: size });
                  ctx.font = String(overlayWeight) + " " + size + "px " + (family || "sans-serif");
                  ctx.fillText(label || "NO DATA", Math.floor(W / 2), Math.floor(H / 2));
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

    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js")
      .create({}, helpers);

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
    expect(helpers.fontWeightCalls).toContain(730);
    expect(helpers.fontWeightCalls).toContain(610);
  });

  it("supports axis-specific formatters and flat rendering from stacked axes", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    globalThis.avnav = {
      api: {
        formatter: {
          formatDate(value) { return value === rawClock ? "DATE" : "DATE_BAD"; },
          formatTime(value) { return value === rawClock ? "TIME" : "TIME_BAD"; }
        }
      }
    };

    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js")
      .create({}, helpers);

    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 420,
      rectHeight: 100,
      ctx
    });

    spec.renderCanvas(canvas, {
      value: [rawClock, rawClock],
      coordinateFlatFromAxes: true,
      coordinateRawValues: true,
      coordinateFormatterLat: "formatDate",
      coordinateFormatterLon: "formatTime",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
      default: "NA"
    });

    expect(fillTextValues(ctx)).toContain("DATE TIME");
    expect(helpers.applyFormatter).toHaveBeenCalledWith(rawClock, expect.objectContaining({
      formatter: "formatDate",
      formatterParameters: []
    }));
    expect(helpers.applyFormatter).toHaveBeenCalledWith(rawClock, expect.objectContaining({
      formatter: "formatTime",
      formatterParameters: []
    }));
  });

  it("renders status circle on top line and formatted time on bottom in flat axis mode", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    const statusFormatter = vi.fn((raw) => {
      return raw === true ? "🟢" : "🔴";
    });
    const timeFormatter = vi.fn((raw) => {
      return raw === rawClock ? "TIME_OBJ" : "TIME_BAD";
    });
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js")
      .create({}, helpers);

    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 420,
      rectHeight: 100,
      ctx
    });

    spec.renderCanvas(canvas, {
      value: [rawClock, true],
      coordinateFlatFromAxes: true,
      coordinateRawValues: true,
      coordinateFormatterLat: statusFormatter,
      coordinateFormatterLon: timeFormatter,
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
      default: "NA"
    });

    expect(fillTextValues(ctx)).toContain("🟢 TIME_OBJ");
    expect(statusFormatter).toHaveBeenCalledWith(true);
    expect(timeFormatter).toHaveBeenCalledWith(rawClock);
  });

  it("downscales timeStatus emoji lines in flat mode to avoid clipping", function () {
    function renderFlatCase(statusText) {
      const helpers = makeHelpers();
      const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js")
        .create({}, helpers);
      const ctx = createMockContext2D();
      const canvas = createMockCanvas({
        rectWidth: 420,
        rectHeight: 100,
        ctx
      });
      spec.renderCanvas(canvas, {
        value: [new Date("2026-02-22T15:00:00Z"), true],
        coordinateFlatFromAxes: true,
        coordinateRawValues: true,
        coordinateFormatterLat() { return statusText; },
        coordinateFormatterLon() { return "15:49:45"; },
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.0,
        default: "NA"
      });
      const valuePx = helpers.fontCalls
        .filter((entry) => entry.weight === 730)
        .map((entry) => entry.px);
      return {
        texts: fillTextValues(ctx),
        maxValuePx: valuePx.length ? Math.max.apply(null, valuePx) : 0
      };
    }

    const emojiCase = renderFlatCase("🟢");
    const textCase = renderFlatCase("OK");

    expect(emojiCase.texts).toContain("🟢 15:49:45");
    expect(textCase.texts).toContain("OK 15:49:45");
    expect(emojiCase.maxValuePx).toBeGreaterThan(0);
    expect(textCase.maxValuePx).toBeGreaterThan(0);
    expect(emojiCase.maxValuePx).toBeLessThan(textCase.maxValuePx);
  });

  it("downscales timeStatus emoji in high mode to avoid top-line clipping", function () {
    function renderHighCase(statusText) {
      const helpers = makeHelpers();
      const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js")
        .create({}, helpers);
      const ctx = createMockContext2D();
      const canvas = createMockCanvas({
        rectWidth: 220,
        rectHeight: 250,
        ctx
      });
      const rawClock = new Date("2026-02-22T15:59:26Z");
      spec.renderCanvas(canvas, {
        value: [rawClock, true],
        coordinateRawValues: true,
        coordinateFormatterLat() { return statusText; },
        coordinateFormatterLon() { return "15:59:26"; },
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.0,
        default: "NA"
      });
      const valuePx = helpers.fontCalls
        .filter((entry) => entry.weight === 730)
        .map((entry) => entry.px);
      return {
        texts: fillTextValues(ctx),
        finalValuePx: valuePx.length ? valuePx[valuePx.length - 1] : 0
      };
    }

    const emojiCase = renderHighCase("🟢");
    const textCase = renderHighCase("OK");

    expect(emojiCase.texts).toContain("🟢");
    expect(emojiCase.texts).toContain("15:59:26");
    expect(textCase.texts).toContain("OK");
    expect(textCase.texts).toContain("15:59:26");
    expect(emojiCase.finalValuePx).toBeGreaterThan(0);
    expect(textCase.finalValuePx).toBeGreaterThan(0);
    expect(emojiCase.finalValuePx).toBeLessThan(textCase.finalValuePx);
  });

  it("renders stacked raw date/time values in normal mode", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    globalThis.avnav = {
      api: {
        formatter: {
          formatDate(value) { return value === rawClock ? "DATE_RAW" : "DATE_BAD"; },
          formatTime(value) { return value === rawClock ? "TIME_RAW" : "TIME_BAD"; }
        }
      }
    };

    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js")
      .create({}, helpers);

    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx
    });

    spec.renderCanvas(canvas, {
      value: [rawClock, rawClock],
      coordinateRawValues: true,
      coordinateFormatterLat: "formatDate",
      coordinateFormatterLon: "formatTime",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
      default: "NA"
    });

    const texts = fillTextValues(ctx);
    expect(texts).toContain("DATE_RAW");
    expect(texts).toContain("TIME_RAW");
  });

  it("renders stacked coordinates in normal and high modes", function () {
    const formatter = vi.fn((value, axis) => {
      return axis === "lat" ? "LAT:" + Number(value).toFixed(2) : "LON:" + Number(value).toFixed(2);
    });
    globalThis.avnav = { api: { formatter: { formatLonLatsDecimal: formatter } } };
    const helpers = makeHelpers();

    const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js")
      .create({}, helpers);

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
    expect(helpers.applyFormatter).toHaveBeenCalledWith(54.1234, expect.objectContaining({
      formatter: "formatLonLatsDecimal",
      formatterParameters: ["lat"]
    }));
    expect(helpers.applyFormatter).toHaveBeenCalledWith(10.9876, expect.objectContaining({
      formatter: "formatLonLatsDecimal",
      formatterParameters: ["lon"]
    }));
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

  it("falls back to raw numeric string when formatter is unavailable", function () {
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

    const texts = fillTextValues(ctx);
    expect(texts).toContain("54.1");
    expect(texts).toContain("10.9");
    expect(texts).not.toContain("NA");
  });

  it("does not infer formatter failure from raw-equality output", function () {
    globalThis.avnav = {
      api: {
        formatter: {
          formatLonLatsDecimal(value) {
            return String(Number(value));
          }
        }
      }
    };
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

    const texts = fillTextValues(ctx);
    expect(texts).toContain("54.1");
    expect(texts).toContain("10.9");
    expect(texts).not.toContain("NA");
  });

  it("draws disconnect overlay text", function () {
    const helpers = makeHelpers();
    const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js")
      .create({}, helpers);

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
    expect(helpers.fontWeightCalls).toContain(610);
  });
});
