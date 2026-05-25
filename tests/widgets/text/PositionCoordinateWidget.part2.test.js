const {
  makeComponentContext,
  fillTextValues,
  captureTextCalls,
  parseFontPx,
  findTextCall,
} = require("./PositionCoordinateWidget.harness.js");

describe("PositionCoordinateWidget", function () {
  it("renders status circle on top line and formatted time on bottom in flat axis mode", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    const statusFormatter = vi.fn((raw) => {
      return raw === true ? "🟢" : "🔴";
    });
    const timeFormatter = vi.fn((raw) => {
      return raw === rawClock ? "TIME_OBJ" : "TIME_BAD";
    });
    const helpers = makeComponentContext();
    const spec = loadFresh(
      "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
    ).create({}, helpers);

    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 420,
      rectHeight: 100,
      ctx,
    });

    spec.renderCanvas(canvas, {
      value: [rawClock, true],
      coordinateFlatFromAxes: true,
      coordinateRawValues: true,
      coordinateFormatterLat: statusFormatter,
      coordinateFormatterLon: timeFormatter,
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
      default: "NA",
    });

    expect(fillTextValues(ctx)).toContain("🟢 TIME_OBJ");
    expect(statusFormatter).toHaveBeenCalledWith(true);
    expect(timeFormatter).toHaveBeenCalledWith(rawClock);
  });

  it("supports the timeStatus display variant without wrapper props", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    globalThis.avnav = {
      api: {
        formatter: {
          formatTime(value) {
            return value === rawClock ? "TIME_OBJ" : "TIME_BAD";
          },
        },
      },
    };

    const helpers = makeComponentContext();
    const spec = loadFresh(
      "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
    ).create({}, helpers);

    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 420,
      rectHeight: 100,
      ctx,
    });

    spec.renderCanvas(canvas, {
      value: [rawClock, true],
      displayVariant: "timeStatus",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
      default: "NA",
    });

    expect(fillTextValues(ctx)).toContain("🟢 TIME_OBJ");
    expect(helpers.format.applyFormatter).toHaveBeenCalledWith(
      rawClock,
      expect.objectContaining({
        formatter: "formatTime",
        formatterParameters: [],
      }),
    );
  });

  it("uses formatClock on the lon axis for timeStatus when hideSeconds is enabled", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    globalThis.avnav = {
      api: {
        formatter: {
          formatClock(value) {
            return value === rawClock ? "CLOCK_OBJ" : "CLOCK_BAD";
          },
        },
      },
    };

    const helpers = makeComponentContext();
    const spec = loadFresh(
      "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
    ).create({}, helpers);

    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 420,
      rectHeight: 100,
      ctx,
    });

    spec.renderCanvas(canvas, {
      value: [rawClock, true],
      displayVariant: "timeStatus",
      hideSeconds: true,
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
      default: "NA",
    });

    expect(fillTextValues(ctx)).toContain("🟢 CLOCK_OBJ");
    expect(helpers.format.applyFormatter).toHaveBeenCalledWith(
      rawClock,
      expect.objectContaining({
        formatter: "formatClock",
        formatterParameters: [],
      }),
    );
  });

  it("downscales timeStatus emoji lines in flat mode to avoid clipping", function () {
    function renderFlatCase(statusText) {
      const helpers = makeComponentContext();
      const spec = loadFresh(
        "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
      ).create({}, helpers);
      const ctx = createMockContext2D();
      const captured = captureTextCalls(ctx);
      const canvas = createMockCanvas({
        rectWidth: 420,
        rectHeight: 100,
        ctx,
      });
      spec.renderCanvas(canvas, {
        value: [new Date("2026-02-22T15:00:00Z"), true],
        coordinateFlatFromAxes: true,
        coordinateRawValues: true,
        coordinateFormatterLat() {
          return statusText;
        },
        coordinateFormatterLon() {
          return "15:49:45";
        },
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.0,
        default: "NA",
      });
      return {
        texts: fillTextValues(ctx),
        finalValuePx: parseFontPx(
          findTextCall(captured, statusText + " 15:49:45").font,
        ),
      };
    }

    const emojiCase = renderFlatCase("🟢");
    const textCase = renderFlatCase("OK");

    expect(emojiCase.texts).toContain("🟢 15:49:45");
    expect(textCase.texts).toContain("OK 15:49:45");
    expect(emojiCase.finalValuePx).toBeGreaterThan(0);
    expect(textCase.finalValuePx).toBeGreaterThan(0);
    expect(emojiCase.finalValuePx).toBeLessThan(textCase.finalValuePx);
  });

  it("downscales timeStatus emoji in high mode to avoid top-line clipping", function () {
    function renderHighCase(statusText) {
      const helpers = makeComponentContext();
      const spec = loadFresh(
        "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
      ).create({}, helpers);
      const ctx = createMockContext2D();
      const canvas = createMockCanvas({
        rectWidth: 220,
        rectHeight: 250,
        ctx,
      });
      const rawClock = new Date("2026-02-22T15:59:26Z");
      spec.renderCanvas(canvas, {
        value: [rawClock, true],
        coordinateRawValues: true,
        coordinateFormatterLat() {
          return statusText;
        },
        coordinateFormatterLon() {
          return "15:59:26";
        },
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.0,
        default: "NA",
      });
      const valuePx = helpers.fontCalls
        .filter((entry) => entry.weight === 730)
        .map((entry) => entry.px);
      return {
        texts: fillTextValues(ctx),
        finalValuePx: valuePx.length ? valuePx[valuePx.length - 1] : 0,
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
          formatDate(value) {
            return value === rawClock ? "DATE_RAW" : "DATE_BAD";
          },
          formatTime(value) {
            return value === rawClock ? "TIME_RAW" : "TIME_BAD";
          },
        },
      },
    };

    const helpers = makeComponentContext();
    const spec = loadFresh(
      "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
    ).create({}, helpers);

    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx,
    });

    spec.renderCanvas(canvas, {
      value: [rawClock, rawClock],
      coordinateRawValues: true,
      coordinateFormatterLat: "formatDate",
      coordinateFormatterLon: "formatTime",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
      default: "NA",
    });

    const texts = fillTextValues(ctx);
    expect(texts).toContain("DATE_RAW");
    expect(texts).toContain("TIME_RAW");
  });

  it("renders stacked coordinates in normal and high modes", function () {
    const formatter = vi.fn((value, axis) => {
      return axis === "lat"
        ? "LAT:" + Number(value).toFixed(2)
        : "LON:" + Number(value).toFixed(2);
    });
    globalThis.avnav = {
      api: { formatter: { formatLonLatsDecimal: formatter } },
    };
    const helpers = makeComponentContext();

    const spec = loadFresh(
      "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
    ).create({}, helpers);

    [
      { w: 220, h: 140 }, // normal
      { w: 120, h: 220 }, // high
    ].forEach((size) => {
      const ctx = createMockContext2D();
      const canvas = createMockCanvas({
        rectWidth: size.w,
        rectHeight: size.h,
        ctx,
      });

      spec.renderCanvas(canvas, {
        value: { lat: 54.1234, lon: 10.9876 },
        caption: "POS",
        unit: "",
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.0,
      });

      const texts = fillTextValues(ctx);
      expect(texts.some((t) => t.startsWith("LAT:54.12"))).toBe(true);
      expect(texts.some((t) => t.startsWith("LON:10.99"))).toBe(true);
    });

    expect(formatter).toHaveBeenCalled();
    expect(helpers.format.applyFormatter).toHaveBeenCalledWith(
      54.1234,
      expect.objectContaining({
        formatter: "formatLonLatsDecimal",
        formatterParameters: ["lat"],
      }),
    );
    expect(helpers.format.applyFormatter).toHaveBeenCalledWith(
      10.9876,
      expect.objectContaining({
        formatter: "formatLonLatsDecimal",
        formatterParameters: ["lon"],
      }),
    );
  });

});
