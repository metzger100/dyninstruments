// @ts-check
const {
  createMockCanvas,
  createMockContext2D,
  fillTextCalls,
  findAllTexts,
  loadFresh,
  makeComponentContext,
  makeProps
} = require("./CenterDisplayTextWidget-setup");

describe("CenterDisplayTextWidget", function () {
  it("renders placeholders for missing coordinates and relation values", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 260, rectHeight: 180, ctx });

    spec.renderCanvas(
      canvas,
      makeProps({
        position: null,
        marker: {},
        boat: {},
        activeMeasure: undefined
      })
    );

    const texts = fillTextCalls(ctx);
    expect(findAllTexts(texts, "---").length).toBeGreaterThanOrEqual(2);
    expect(findAllTexts(texts, "--- / ---").length).toBe(2);
  });
});
