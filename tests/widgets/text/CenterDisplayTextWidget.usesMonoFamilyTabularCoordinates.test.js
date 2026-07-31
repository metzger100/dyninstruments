// @ts-check
const {
  captureTextFonts,
  createMockCanvas,
  createMockContext2D,
  loadFresh,
  makeComponentContext,
  makeProps
} = require("./CenterDisplayTextWidget-setup");

describe("CenterDisplayTextWidget", function () {
  it("uses mono family for tabular coordinates and stable-digit relation rows", function () {
    const helpersMono = makeComponentContext();
    const specMono = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create(
      {},
      helpersMono
    );
    const monoCtx = createMockContext2D();
    const monoFonts = captureTextFonts(monoCtx);
    const monoCanvas = createMockCanvas({ rectWidth: 260, rectHeight: 180, ctx: monoCtx });
    specMono.renderCanvas(
      monoCanvas,
      makeProps({
        activeMeasure: undefined,
        coordinatesTabular: true,
        stableDigits: true
      })
    );

    const helpersPlain = makeComponentContext();
    const specPlain = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create(
      {},
      helpersPlain
    );
    const plainCtx = createMockContext2D();
    const plainFonts = captureTextFonts(plainCtx);
    const plainCanvas = createMockCanvas({ rectWidth: 260, rectHeight: 180, ctx: plainCtx });
    specPlain.renderCanvas(
      plainCanvas,
      makeProps({
        activeMeasure: undefined,
        coordinatesTabular: false,
        stableDigits: false
      })
    );

    const monoLat = monoFonts.find((entry) => entry.text.indexOf("LAT:") === 0);
    const plainLat = plainFonts.find((entry) => entry.text.indexOf("LAT:") === 0);
    const monoRelation = monoFonts.find((entry) => entry.text.indexOf("92") >= 0 && entry.text.indexOf("/") >= 0);
    const plainRelation = plainFonts.find((entry) => entry.text.indexOf("92") >= 0 && entry.text.indexOf("/") >= 0);

    expect(monoLat).toBeTruthy();
    expect(plainLat).toBeTruthy();
    expect(monoRelation).toBeTruthy();
    expect(plainRelation).toBeTruthy();
    if (!monoLat || !plainLat || !monoRelation || !plainRelation) {
      throw new Error("Expected all coordinate font captures.");
    }
    expect(String(monoLat.font)).toContain("monospace");
    expect(String(monoRelation.font)).toContain("monospace");
    expect(String(plainLat.font)).toContain("sans-serif");
    expect(String(plainRelation.font)).toContain("sans-serif");
  });
});
