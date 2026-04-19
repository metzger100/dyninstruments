const { loadFresh } = require("../../helpers/load-umd");

describe("SpringEasing", function () {
  function createSpring(options) {
    const mod = loadFresh("shared/widget-kits/anim/SpringEasing.js").create({}, {});
    return mod.create(options || {});
  }

  function advanceSeries(spring, steps, startMs, stepMs) {
    const values = [];
    for (let i = 0; i < steps; i += 1) {
      values.push(spring.advance(startMs + (i * stepMs)));
    }
    return values;
  }

  it("snaps on first setTarget before any advance", function () {
    const spring = createSpring();
    spring.setTarget(12);

    expect(spring.advance(0)).toBe(12);
    expect(spring.isSettled()).toBe(true);
  });

  it("moves monotonically toward the target without overshoot", function () {
    const spring = createSpring();
    spring.reset(0);
    spring.setTarget(10);

    const values = advanceSeries(spring, 30, 0, 16);
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1] - 1e-6);
      expect(values[i]).toBeLessThanOrEqual(10 + 1e-6);
    }
  });

  it("ignores non-finite targets", function () {
    const spring = createSpring();
    spring.reset(0);
    spring.setTarget(10);
    spring.advance(0);
    const before = spring.advance(16);

    spring.setTarget(NaN);
    spring.setTarget(Infinity);

    const after = spring.advance(32);
    expect(after).toBeGreaterThan(before);
    expect(after).toBeLessThanOrEqual(10 + 1e-6);
  });

  it("stays velocity-continuous when retargeted", function () {
    const spring = createSpring();
    spring.reset(0);
    spring.setTarget(10);
    spring.advance(0);

    const before = spring.advance(16);
    spring.setTarget(20);
    const after = spring.advance(32);

    expect(after).toBeGreaterThan(before);
    expect(after).toBeLessThan(20);
  });

  it("tracks the same target with similar results at different typical cadences", function () {
    const springA = createSpring();
    const springB = createSpring();
    springA.reset(0);
    springB.reset(0);
    springA.setTarget(20);
    springB.setTarget(20);
    springA.advance(0);
    springB.advance(0);

    let valueA = 0;
    let valueB = 0;
    for (let i = 1; i <= 30; i += 1) {
      valueA = springA.advance(i * 16);
    }
    for (let i = 1; i <= 15; i += 1) {
      valueB = springB.advance(i * 32);
    }

    expect(valueA).toBeCloseTo(valueB, 0);
  });

  it("converges near the target and reports settled", function () {
    const spring = createSpring();
    spring.reset(0);
    spring.setTarget(7);
    spring.advance(0);

    let value = 0;
    for (let i = 1; i <= 240; i += 1) {
      value = spring.advance(i * 16);
    }

    expect(value).toBeCloseTo(7, 2);
    expect(spring.isSettled()).toBe(true);
  });

  it("supports reset snap and wrap-around on the shortest arc", function () {
    const spring = createSpring({ wrap: 360 });
    spring.reset(10);
    spring.setTarget(350);
    spring.advance(0);

    const value = spring.advance(16);
    expect(value).toBeLessThan(10);

    spring.reset(3);
    expect(spring.advance(32)).toBe(3);
    expect(spring.isSettled()).toBe(true);
  });

  it("remains stable when advance gaps are capped", function () {
    const spring = createSpring();
    spring.reset(0);
    spring.setTarget(100);
    spring.advance(0);

    const value = spring.advance(5000);
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(100);
  });
});
