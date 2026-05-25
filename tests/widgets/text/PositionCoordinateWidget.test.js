const {
  makeComponentContext,
  fillTextValues,
  captureTextCalls,
  parseFontPx,
  findTextCall,
} = require("./PositionCoordinateWidget.harness.js");

describe("PositionCoordinateWidget", function () {
  it("renders flat mode in one line using formatter output", function () {
    const flatFormatter = vi.fn((value) => {
      if (!value || typeof value !== "object") return "NA";
      return Number(value.lat).toFixed(2) + "," + Number(value.lon).toFixed(2);
    });
    globalThis.avnav = { api: { formatter: { formatLonLats: flatFormatter } } };

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
    const props = {
      value: { lat: 53.5, lon: 8.2 },
      caption: "POS",
      unit: "",
      formatter: "formatLonLats",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
    };

    spec.renderCanvas(canvas, props);
    const texts = fillTextValues(ctx);
    expect(texts).toContain("POS");
    expect(texts).toContain("53.50,8.20");
    expect(flatFormatter).toHaveBeenCalled();
    expect(helpers.fontWeightCalls).toContain(730);
    expect(helpers.fontWeightCalls).toContain(610);
  });

  it("uses mono coordinate font when coordinatesTabular is enabled", function () {
    function coordinateFormatter(raw, formatterOptions) {
      const cfg = formatterOptions || {};
      if (cfg.formatter === "formatLonLatsDecimal") {
        const axis = Array.isArray(cfg.formatterParameters)
          ? cfg.formatterParameters[cfg.formatterParameters.length - 1]
          : "";
        return (axis === "lat" ? "LAT:" : "LON:") + String(raw);
      }
      return raw == null ? cfg.default : String(raw);
    }

    const helpersTabular = makeComponentContext({
      applyFormatter: coordinateFormatter,
    });
    const specTabular = loadFresh(
      "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
    ).create({}, helpersTabular);
    const tabularCtx = createMockContext2D();
    const tabularCanvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx: tabularCtx,
    });
    const tabularCaptured = captureTextCalls(tabularCtx);
    specTabular.renderCanvas(tabularCanvas, {
      value: { lat: 54.1, lon: 10.2 },
      caption: "POS",
      coordinatesTabular: true,
    });

    const helpersPlain = makeComponentContext({
      applyFormatter: coordinateFormatter,
    });
    const specPlain = loadFresh(
      "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
    ).create({}, helpersPlain);
    const plainCtx = createMockContext2D();
    const plainCanvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx: plainCtx,
    });
    const plainCaptured = captureTextCalls(plainCtx);
    specPlain.renderCanvas(plainCanvas, {
      value: { lat: 54.1, lon: 10.2 },
      caption: "POS",
      coordinatesTabular: false,
    });

    const tabularLat = tabularCaptured.find(
      (entry) => entry.text.indexOf("LAT:54.1") === 0,
    );
    const plainLat = plainCaptured.find(
      (entry) => entry.text.indexOf("LAT:54.1") === 0,
    );

    expect(tabularLat).toBeTruthy();
    expect(plainLat).toBeTruthy();
    expect(String(tabularLat.font)).toContain("monospace");
    expect(String(plainLat.font)).toContain("sans-serif");
  });

  it("right-aligns tabular stacked coordinates and keys the fit by alignment", function () {
    const fitKeyCalls = [];
    const helpers = makeComponentContext({ fitKeyCalls: fitKeyCalls });
    const spec = loadFresh(
      "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
    ).create({}, helpers);

    const tabularCtx = createMockContext2D();
    const tabularCanvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx: tabularCtx,
    });
    spec.renderCanvas(tabularCanvas, {
      value: { lat: 54.1, lon: 10.2 },
      caption: "POS",
      coordinatesTabular: true,
    });

    const tabularKey = fitKeyCalls.find(
      (entry) =>
        entry && Object.prototype.hasOwnProperty.call(entry, "latText"),
    );
    const tabularLat = tabularCtx.calls.find(
      (entry) => entry.name === "fillText" && String(entry.args[0]) === "54.1",
    );

    expect(tabularKey.align).toBe("right");
    expect(String(tabularCtx.textAlign)).toBe("right");
    expect(tabularLat.args[1]).toBeGreaterThan(110);

    fitKeyCalls.length = 0;
    const plainCtx = createMockContext2D();
    const plainCanvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx: plainCtx,
    });
    spec.renderCanvas(plainCanvas, {
      value: { lat: 54.1, lon: 10.2 },
      caption: "POS",
      coordinatesTabular: false,
    });

    const plainKey = fitKeyCalls.find(
      (entry) =>
        entry && Object.prototype.hasOwnProperty.call(entry, "latText"),
    );
    const plainLat = plainCtx.calls.find(
      (entry) => entry.name === "fillText" && String(entry.args[0]) === "54.1",
    );

    expect(plainKey.align).toBe("center");
    expect(String(plainCtx.textAlign)).toBe("center");
    expect(plainLat.args[1]).toBeLessThanOrEqual(110);
  });

  it("supports axis-specific formatters and flat rendering from stacked axes", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    globalThis.avnav = {
      api: {
        formatter: {
          formatDate(value) {
            return value === rawClock ? "DATE" : "DATE_BAD";
          },
          formatTime(value) {
            return value === rawClock ? "TIME" : "TIME_BAD";
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
      value: [rawClock, rawClock],
      coordinateFlatFromAxes: true,
      coordinateRawValues: true,
      coordinateFormatterLat: "formatDate",
      coordinateFormatterLon: "formatTime",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
      default: "NA",
    });

    expect(fillTextValues(ctx)).toContain("DATE TIME");
    expect(helpers.format.applyFormatter).toHaveBeenCalledWith(
      rawClock,
      expect.objectContaining({
        formatter: "formatDate",
        formatterParameters: [],
      }),
    );
    expect(helpers.format.applyFormatter).toHaveBeenCalledWith(
      rawClock,
      expect.objectContaining({
        formatter: "formatTime",
        formatterParameters: [],
      }),
    );
  });

  it("supports the dateTime display variant without wrapper props", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    globalThis.avnav = {
      api: {
        formatter: {
          formatDate(value) {
            return value === rawClock ? "DATE" : "DATE_BAD";
          },
          formatTime(value) {
            return value === rawClock ? "TIME" : "TIME_BAD";
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
      value: [rawClock, rawClock],
      displayVariant: "dateTime",
      ratioThresholdNormal: 1.35,
      ratioThresholdFlat: 3.0,
      default: "NA",
    });

    expect(fillTextValues(ctx)).toContain("DATE TIME");
    expect(helpers.format.applyFormatter).toHaveBeenCalledWith(
      rawClock,
      expect.objectContaining({
        formatter: "formatDate",
        formatterParameters: [],
      }),
    );
    expect(helpers.format.applyFormatter).toHaveBeenCalledWith(
      rawClock,
      expect.objectContaining({
        formatter: "formatTime",
        formatterParameters: [],
      }),
    );
  });

  it("uses formatClock on the lon axis for dateTime when hideSeconds is enabled", function () {
    const rawClock = new Date("2026-02-22T15:00:00Z");
    globalThis.avnav = {
      api: {
        formatter: {
          formatDate(value) {
            return value === rawClock ? "DATE" : "DATE_BAD";
          },
          formatTime(value) {
            return value === rawClock ? "TIME" : "TIME_BAD";
          },
          formatClock(value) {
            return value === rawClock ? "CLOCK" : "CLOCK_BAD";
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
      value: [rawClock, rawClock],
      displayVariant: "dateTime",
      hideSeconds: true,
      ratioThresholdNormal: 1.35,
      ratioThresholdFlat: 3.0,
      default: "NA",
    });

    expect(fillTextValues(ctx)).toContain("DATE CLOCK");
    expect(helpers.format.applyFormatter).toHaveBeenCalledWith(
      rawClock,
      expect.objectContaining({
        formatter: "formatClock",
        formatterParameters: [],
      }),
    );
  });

});
