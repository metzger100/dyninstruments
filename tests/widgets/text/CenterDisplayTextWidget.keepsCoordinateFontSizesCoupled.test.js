// @ts-check
const {
  captureTextFonts,
  createMockCanvas,
  createMockContext2D,
  loadFresh,
  makeComponentContext,
  makeProps,
  parseFontPx
} = require("./CenterDisplayTextWidget-setup");

describe("CenterDisplayTextWidget", function () {
  it("keeps coordinate font sizes coupled in high mode", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);
    const ctx = createMockContext2D();
    const fonts = captureTextFonts(ctx);
    const canvas = createMockCanvas({ rectWidth: 140, rectHeight: 260, ctx });

    spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));

    const latCall = fonts.find((entry) => entry.text === "LAT:54.123");
    const lonCall = fonts.find((entry) => entry.text === "LON:10.456");

    expect(latCall).toBeTruthy();
    expect(lonCall).toBeTruthy();
    if (!latCall || !lonCall) {
      throw new Error("Expected both coordinate font captures.");
    }
    expect(Math.abs(parseFontPx(latCall.font) - parseFontPx(lonCall.font))).toBeLessThanOrEqual(1);
  });
});
