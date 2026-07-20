const {
  evaluateLinearScaling,
  evaluateBoundedByConfiguredSteps
} = require("../../tools/quality-policy/operation-count-evaluator.mjs");

describe("tools/quality-policy/operation-count-evaluator.mjs", function () {
  describe("evaluateLinearScaling", function () {
    it("passes a clean linear workload (fixed setup plus one operation per item)", function () {
      const result = evaluateLinearScaling({
        sizes: [10, 20, 40, 80],
        measure: function (n) {
          return 3 + n;
        },
        fixedOverhead: 0
      });

      expect(result.ok).toBe(true);
      expect(result.violations).toEqual([]);
      expect(result.samples).toEqual([
        { n: 10, count: 13 },
        { n: 20, count: 23 },
        { n: 40, count: 43 },
        { n: 80, count: 83 }
      ]);
    });

    it("passes a workload with real fixed overhead once fixedOverhead covers it", function () {
      const result = evaluateLinearScaling({
        sizes: [10, 20],
        measure: function (n) {
          return n === 10 ? 10 + 4 : 20;
        },
        fixedOverhead: 4
      });

      expect(result.ok).toBe(true);
    });

    it("fails a synthetic quadratic workload once growth outpaces any fixed constant", function () {
      const result = evaluateLinearScaling({
        sizes: [10, 20, 40],
        measure: function (n) {
          return n * n;
        },
        fixedOverhead: 5
      });

      expect(result.ok).toBe(false);
      expect(result.violations).toEqual([
        { n: 10, doubledN: 20, count: 100, doubledCount: 400, allowed: 205 },
        { n: 20, doubledN: 40, count: 400, doubledCount: 1600, allowed: 805 }
      ]);
    });

    it("throws when fewer than two sizes are given", function () {
      expect(function () {
        evaluateLinearScaling({ sizes: [10], measure: () => 1, fixedOverhead: 0 });
      }).toThrow("at least 2 sizes");
    });

    it("throws when a size does not exactly double the previous size", function () {
      expect(function () {
        evaluateLinearScaling({ sizes: [10, 25], measure: () => 1, fixedOverhead: 0 });
      }).toThrow("exactly double");
    });

    it("throws on a negative or non-finite fixedOverhead", function () {
      expect(function () {
        evaluateLinearScaling({ sizes: [10, 20], measure: () => 1, fixedOverhead: -1 });
      }).toThrow("non-negative finite fixedOverhead");
    });

    it.each([NaN, Infinity, -1, 1.5])("rejects an invalid measured operation count (%s)", function (count) {
      expect(function () {
        evaluateLinearScaling({ sizes: [10, 20], measure: () => count, fixedOverhead: 0 });
      }).toThrow("non-negative finite integer operation count");
    });
  });

  describe("evaluateBoundedByConfiguredSteps", function () {
    it("passes when the measured count stays within tolerance of the configured steps", function () {
      const result = evaluateBoundedByConfiguredSteps({
        steps: [8, 14, 20],
        measure: function (steps) {
          return steps;
        },
        tolerancePerStep: 1
      });

      expect(result.ok).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it("fails when the measured count exceeds the configured-steps bound (input-length-dependent work)", function () {
      const result = evaluateBoundedByConfiguredSteps({
        steps: [14],
        measure: function () {
          return 5000;
        },
        tolerancePerStep: 1
      });

      expect(result.ok).toBe(false);
      expect(result.violations).toEqual([{ steps: 14, count: 5000, allowed: 14 }]);
    });

    it("throws on a non-positive tolerancePerStep", function () {
      expect(function () {
        evaluateBoundedByConfiguredSteps({ steps: [14], measure: () => 1, tolerancePerStep: 0 });
      }).toThrow("positive finite tolerancePerStep");
    });

    it.each([NaN, Infinity, -1, 1.5])("rejects an invalid measured operation count (%s)", function (count) {
      expect(function () {
        evaluateBoundedByConfiguredSteps({ steps: [14], measure: () => count, tolerancePerStep: 1 });
      }).toThrow("non-negative finite integer operation count");
    });
  });
});
