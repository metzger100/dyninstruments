const { loadFresh } = require("../../helpers/load-umd");

describe("LinearGaugeMath", function () {
  const math = loadFresh("shared/widget-kits/linear/LinearGaugeMath.js").create();

  it("keeps high mode caption/value block below the full scale box", function () {
    const layout = math.computeLayout("high", 380, 500, 14, 10);

    expect(layout.captionBox).toBeTruthy();
    expect(layout.valueBox).toBeTruthy();
    expect(layout.captionBox.y).toBeGreaterThanOrEqual(layout.trackBox.y + layout.trackBox.h);
    expect(layout.captionBox.y - (layout.trackBox.y + layout.trackBox.h)).toBeLessThanOrEqual(16);
    expect(layout.captionBox.h).toBeLessThan(layout.valueBox.h);
  });

  it("keeps normal mode inline text below the scale box", function () {
    const layout = math.computeLayout("normal", 820, 280, 11, 8);

    expect(layout.inlineBox).toBeTruthy();
    expect(layout.inlineBox.y).toBeGreaterThanOrEqual(layout.trackBox.y + layout.trackBox.h);
    expect(layout.inlineBox.h).toBeGreaterThan(0);
    expect(layout.inlineBox.y - (layout.trackBox.y + layout.trackBox.h)).toBeLessThanOrEqual(12);
    expect(layout.inlineBox.h).toBeGreaterThanOrEqual(100);
  });

  it("gives flat mode more room to numeric value than caption", function () {
    const layout = math.computeLayout("flat", 520, 140, 8, 6);

    expect(layout.captionBox).toBeTruthy();
    expect(layout.valueBox).toBeTruthy();
    expect(layout.captionBox.h).toBeLessThan(layout.valueBox.h);
  });

  it("splits caption/value rows according to captionUnitScale", function () {
    const splitA = math.splitCaptionValueRows(
      { x: 0, y: 100, w: 200, h: 20 },
      { x: 0, y: 120, w: 200, h: 80 },
      0.8
    );
    const splitB = math.splitCaptionValueRows(
      { x: 0, y: 100, w: 200, h: 20 },
      { x: 0, y: 120, w: 200, h: 80 },
      1.2
    );

    const ratioA = splitA.captionBox.h / (splitA.captionBox.h + splitA.valueBox.h);
    const ratioB = splitB.captionBox.h / (splitB.captionBox.h + splitB.valueBox.h);

    expect(ratioA).toBeCloseTo(0.44, 1);
    expect(ratioB).toBeGreaterThan(ratioA);
    expect(splitA.valueBox.y).toBe(splitA.captionBox.y + splitA.captionBox.h);
  });
});
