const fc = require("fast-check");

const { loadFresh } = require("../../helpers/load-umd");

function valueMath() {
  return loadFresh("shared/widget-kits/value/ValueMath.js").create();
}

function radialAngleMath() {
  return loadFresh("shared/widget-kits/radial/RadialAngleMath.js").create();
}

function placeholderNormalize() {
  return loadFresh("shared/widget-kits/format/PlaceholderNormalize.js").create();
}

function radialTickMath() {
  const angle = radialAngleMath();
  const componentContext = {
    components: {
      /** @param {string} id @returns {any} */
      require: function (id) {
        if (id === "RadialAngleMath") return angle;
        throw new Error("unexpected require: " + id);
      }
    }
  };
  return loadFresh("shared/widget-kits/radial/RadialTickMath.js").create({}, componentContext);
}

const finite = () =>
  fc.double({
    min: -1e6,
    max: 1e6,
    noNaN: true,
    noDefaultInfinity: true
  });

describe("shared math property invariants", function () {
  it("clamp always returns a value within the ordered bounds", function () {
    const value = valueMath();
    fc.assert(
      fc.property(finite(), finite(), finite(), function (x, a, b) {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        const out = value.clamp(x, lo, hi);
        expect(Number.isFinite(out)).toBe(true);
        expect(out).toBeGreaterThanOrEqual(lo);
        expect(out).toBeLessThanOrEqual(hi);
      })
    );
  });

  it("lerp stays within the endpoint range for t in [0,1] and hits the endpoints", function () {
    const value = valueMath();
    fc.assert(
      fc.property(finite(), finite(), fc.double({ min: 0, max: 1, noNaN: true }), function (from, to, t) {
        const out = value.lerp(from, to, t);
        expect(Number.isFinite(out)).toBe(true);
        expect(out).toBeGreaterThanOrEqual(Math.min(from, to) - 1e-6);
        expect(out).toBeLessThanOrEqual(Math.max(from, to) + 1e-6);
      })
    );
    expect(value.lerp(3, 9, 0)).toBeCloseTo(3, 10);
    expect(value.lerp(3, 9, 1)).toBeCloseTo(9, 10);
  });

  it("norm360 normalizes any finite angle into [0, 360)", function () {
    const angle = radialAngleMath();
    fc.assert(
      fc.property(finite(), function (deg) {
        const out = angle.norm360(deg);
        expect(Number.isFinite(out)).toBe(true);
        expect(out).toBeGreaterThanOrEqual(0);
        expect(out).toBeLessThan(360);
      })
    );
  });

  it("mod returns a non-negative result below the modulus for positive moduli", function () {
    const angle = radialAngleMath();
    fc.assert(
      fc.property(finite(), fc.double({ min: 1e-3, max: 1e6, noNaN: true }), function (n, m) {
        const out = angle.mod(n, m);
        expect(Number.isFinite(out)).toBe(true);
        expect(out).toBeGreaterThanOrEqual(0);
        expect(out).toBeLessThan(m);
      })
    );
  });

  it("placeholder normalize always yields a string and collapses placeholders to the default", function () {
    const placeholder = placeholderNormalize();
    const realisticInput = fc.oneof(
      fc.string(),
      fc.double({ noNaN: true }),
      fc.integer(),
      fc.boolean(),
      fc.constant(null),
      fc.constant(undefined)
    );
    fc.assert(
      fc.property(realisticInput, function (input) {
        expect(typeof placeholder.normalize(input, "--")).toBe("string");
      })
    );
    fc.assert(
      fc.property(fc.constantFrom("", "   ", "-", "--", "---"), function (input) {
        expect(placeholder.normalize(input, "DEFAULT")).toBe("DEFAULT");
      })
    );
  });

  it("buildTickAngles emits only finite major/minor angles", function () {
    const tick = radialTickMath();
    fc.assert(
      fc.property(
        fc.double({ min: -720, max: 720, noNaN: true }),
        fc.double({ min: -720, max: 720, noNaN: true }),
        fc.double({ min: 1, max: 120, noNaN: true }),
        fc.double({ min: 1, max: 60, noNaN: true }),
        function (startDeg, endDeg, stepMajor, stepMinor) {
          const out = tick.buildTickAngles({
            startDeg,
            endDeg,
            stepMajor,
            stepMinor,
            includeEnd: true
          });
          for (const a of out.majors.concat(out.minors)) {
            expect(Number.isFinite(a)).toBe(true);
          }
        }
      )
    );
  });
});
