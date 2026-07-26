// @ts-check
const {
  createMockCanvas,
  createMockContext2D,
  loadFresh,
  makeComponentContext,
  renderFrame
} = require("./ThreeValueTextWidget-setup");

describe("ThreeValueTextWidget", function () {
  it("reuses cached fitting for unchanged keys in high/normal/flat modes", function () {
    const cases = [
      {
        name: "high",
        rectWidth: 120,
        rectHeight: 220,
        props: { value: "12.3", caption: "SPD", unit: "kn" }
      },
      {
        name: "normal",
        rectWidth: 220,
        rectHeight: 140,
        props: { value: "12.3", caption: "SPD", unit: "kn" }
      },
      {
        name: "flat",
        rectWidth: 420,
        rectHeight: 100,
        props: { value: "12.3", caption: "SPD", unit: "kn" }
      }
    ];

    cases.forEach(function (item) {
      const helpers = makeComponentContext();
      const spec = loadFresh("widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js").create({}, helpers);
      const canvas = createMockCanvas({
        rectWidth: item.rectWidth,
        rectHeight: item.rectHeight,
        ctx: createMockContext2D()
      });

      const first = renderFrame(spec, canvas, item.props);
      const second = renderFrame(spec, canvas, item.props);

      expect(first.measureDelta).toBeGreaterThan(0);
      expect(second.measureDelta).toBe(0);
      expect(second.fillDelta).toBeGreaterThan(0);
    });
  });

  it("misses cache when text content changes", function () {
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
    const third = renderFrame(spec, canvas, {
      value: "13.1",
      caption: "SPD",
      unit: "kn"
    });

    expect(first.measureDelta).toBeGreaterThan(0);
    expect(second.measureDelta).toBe(0);
    expect(third.measureDelta).toBeGreaterThan(0);
  });
});
