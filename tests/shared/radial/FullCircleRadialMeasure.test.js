const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("FullCircleRadialMeasure", function () {
  /** @param {any} [overrides] */
  function createHarness(overrides) {
    const cfg = overrides || {};
    const fitCalls = /** @type {any[]} */ ([]);
    const state = {
      ctx: {},
      family: "sans-serif",
      valueWeight: 700,
      labelWeight: 700,
      textFillScale: hasOwn(cfg, "textFillScale") ? cfg.textFillScale : 1,
      theme: cfg.theme || {},
      text: {
        fitTextPx(/** @type {any} */ ctx, /** @type {any} */ text, /** @type {any} */ maxW, /** @type {any} */ maxH) {
          fitCalls.push({ text, maxW, maxH });
          const len = Math.max(1, String(text || "").length);
          return Math.max(1, Math.min(Math.floor(maxW / len), Math.max(1, Math.floor(maxH * 0.8))));
        }
      }
    };
    return { state, fitCalls };
  }

  /** @param {any} source @param {any} key */
  function hasOwn(source, key) {
    return Object.prototype.hasOwnProperty.call(source || {}, key);
  }

  /** @returns {any} */
  function createMeasureApi() {
    return loadFresh("shared/widget-kits/radial/FullCircleRadialMeasure.js").create({}, createComponentContextMock());
  }

  it("clamps resolveSecondaryScale to [0.3, 3.0] with a 0.8 fallback", function () {
    const measure = createMeasureApi();

    expect(measure.resolveSecondaryScale(1.5)).toBe(1.5);
    expect(measure.resolveSecondaryScale(10)).toBe(3.0);
    expect(measure.resolveSecondaryScale(0.01)).toBe(0.3);
    expect(measure.resolveSecondaryScale(undefined)).toBe(0.8);
  });

  it("growSize returns the ceiling once current already meets or exceeds it", function () {
    const measure = createMeasureApi();

    expect(measure.growSize(20, 10, 2)).toBe(10);
    expect(measure.growSize(10, 10, 2)).toBe(10);
  });

  it("growSize grows current toward ceiling proportional to textFillScale", function () {
    const measure = createMeasureApi();

    const noGrowth = measure.growSize(10, 20, 1);
    const grown = measure.growSize(10, 20, 2);

    expect(noGrowth).toBe(10);
    expect(grown).toBeGreaterThan(noGrowth);
    expect(grown).toBeLessThanOrEqual(20);
  });

  it("normalConfig falls back to defaults when no theme override is present", function () {
    const measure = createMeasureApi();
    const harness = createHarness();

    const cfg = measure.normalConfig(harness.state);

    expect(cfg).toEqual({
      innerMarginFactor: 0.03,
      minHeightFactor: 0.45,
      dualGapFactor: 0.05
    });
  });

  it("normalConfig reads and clamps theme-provided overrides", function () {
    const measure = createMeasureApi();
    const harness = createHarness({
      theme: {
        radial: {
          fullCircle: {
            normal: {
              innerMarginFactor: 5,
              minHeightFactor: 0.6,
              dualGapFactor: 0.1
            }
          }
        }
      }
    });

    const cfg = measure.normalConfig(harness.state);

    expect(cfg.innerMarginFactor).toBe(0.25);
    expect(cfg.minHeightFactor).toBe(0.6);
    expect(cfg.dualGapFactor).toBe(0.1);
  });

  it("boostValueUnitFit passes through a null fit unchanged", function () {
    const measure = createMeasureApi();
    const harness = createHarness();

    expect(measure.boostValueUnitFit(harness.state, null, "kn", 40)).toBeNull();
  });

  it("boostValueUnitFit zeroes uPx/gap when there is no unit text", function () {
    const measure = createMeasureApi();
    const harness = createHarness({ textFillScale: 1.2 });
    const fit = { vPx: 10, uPx: 6, gap: 2, total: 100 };

    const boosted = measure.boostValueUnitFit(harness.state, fit, "", 40);

    expect(boosted.uPx).toBe(0);
    expect(boosted.gap).toBe(0);
    expect(boosted.vPx).toBeGreaterThanOrEqual(fit.vPx);
    expect(boosted.total).toBe(100);
  });

  it("boostInlineFit zeroes cPx/g1 when there is no caption and uPx/g2 when there is no unit", function () {
    const measure = createMeasureApi();
    const harness = createHarness({ textFillScale: 1.2 });
    const fit = { cPx: 4, vPx: 10, uPx: 6, g1: 1, g2: 2, total: 100 };

    const boosted = measure.boostInlineFit(harness.state, fit, "", "", 40);

    expect(boosted.cPx).toBe(0);
    expect(boosted.g1).toBe(0);
    expect(boosted.uPx).toBe(0);
    expect(boosted.g2).toBe(0);
    expect(boosted.vPx).toBeGreaterThanOrEqual(fit.vPx);
  });

  it("measureBlockSizes computes and caches sizes for identical inputs", function () {
    const measure = createMeasureApi();
    const harness = createHarness();
    const display = { caption: "HDM", value: "185", unit: "deg", secScale: 0.8 };

    const first = measure.measureBlockSizes(harness.state, display, 200, 100);
    const callsAfterFirst = harness.fitCalls.length;
    const second = measure.measureBlockSizes(harness.state, display, 200, 100);

    expect(second).toEqual(first);
    expect(harness.fitCalls.length).toBe(callsAfterFirst);
  });

  it("mergeBlockSizes takes the minimum of each dimension across two blocks", function () {
    const measure = createMeasureApi();

    const merged = measure.mergeBlockSizes(
      { cPx: 10, vPx: 20, uPx: 15, hCap: 5, hVal: 30, hUnit: 5 },
      { cPx: 8, vPx: 25, uPx: 12, hCap: 6, hVal: 32, hUnit: 6 }
    );

    expect(merged).toEqual({
      cPx: 8,
      vPx: 20,
      uPx: 12,
      hCap: 5,
      hVal: 30,
      hUnit: 5
    });
  });

  it("scoreSingleCandidate scores larger legible blocks higher", function () {
    const measure = createMeasureApi();
    const display = { caption: "HDM", value: "185", unit: "deg" };

    const smallScore = measure.scoreSingleCandidate(display, { cPx: 10, vPx: 10, uPx: 10 }, 100, 100);
    const largeScore = measure.scoreSingleCandidate(display, { cPx: 20, vPx: 20, uPx: 20 }, 100, 100);

    expect(largeScore).toBeGreaterThan(smallScore);
  });

  it("scoreDualCandidate scores the pair by the weaker side's legibility", function () {
    const measure = createMeasureApi();
    const left = { caption: "AWA", value: "041", unit: "deg" };
    const right = { caption: "AWS", value: "15.3", unit: "kn" };

    const balanced = measure.scoreDualCandidate(
      left,
      right,
      { cPx: 15, vPx: 15, uPx: 15 },
      { cPx: 15, vPx: 15, uPx: 15 },
      100,
      100
    );
    const unbalanced = measure.scoreDualCandidate(
      left,
      right,
      { cPx: 20, vPx: 20, uPx: 20 },
      { cPx: 5, vPx: 5, uPx: 5 },
      100,
      100
    );

    expect(balanced).toBeGreaterThan(unbalanced);
  });
});
