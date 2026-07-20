const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("AisTargetLayoutMath", function () {
  function createLayoutMath() {
    return loadFresh("shared/widget-kits/nav/AisTargetLayoutMath.js").create({}, createComponentContextMock({}));
  }

  it("splits a valid content height into name/front/metrics bands using the requested shares", function () {
    const layoutMath = createLayoutMath();

    const bands = layoutMath.resolveIdentityBandHeights(200, 6, 4, 0.2, 0.16, 20);

    expect(bands).toEqual({
      nameHeight: 40,
      frontHeight: 24,
      metricsHeight: 126
    });
  });

  it("falls back to safe minimums when every numeric input is missing", function () {
    const layoutMath = createLayoutMath();

    const bands = layoutMath.resolveIdentityBandHeights(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    expect(bands).toEqual({
      nameHeight: 1,
      frontHeight: 1,
      metricsHeight: 1
    });
  });

  it("clamps the front band to the available space when frontMinHeight exceeds it", function () {
    const layoutMath = createLayoutMath();

    const bands = layoutMath.resolveIdentityBandHeights(100, 0, 0, 0.5, 0.5, 1000);

    expect(bands).toEqual({
      nameHeight: 50,
      frontHeight: 49,
      metricsHeight: 1
    });
  });

  it("treats invalid (non-numeric) gap and content inputs the same as missing ones", function () {
    const layoutMath = createLayoutMath();

    const bands = layoutMath.resolveIdentityBandHeights(
      "not-a-number",
      "also-not-a-number",
      "nope",
      0.2,
      0.16,
      "nope-either"
    );

    expect(bands).toEqual({
      nameHeight: 1,
      frontHeight: 1,
      metricsHeight: 1
    });
  });

  it("exposes the injected clampNumber helper from ValueMath", function () {
    const layoutMath = createLayoutMath();

    expect(typeof layoutMath.clampNumber).toBe("function");
    expect(layoutMath.clampNumber(5, 0, 1, 0.5)).toBe(1);
  });

  it("registers itself on root.DyniComponents when loaded outside a module system", function () {
    const context = createScriptContext();
    runIifeScript("shared/widget-kits/nav/AisTargetLayoutMath.js", context);

    const component = context.DyniComponents.DyniAisTargetLayoutMath;
    expect(component.id).toBe("AisTargetLayoutMath");

    const api = component.create({}, createComponentContextMock({}));
    const bands = api.resolveIdentityBandHeights(200, 6, 4, 0.2, 0.16, 20);
    expect(bands).toEqual({
      nameHeight: 40,
      frontHeight: 24,
      metricsHeight: 126
    });
  });
});
