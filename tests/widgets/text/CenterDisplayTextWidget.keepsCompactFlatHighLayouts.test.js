// @ts-check
const {
  captureTextFonts,
  createMockCanvas,
  createMockContext2D,
  expectTextsInsideCanvas,
  fillTextCalls,
  findFirstText,
  findFirstTextPrefix,
  loadFresh,
  makeComponentContext,
  makeProps,
  parseFontPx
} = require("./CenterDisplayTextWidget-setup");

describe("CenterDisplayTextWidget", function () {
  it("keeps compact flat and high layouts inside the canvas while preserving waypoint and boat rows", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);
    const sizes = [
      { width: 220, height: 80 },
      { width: 120, height: 140 }
    ];

    sizes.forEach((size) => {
      const ctx = createMockContext2D();
      const canvas = createMockCanvas({ rectWidth: size.width, rectHeight: size.height, ctx });

      spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));

      const texts = fillTextCalls(ctx);
      expect(findFirstText(texts, "WP")).toBeTruthy();
      expect(findFirstText(texts, "POS")).toBeTruthy();
      expect(findFirstTextPrefix(texts, "LAT:")).toBeTruthy();
      expect(findFirstTextPrefix(texts, "LON:")).toBeTruthy();
      expectTextsInsideCanvas(texts, size.width, size.height);
    });
  });

  it("keeps coordinate font sizes coupled in normal and flat modes", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);
    const sizes = [
      { width: 260, height: 180 },
      { width: 520, height: 100 }
    ];

    sizes.forEach((size) => {
      const ctx = createMockContext2D();
      const fonts = captureTextFonts(ctx);
      const canvas = createMockCanvas({ rectWidth: size.width, rectHeight: size.height, ctx });

      spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));

      const latCall = fonts.find((entry) => entry.text === "LAT:54.123");
      const lonCall = fonts.find((entry) => entry.text === "LON:10.456");
      const wpValueCall = fonts.find((entry) => entry.text === "92\u00b0 / 12.3nm");
      const boatValueCall = fonts.find((entry) => entry.text === "184\u00b0 / 3.4nm");

      expect(latCall).toBeTruthy();
      expect(lonCall).toBeTruthy();
      expect(wpValueCall).toBeTruthy();
      expect(boatValueCall).toBeTruthy();
      expect(Math.abs(parseFontPx(latCall.font) - parseFontPx(lonCall.font))).toBeLessThanOrEqual(1);
    });
  });
});
