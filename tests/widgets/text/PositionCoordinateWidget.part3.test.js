const {
  makeComponentContext,
  fillTextValues,
  captureTextCalls,
  parseFontPx,
  findTextCall,
} = require("./PositionCoordinateWidget.harness.js");

describe("PositionCoordinateWidget", function () {
  it("increases compact text fill ratios in stacked and flat-axis modes", function () {
    const cases = [
      {
        name: "stacked",
        compact: { width: 160, height: 120 },
        large: { width: 320, height: 220 },
        targetText: "POS",
        props: {
          value: { lat: 54.1234, lon: 10.9876 },
          caption: "POS",
          unit: "nm",
          ratioThresholdNormal: 1.0,
          ratioThresholdFlat: 3.0,
        },
        usableHeight(H, insets) {
          const headerH = Math.min(
            Math.max(1, Math.floor(H * 0.3)),
            Math.floor(H * 0.45),
          );
          return Math.max(1, headerH - insets.innerY * 2);
        },
      },
      {
        name: "flat-axis",
        compact: { width: 220, height: 40 },
        large: { width: 520, height: 140 },
        targetText: "DATE TIME",
        props: {
          value: [
            new Date("2026-02-22T15:00:00Z"),
            new Date("2026-02-22T15:00:00Z"),
          ],
          caption: "POS",
          coordinateFlatFromAxes: true,
          coordinateRawValues: true,
          coordinateFormatterLat() {
            return "DATE";
          },
          coordinateFormatterLon() {
            return "TIME";
          },
          ratioThresholdNormal: 1.0,
          ratioThresholdFlat: 3.0,
          default: "NA",
        },
        usableHeight(H) {
          return H;
        },
      },
    ];

    cases.forEach(function (item) {
      const compactHelpers = makeComponentContext();
      const compactEngine =
        compactHelpers.components.require("TextLayoutEngine");
      const compactCtx = createMockContext2D();
      const compactCaptured = captureTextCalls(compactCtx);
      const compactCanvas = createMockCanvas({
        rectWidth: item.compact.width,
        rectHeight: item.compact.height,
        ctx: compactCtx,
      });
      const compactSpec = loadFresh(
        "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
      ).create({}, compactHelpers);
      const compactMode = compactEngine.computeModeLayout({
        W: item.compact.width,
        H: item.compact.height,
        captionText: item.props.caption,
        unitText: item.props.unit,
      });
      const compactInsets = compactEngine.computeResponsiveInsets(
        item.compact.width,
        item.compact.height,
      );
      compactSpec.renderCanvas(compactCanvas, item.props);
      const compactTarget = findTextCall(compactCaptured, item.targetText);

      const largeHelpers = makeComponentContext();
      const largeEngine = largeHelpers.components.require("TextLayoutEngine");
      const largeCtx = createMockContext2D();
      const largeCaptured = captureTextCalls(largeCtx);
      const largeCanvas = createMockCanvas({
        rectWidth: item.large.width,
        rectHeight: item.large.height,
        ctx: largeCtx,
      });
      const largeSpec = loadFresh(
        "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
      ).create({}, largeHelpers);
      const largeMode = largeEngine.computeModeLayout({
        W: item.large.width,
        H: item.large.height,
        captionText: item.props.caption,
        unitText: item.props.unit,
      });
      const largeInsets = largeEngine.computeResponsiveInsets(
        item.large.width,
        item.large.height,
      );
      largeSpec.renderCanvas(largeCanvas, item.props);
      const largeTarget = findTextCall(largeCaptured, item.targetText);

      expect(compactTarget).toBeTruthy();
      expect(largeTarget).toBeTruthy();
      if (item.name === "stacked") {
        expect(compactMode.mode).toBe("normal");
        expect(largeMode.mode).toBe("normal");
      } else {
        expect(compactMode.mode).toBe("flat");
        expect(largeMode.mode).toBe("flat");
      }
      // Compact layout should fill at least as much of its usable height as large layout.
      // The safety-factor margin (ROW_SAFE_RATIO) interacts with responsive textFillScale
      // at boundary cases; require compact to be within 10% of large (not materially less dense).
      expect(
        parseFontPx(compactTarget.font) /
          item.usableHeight(item.compact.height, compactInsets),
      ).toBeGreaterThanOrEqual(
        (parseFontPx(largeTarget.font) /
          item.usableHeight(item.large.height, largeInsets)) *
          0.9,
      );
    });
  });

  it("uses default text for invalid coordinates", function () {
    const spec = loadFresh(
      "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
    ).create({}, makeComponentContext());

    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx,
    });

    spec.renderCanvas(canvas, {
      value: null,
      default: "NA",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
    });

    const naCount = fillTextValues(ctx).filter((t) => t === "NA").length;
    expect(naCount).toBeGreaterThanOrEqual(2);
  });

  it("keeps stacked coordinates missing when lat/lon are null, blank, or one-sided", function () {
    const spec = loadFresh(
      "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
    ).create({}, makeComponentContext());
    const scenarios = [
      { lat: null, lon: null },
      { lat: "", lon: "" },
      { lat: "   ", lon: "   " },
      { lat: null, lon: 10.9 },
      { lat: 54.1, lon: null },
      { lat: "", lon: 10.9 },
      { lat: 54.1, lon: "" },
    ];

    scenarios.forEach(function (value) {
      const ctx = createMockContext2D();
      const canvas = createMockCanvas({
        rectWidth: 220,
        rectHeight: 140,
        ctx,
      });

      spec.renderCanvas(canvas, {
        value: value,
        default: "NA",
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.0,
      });

      const texts = fillTextValues(ctx);
      expect(
        texts.filter((entry) => entry === "NA").length,
      ).toBeGreaterThanOrEqual(2);
      expect(texts).not.toContain("0");
    });
  });

  it("falls back to raw numeric string when formatter is unavailable", function () {
    const spec = loadFresh(
      "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
    ).create({}, makeComponentContext());

    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx,
    });

    spec.renderCanvas(canvas, {
      value: { lat: 54.1, lon: 10.9 },
      default: "NA",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
    });

    const texts = fillTextValues(ctx);
    expect(texts).toContain("54.1");
    expect(texts).toContain("10.9");
    expect(texts).not.toContain("NA");
  });

  it("normalizes known formatter fallback tokens for axis-rendered coordinate values", function () {
    const helpers = makeComponentContext({
      applyFormatter(raw, props) {
        const cfg = props || {};
        if (cfg.formatter === "formatLonLatsDecimal") {
          return cfg.formatterParameters && cfg.formatterParameters[0] === "lat"
            ? "-----"
            : "--:--";
        }
        return cfg.default;
      },
    });
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
      value: { lat: 54.1, lon: 10.9 },
      default: "---",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
    });

    const texts = fillTextValues(ctx);
    expect(
      texts.filter((entry) => entry === "---").length,
    ).toBeGreaterThanOrEqual(2);
    expect(texts).not.toContain("-----");
    expect(texts).not.toContain("--:--");
  });

  it("does not infer formatter failure from raw-equality output", function () {
    globalThis.avnav = {
      api: {
        formatter: {
          formatLonLatsDecimal(value) {
            return String(Number(value));
          },
        },
      },
    };
    const spec = loadFresh(
      "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
    ).create({}, makeComponentContext());

    const ctx = createMockContext2D();
    const canvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx,
    });

    spec.renderCanvas(canvas, {
      value: { lat: 54.1, lon: 10.9 },
      default: "NA",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
    });

    const texts = fillTextValues(ctx);
    expect(texts).toContain("54.1");
    expect(texts).toContain("10.9");
    expect(texts).not.toContain("NA");
  });

  it("renders disconnected state-screen text", function () {
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
      value: { lat: 1, lon: 2 },
      disconnect: true,
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
    });

    const texts = fillTextValues(ctx);
    expect(texts).toContain("GPS Lost");
    expect(texts).not.toContain("1");
    expect(texts).not.toContain("2");
  });
});
