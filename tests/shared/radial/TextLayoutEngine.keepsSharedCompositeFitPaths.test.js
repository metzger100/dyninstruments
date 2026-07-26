// @ts-check
const { createEngine, createSizingContext } = require("./TextLayoutEngine-setup");

describe("TextLayoutEngine", function () {
  it("keeps shared composite fit paths usable on very small tiles", function () {
    const engine = createEngine();
    const ctx = createSizingContext();

    const highFit = engine.fitThreeRowBlock({
      ctx: ctx,
      W: 24,
      H: 28,
      padX: 1,
      innerY: 1,
      secScale: 0.8,
      textFillScale: 1.18,
      captionText: "SPD",
      valueText: "7",
      unitText: "k",
      family: "sans-serif",
      valueWeight: 730,
      labelWeight: 610
    });
    const normalFit = engine.fitValueUnitCaptionRows({
      ctx: ctx,
      W: 28,
      H: 22,
      padX: 1,
      innerY: 1,
      gapBase: 1,
      secScale: 0.8,
      textFillScale: 1.18,
      captionText: "SPD",
      valueText: "7",
      unitText: "k",
      family: "sans-serif",
      valueWeight: 730,
      labelWeight: 610
    });
    const stackedFit = engine.fitTwoRowsWithHeader({
      ctx: ctx,
      mode: "normal",
      W: 26,
      H: 18,
      padX: 1,
      innerY: 1,
      secScale: 0.8,
      textFillScale: 1.18,
      captionText: "POS",
      unitText: "nm",
      topText: "LAT",
      bottomText: "LON",
      family: "sans-serif",
      valueWeight: 730,
      labelWeight: 610
    });

    expect(highFit.cPx).toBeGreaterThan(0);
    expect(highFit.vPx).toBeGreaterThan(0);
    expect(highFit.uPx).toBeGreaterThan(0);
    expect(normalFit.vPx).toBeGreaterThan(0);
    expect(normalFit.cPx).toBeGreaterThan(0);
    expect(stackedFit.linePx).toBeGreaterThan(0);
    expect(stackedFit.capPx).toBeGreaterThan(0);
  });

  it("allows inline triplet fits below the old 8px minimum on tiny tiles", function () {
    const engine = createEngine();
    const ctx = createSizingContext();
    const inline = engine.fitInlineTriplet({
      ctx: ctx,
      captionText: "S",
      valueText: "7",
      unitText: "",
      secScale: 0.8,
      gap: 1,
      maxW: 8,
      maxH: 5,
      family: "sans-serif",
      valueWeight: 730,
      labelWeight: 610
    });

    expect(inline.vPx).toBeGreaterThan(0);
    expect(inline.vPx).toBeLessThan(8);
    expect(inline.vPx).toBeLessThanOrEqual(5);
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

    // @ts-ignore -- pre-existing untyped test mock boundary
    const textEntries = ctx.calls.filter((entry) => entry.name === "fillText").map((entry) => String(entry.args[0]));
    expect(textEntries).toContain("SPD");
    expect(textEntries).toContain("12.3");
    expect(textEntries).toContain("kn");
  });
});
