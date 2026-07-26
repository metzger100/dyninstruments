// @ts-check
const {
  createMockCanvas,
  createMockContext2D,
  fillTextCalls,
  loadFresh,
  makeComponentContext,
  makeProps
} = require("./CenterDisplayTextWidget-setup");

describe("CenterDisplayTextWidget", function () {
  it("renders disconnected state-screen instead of center and relation rows", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 260, rectHeight: 180, ctx });

    spec.renderCanvas(canvas, makeProps({ disconnect: true }));

    // @ts-ignore -- pre-existing untyped test mock boundary
    const texts = fillTextCalls(ctx).map((entry) => entry.text);
    expect(texts).toContain("GPS Lost");
    expect(texts).not.toContain("CENTER");
    expect(texts).not.toContain("WP");
    expect(texts).not.toContain("POS");
  });
});
