// @ts-check
const { createEngine, createMockContext2D, createSizingContext } = require("./TextLayoutEngine-setup");

describe("TextLayoutEngine", function () {
  it("computes mode routing and collapse flags", function () {
    const engine = createEngine();
    const high = engine.computeModeLayout({
      W: 120,
      H: 220,
      captionText: "SPD",
      unitText: "kn"
    });
    const normal = engine.computeModeLayout({
      W: 220,
      H: 140,
      captionText: "SPD",
      unitText: "kn"
    });
    const flat = engine.computeModeLayout({
      W: 500,
      H: 120,
      captionText: "SPD",
      unitText: "kn"
    });
    const noCaption = engine.computeModeLayout({
      W: 220,
      H: 140,
      captionText: "",
      unitText: "kn",
      collapseNoCaptionToFlat: true
    });
    const noUnitHigh = engine.computeModeLayout({
      W: 120,
      H: 220,
      captionText: "SPD",
      unitText: "",
      collapseHighWithoutUnitToNormal: true
    });
    const clamped = engine.computeModeLayout({
      W: 220,
      H: 140,
      captionText: "SPD",
      unitText: "kn",
      captionUnitScale: 99
    });

    expect(high.mode).toBe("high");
    expect(normal.mode).toBe("normal");
    expect(flat.mode).toBe("flat");
    expect(noCaption.mode).toBe("flat");
    expect(noUnitHigh.mode).toBe("normal");
    expect(clamped.secScale).toBe(3);
  });

  it("manages fit cache keys and invalidation", function () {
    const engine = createEngine();
    const cache = engine.createFitCache(["flat", "normal"]);
    const key = engine.makeFitCacheKey({ a: 1, b: "x" });
    const result = { px: 22 };

    engine.writeFitCache(cache, "flat", key, result);
    expect(engine.readFitCache(cache, "flat", key)).toEqual(result);
    expect(engine.readFitCache(cache, "flat", "bad")).toBe(null);

    let runs = 0;
    const first = engine.resolveFitCache(cache, "normal", "n", function () {
      runs += 1;
      return { px: 30 };
    });
    const second = engine.resolveFitCache(cache, "normal", "n", function () {
      runs += 1;
      return { px: 31 };
    });

    expect(first).toEqual({ px: 30 });
    expect(second).toEqual({ px: 30 });
    expect(runs).toBe(1);

    engine.clearFitCache(cache, "flat");
    expect(engine.readFitCache(cache, "flat", key)).toBe(null);
    engine.clearFitCache(cache);
    expect(engine.readFitCache(cache, "normal", "n")).toBe(null);
  });

  it("computes responsive insets with compact fill scaling from the shared profile", function () {
    const engine = createEngine();
    const compact = engine.computeResponsiveInsets(120, 80);
    const medium = engine.computeResponsiveInsets(160, 120);
    const large = engine.computeResponsiveInsets(260, 180);
    const legacy = engine.computeInsets(120, 80);

    expect(compact.padX).toBeLessThan(legacy.padX);
    expect(compact.innerY).toBeLessThan(legacy.innerY);
    expect(compact.gapBase).toBeLessThan(legacy.gapBase);
    expect(compact.responsive.textFillScale).toBeGreaterThan(medium.responsive.textFillScale);
    expect(medium.responsive.textFillScale).toBeGreaterThan(large.responsive.textFillScale);
    expect(large.responsive.textFillScale).toBe(1);
    expect(engine.scaleMaxTextPx(20, compact.responsive.textFillScale)).toBeGreaterThan(20);
  });

  it("fits single-line and multi-row text with binary search", function () {
    const engine = createEngine();
    const ctx = createSizingContext();

    const single = engine.fitSingleLineBinary({
      ctx: ctx,
      text: "1234567890",
      maxW: 80,
      maxH: 60,
      minPx: 1,
      maxPx: 60,
      family: "sans-serif",
      weight: 700
    });
    const multi = engine.fitMultiRowBinary({
      ctx: ctx,
      rows: ["LAT:54.1234", "LON:10.9876"],
      maxW: 110,
      maxH: 52,
      minPx: 1,
      maxPx: 52,
      family: "sans-serif",
      weight: 700
    });

    expect(single.px).toBeGreaterThan(0);
    expect(single.px).toBeLessThanOrEqual(60);
    expect(single.width).toBeLessThanOrEqual(80.01);
    expect(multi.px).toBeGreaterThan(0);
    expect(multi.px).toBeLessThanOrEqual(52);
    expect(multi.widths).toHaveLength(2);
    expect(Math.max.apply(null, multi.widths)).toBeLessThanOrEqual(110.01);
  });

  it("fits value/unit and inline triplet rows within width limits", function () {
    const engine = createEngine();
    const ctx = createSizingContext();

    const pair = engine.fitValueUnitRow({
      ctx: ctx,
      valueText: "12.3",
      unitText: "kn",
      baseValuePx: 44,
      secScale: 0.8,
      gap: 8,
      maxW: 90,
      maxH: 44,
      family: "sans-serif",
      valueWeight: 730,
      labelWeight: 610
    });
    const inline = engine.fitInlineTriplet({
      ctx: ctx,
      captionText: "SPD",
      valueText: "12.3",
      unitText: "kn",
      secScale: 0.8,
      gap: 8,
      maxW: 130,
      maxH: 44,
      family: "sans-serif",
      valueWeight: 730,
      labelWeight: 610
    });

    expect(pair.total).toBeLessThanOrEqual(92.01);
    expect(pair.vPx).toBeGreaterThan(0);
    expect(inline.total).toBeLessThanOrEqual(130.01);
    expect(inline.vPx).toBeGreaterThan(0);
    expect(inline.sPx).toBeGreaterThan(0);
  });

  it("propagates stacked row alignment through fit and draw", function () {
    const engine = createEngine();
    const fitCtx = createSizingContext();
    const fit = engine.fitTwoRowsWithHeader({
      ctx: fitCtx,
      mode: "normal",
      W: 200,
      H: 100,
      padX: 12,
      innerY: 2,
      secScale: 0.8,
      captionText: "POS",
      unitText: "nm",
      topText: "LAT",
      bottomText: "LON",
      align: "right",
      family: "sans-serif",
      valueWeight: 730,
      labelWeight: 610
    });
    const drawCtx = createMockContext2D();

    engine.drawTwoRowsWithHeader({
      ctx: drawCtx,
      fit: fit,
      W: 200,
      padX: 12,
      captionText: "POS",
      unitText: "nm",
      topText: "LAT",
      bottomText: "LON",
      family: "sans-serif",
      valueWeight: 730,
      labelWeight: 610
    });

    const fillCalls = drawCtx.calls.filter((/** @type {any} */ entry) => entry.name === "fillText");
    expect(fit.align).toBe("right");
    expect(drawCtx.textAlign).toBe("right");
    expect(fillCalls[2].args[1]).toBe(188);
    expect(fillCalls[3].args[1]).toBe(188);
  });
});
