// @ts-check
const {
  createMockCanvas,
  createMockContext2D,
  loadFresh,
  makeComponentContext,
  renderFrame
} = require("./ThreeValueTextWidget-setup");

describe("ThreeValueTextWidget", function () {
  it("misses cache when dimensions change", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js").create({}, helpers);
    const props = { value: "12.3", caption: "SPD", unit: "kn" };
    const canvasWide = createMockCanvas({
      rectWidth: 420,
      rectHeight: 100,
      ctx: createMockContext2D()
    });
    const canvasWider = createMockCanvas({
      rectWidth: 500,
      rectHeight: 100,
      ctx: createMockContext2D()
    });

    const first = renderFrame(spec, canvasWide, props);
    const second = renderFrame(spec, canvasWide, props);
    const third = renderFrame(spec, canvasWider, props);

    expect(first.measureDelta).toBeGreaterThan(0);
    expect(second.measureDelta).toBe(0);
    expect(third.measureDelta).toBeGreaterThan(0);
  });

  it("keeps draw output semantics unchanged on cache hits", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js").create({}, helpers);
    const canvas = createMockCanvas({
      rectWidth: 220,
      rectHeight: 140,
      ctx: createMockContext2D()
    });
    const props = { value: "12.3", caption: "SPD", unit: "kn" };

    const first = renderFrame(spec, canvas, props);
    const second = renderFrame(spec, canvas, props);

    expect(second.fillDelta).toBeGreaterThan(0);
    expect(second.fillEntries).toEqual(first.fillEntries);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(second.fillEntries.map((entry) => entry.text)).toEqual(first.fillEntries.map((entry) => entry.text));
  });
});
