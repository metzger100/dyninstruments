const { loadFresh } = require("../../helpers/load-umd");

describe("LinearGaugeMath", function () {
  const math = loadFresh("shared/widget-kits/linear/LinearGaugeMath.js").create();

  it("maps values into axis coordinates with optional clamping", function () {
    expect(math.mapValueToX(15, 0, 30, 10, 110, true)).toBe(60);
    expect(math.mapValueToX(-10, 0, 30, 10, 110, true)).toBe(10);
    expect(math.mapValueToX(-10, 0, 30, 10, 110, false)).toBeLessThan(10);
  });

  it("builds major and minor ticks without duplicating majors", function () {
    const ticks = math.buildTicks(0, 20, 10, 5);

    expect(ticks.major).toEqual([0, 10, 20]);
    expect(ticks.minor).toEqual([5, 15]);
  });

  it("resolves axis domains for supported linear profiles", function () {
    expect(math.resolveAxisDomain("centered180", { min: 10, max: 20 })).toEqual({ min: -180, max: 180 });
    expect(math.resolveAxisDomain("fixed360", { min: 10, max: 20 })).toEqual({ min: 0, max: 360 });
    expect(math.resolveAxisDomain("range", { min: 10, max: 20 })).toEqual({ min: 10, max: 20 });
  });

  it("formats tick labels without trailing integer decimals", function () {
    expect(math.formatTickLabel(12)).toBe("12");
    expect(math.formatTickLabel(12.3456)).toBe("12.346");
    expect(math.formatTickLabel(NaN)).toBe("");
  });
});
