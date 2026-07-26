// @ts-check
const {
  createMockCanvas,
  createMockContext2D,
  expectTextsInsideCanvas,
  fillTextCalls,
  findFirstText,
  findFirstTextPrefix,
  loadFresh,
  makeComponentContext,
  makeProps
} = require("./CenterDisplayTextWidget-setup");

describe("CenterDisplayTextWidget", function () {
  it("keeps compact nav-page-like sizes inside the canvas while preserving waypoint and boat rows", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);
    const sizes = [
      { width: 120, height: 60 },
      { width: 120, height: 80 },
      { width: 140, height: 90 }
    ];

    sizes.forEach((size) => {
      const ctx = createMockContext2D();
      const canvas = createMockCanvas({ rectWidth: size.width, rectHeight: size.height, ctx });

      spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));

      const texts = fillTextCalls(ctx);
      expect(findFirstTextPrefix(texts, "C")).toBeTruthy();
      expect(findFirstText(texts, "WP")).toBeTruthy();
      expect(findFirstText(texts, "POS")).toBeTruthy();
      expectTextsInsideCanvas(texts, size.width, size.height);
    });
  });

  it("keeps compact measured layouts inside the canvas when the measure row is present", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 120, rectHeight: 80, ctx });

    spec.renderCanvas(canvas, makeProps());

    const texts = fillTextCalls(ctx);
    expect(findFirstText(texts, "MEAS")).toBeTruthy();
    expect(findFirstText(texts, "WP")).toBeTruthy();
    expect(findFirstText(texts, "POS")).toBeTruthy();
    expectTextsInsideCanvas(texts, 120, 80);
  });
});
