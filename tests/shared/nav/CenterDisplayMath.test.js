const { loadFresh } = require("../../helpers/load-umd");

describe("CenterDisplayMath", function () {
  it("normalizes center-display points and extracts the first measure point", function () {
    const math = loadFresh("shared/widget-kits/nav/CenterDisplayMath.js").create();
    expect(math.normalizePoint({ lat: 54.1, lon: 10.2 })).toEqual({ lat: 54.1, lon: 10.2 });
    expect(math.normalizePoint([10.2, 54.1])).toEqual({ lat: 54.1, lon: 10.2 });
    expect(math.normalizePoint({ lat: "x", lon: 10.2 })).toBeNull();
    expect(
      math.extractMeasureStart({
        /** @param {number} index */
        getPointAtIndex(index) {
          return index === 0 ? { lat: 53.9, lon: 9.8 } : undefined;
        }
      })
    ).toEqual({ lat: 53.9, lon: 9.8 });
    expect(math.extractMeasureStart({ points: [{ lat: 1, lon: 2 }] })).toBeNull();
  });

  it("keeps null/blank/partial coordinates invalid during center-point normalization", function () {
    const math = loadFresh("shared/widget-kits/nav/CenterDisplayMath.js").create();

    expect(math.normalizePoint({ lat: null, lon: null })).toBeNull();
    expect(math.normalizePoint({ lat: "", lon: "" })).toBeNull();
    expect(math.normalizePoint({ lat: "   ", lon: "   " })).toBeNull();
    expect(math.normalizePoint({ lat: 54.1, lon: null })).toBeNull();
    expect(math.normalizePoint({ lat: null, lon: 10.2 })).toBeNull();
    expect(math.computeCourseDistance({ lat: 54.1, lon: null }, { lat: 55.0, lon: 11.0 }, false)).toBeNull();
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

  describe("known answers", function () {
    // One degree of arc on the 6371 km sphere: 6371000 * PI / 180 = 111194.9 m.
    const ONE_DEGREE_ARC_M = 111195;
    const MODES = [
      { name: "great-circle", useRhumbLine: false },
      { name: "rhumb-line", useRhumbLine: true }
    ];
    /** @type {Array<{ src: { lat: number, lon: number }, dst: { lat: number, lon: number }, course: number }>} */
    const COURSE_CASES = [
      { src: { lat: 0, lon: 0 }, dst: { lat: 0, lon: 1 }, course: 90 },
      { src: { lat: 0, lon: 0 }, dst: { lat: 1, lon: 0 }, course: 0 },
      { src: { lat: 1, lon: 0 }, dst: { lat: 0, lon: 0 }, course: 180 },
      { src: { lat: 0, lon: 179.5 }, dst: { lat: 0, lon: -179.5 }, course: 90 },
      { src: { lat: 0, lon: 0 }, dst: { lat: 1, lon: 1 }, course: 45 }
    ];
    /** @type {Array<{ src: { lat: number, lon: number }, dst: { lat: number, lon: number }, distance: number }>} */
    const DISTANCE_CASES = [
      { src: { lat: 0, lon: 0 }, dst: { lat: 0, lon: 1 }, distance: ONE_DEGREE_ARC_M },
      { src: { lat: 0, lon: 179.5 }, dst: { lat: 0, lon: -179.5 }, distance: ONE_DEGREE_ARC_M }
    ];

    /** @param {{ lat: number, lon: number }} src @param {{ lat: number, lon: number }} dst @param {string} mode */
    function describeLeg(src, dst, mode) {
      return mode + " (" + src.lat + ", " + src.lon + ") -> (" + dst.lat + ", " + dst.lon + ")";
    }

    MODES.forEach(function (mode) {
      it("returns the known course within 0.05 degrees in " + mode.name + " mode", function () {
        const math = loadFresh("shared/widget-kits/nav/CenterDisplayMath.js").create();

        COURSE_CASES.forEach(function (entry) {
          const leg = math.computeCourseDistance(entry.src, entry.dst, mode.useRhumbLine);
          const courseError = Math.abs(((leg.course - entry.course + 540) % 360) - 180);
          expect(courseError, describeLeg(entry.src, entry.dst, mode.name)).toBeLessThanOrEqual(0.05);
        });
      });

      it("returns the known distance within 0.1 percent in " + mode.name + " mode", function () {
        const math = loadFresh("shared/widget-kits/nav/CenterDisplayMath.js").create();

        DISTANCE_CASES.forEach(function (entry) {
          const leg = math.computeCourseDistance(entry.src, entry.dst, mode.useRhumbLine);
          const relativeError = Math.abs(leg.distance - entry.distance) / entry.distance;
          expect(relativeError, describeLeg(entry.src, entry.dst, mode.name)).toBeLessThanOrEqual(0.001);
        });
      });
    });
  });
});
