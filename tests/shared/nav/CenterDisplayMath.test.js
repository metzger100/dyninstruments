const { loadFresh } = require("../../helpers/load-umd");

describe("CenterDisplayMath", function () {
  it("normalizes center-display points and extracts the first measure point", function () {
    const math = loadFresh("shared/widget-kits/nav/CenterDisplayMath.js").create();
    expect(math.normalizePoint({ lat: 54.1, lon: 10.2 })).toEqual({ lat: 54.1, lon: 10.2 });
    expect(math.normalizePoint([10.2, 54.1])).toEqual({ lat: 54.1, lon: 10.2 });
    expect(math.normalizePoint({ lat: "x", lon: 10.2 })).toBeNull();
    expect(math.extractMeasureStart({
      getPointAtIndex(index) {
        return index === 0 ? { lat: 53.9, lon: 9.8 } : undefined;
      }
    })).toEqual({ lat: 53.9, lon: 9.8 });
    expect(math.extractMeasureStart({ points: [{ lat: 1, lon: 2 }] })).toBeNull();
  });

  it("computes finite center-display legs in degrees and meters for great-circle and rhumb-line modes", function () {
    const math = loadFresh("shared/widget-kits/nav/CenterDisplayMath.js").create();
    const src = { lat: 54.2, lon: 10.2 };
    const dst = { lat: 55.0, lon: 14.2 };
    const greatCircle = math.computeCourseDistance(src, dst, false);
    const rhumbLine = math.computeCourseDistance(src, dst, true);

    expect(greatCircle.course).toBeGreaterThanOrEqual(0);
    expect(greatCircle.course).toBeLessThan(360);
    expect(greatCircle.distance).toBeGreaterThan(0);
    expect(rhumbLine.course).toBeGreaterThanOrEqual(0);
    expect(rhumbLine.course).toBeLessThan(360);
    expect(rhumbLine.distance).toBeGreaterThan(0);
    expect(Math.abs(rhumbLine.distance - greatCircle.distance)).toBeGreaterThan(1);
    expect(Math.abs(rhumbLine.course - greatCircle.course)).toBeGreaterThan(0.01);
  });
});
