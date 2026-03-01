const { loadFresh } = require("../../helpers/load-umd");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("TextLayoutEngine", function () {
  function createSizingContext() {
    const ctx = createMockContext2D();
    ctx.measureText = function (text) {
      const match = /(\d+)px/.exec(String(this.font || ""));
      const px = match ? Number(match[1]) : 10;
      const width = String(text || "").length * px * 0.6;
      return {
        width: width,
        actualBoundingBoxAscent: px * 0.7,
        actualBoundingBoxDescent: px * 0.3
      };
    };
    return ctx;
  }

  function createEngine() {
    const engineModule = loadFresh("shared/widget-kits/text/TextLayoutEngine.js");
    const primitiveModule = loadFresh("shared/widget-kits/text/TextLayoutPrimitives.js");
    const compositeModule = loadFresh("shared/widget-kits/text/TextLayoutComposite.js");
    const textLayoutModule = loadFresh("shared/widget-kits/radial/RadialTextLayout.js");
    const valueMathModule = {
      create() {
        return {
          isFiniteNumber(n) {
            return typeof n === "number" && isFinite(n);
          },
          clamp(n, lo, hi) {
            const num = Number(n);
            if (!isFinite(num)) return Number(lo);
            return Math.max(Number(lo), Math.min(Number(hi), num));
          },
          computeMode(ratio, normal, flat) {
            if (ratio < normal) return "high";
            if (ratio > flat) return "flat";
            return "normal";
          }
        };
      }
    };

    return engineModule.create({}, {
      getModule(id) {
        if (id === "RadialValueMath") return valueMathModule;
        if (id === "RadialTextLayout") return textLayoutModule;
        if (id === "TextLayoutPrimitives") return primitiveModule;
        if (id === "TextLayoutComposite") return compositeModule;
        throw new Error("unexpected module: " + id);
      }
    });
  }

  it("computes mode routing and collapse flags", function () {
    const engine = createEngine();
    const high = engine.computeModeLayout({ W: 120, H: 220, captionText: "SPD", unitText: "kn" });
    const normal = engine.computeModeLayout({ W: 220, H: 140, captionText: "SPD", unitText: "kn" });
    const flat = engine.computeModeLayout({ W: 500, H: 120, captionText: "SPD", unitText: "kn" });
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

  it("draws inline and block layouts with expected text output", function () {
    const engine = createEngine();
    const ctx = createSizingContext();

    const inlineFit = engine.fitInlineTriplet({
      ctx: ctx,
      captionText: "SPD",
      valueText: "12.3",
      unitText: "kn",
      secScale: 0.8,
      gap: 8,
      maxW: 180,
      maxH: 70,
      family: "sans-serif",
      valueWeight: 730,
      labelWeight: 610
    });
    engine.drawInlineTriplet({
      ctx: ctx,
      fit: inlineFit,
      captionText: "SPD",
      valueText: "12.3",
      unitText: "kn",
      x: 0,
      y: 0,
      W: 180,
      H: 70,
      family: "sans-serif",
      valueWeight: 730,
      labelWeight: 610
    });

    const threeFit = engine.fitThreeRowBlock({
      ctx: ctx,
      W: 160,
      H: 180,
      padX: 8,
      innerY: 5,
      secScale: 0.8,
      captionText: "SPD",
      valueText: "12.3",
      unitText: "kn",
      family: "sans-serif",
      valueWeight: 730,
      labelWeight: 610
    });
    engine.drawThreeRowBlock({
      ctx: ctx,
      fit: threeFit,
      W: 160,
      padX: 8,
      captionText: "SPD",
      valueText: "12.3",
      unitText: "kn",
      family: "sans-serif",
      valueWeight: 730,
      labelWeight: 610
    });

    const textEntries = ctx.calls.filter((entry) => entry.name === "fillText").map((entry) => String(entry.args[0]));
    expect(textEntries).toContain("SPD");
    expect(textEntries).toContain("12.3");
    expect(textEntries).toContain("kn");
  });
});
