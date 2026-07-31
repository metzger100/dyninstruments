// @ts-check
const {
  captureTextCalls,
  createMockCanvas,
  createMockContext2D,
  fillTextCalls,
  findFirstText,
  loadFresh,
  makeComponentContext,
  makeProps
} = require("./CenterDisplayTextWidget-setup");

describe("CenterDisplayTextWidget", function () {
  it("keeps non-tabular center coordinates center-aligned in normal and high modes", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);
    const cases = [
      { width: 260, height: 180, activeMeasure: undefined },
      { width: 140, height: 260, activeMeasure: undefined }
    ];

    cases.forEach((size) => {
      const ctx = createMockContext2D();
      const calls = captureTextCalls(ctx);
      const canvas = createMockCanvas({ rectWidth: size.width, rectHeight: size.height, ctx });

      spec.renderCanvas(
        canvas,
        makeProps({
          activeMeasure: size.activeMeasure,
          coordinatesTabular: false
        })
      );

      const latCall = calls.find((entry) => entry.text.indexOf("LAT:") === 0);
      const lonCall = calls.find((entry) => entry.text.indexOf("LON:") === 0);

      expect(latCall).toBeTruthy();
      expect(lonCall).toBeTruthy();
      expect(latCall.textAlign).toBe("center");
      expect(lonCall.textAlign).toBe("center");
    });
  });

  it("renders flat mode with the center panel on the left and rows on the right", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 520, rectHeight: 100, ctx });

    spec.renderCanvas(canvas, makeProps());

    const texts = fillTextCalls(ctx);
    const center = findFirstText(texts, "CENTER");
    const lat = findFirstText(texts, "LAT:54.123");
    const wp = findFirstText(texts, "WP");
    const boat = findFirstText(texts, "POS");

    if (!center || !lat || !wp || !boat) {
      throw new Error("Expected every relation-row text to be captured.");
    }
    expect(center.x).toBeLessThan(wp.x);
    expect(lat.x).toBeLessThan(wp.x);
    expect(wp.y).toBeLessThan(boat.y);
  });
});
