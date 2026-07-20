const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("TextFitMath", function () {
  function createApi() {
    const module = loadFresh("shared/widget-kits/text/TextFitMath.js");
    return module.create({}, createComponentContextMock());
  }

  it("registers itself on the global DyniComponents root in a non-module browser load", function () {
    const context = createScriptContext();

    runIifeScript("shared/widget-kits/text/TextFitMath.js", context);

    expect(context.DyniComponents.DyniTextFitMath).toBeTruthy();
    expect(context.DyniComponents.DyniTextFitMath.id).toBe("TextFitMath");
  });

  it("returns a safe minimum when called without any arguments", function () {
    const api = createApi();

    expect(api.resolveSecondaryMaxPx()).toBe(1);
  });

  it("derives secondary size from valuePx using the default 0.8 ratio when none is given", function () {
    const api = createApi();

    expect(api.resolveSecondaryMaxPx({ valuePx: 100 })).toBe(80);
  });

  it("uses an explicit positive secondaryToValueRatio against valuePx", function () {
    const api = createApi();

    expect(api.resolveSecondaryMaxPx({ valuePx: 100, secondaryToValueRatio: 0.5 })).toBe(50);
  });

  it("falls back to the default ratio for a zero, negative, or non-numeric secondaryToValueRatio", function () {
    const api = createApi();

    expect(api.resolveSecondaryMaxPx({ valuePx: 100, secondaryToValueRatio: 0 })).toBe(80);
    expect(api.resolveSecondaryMaxPx({ valuePx: 100, secondaryToValueRatio: -2 })).toBe(80);
    expect(api.resolveSecondaryMaxPx({ valuePx: 100, secondaryToValueRatio: "bad" })).toBe(80);
  });

  it("keeps the result at least one pixel even for a tiny valuePx", function () {
    const api = createApi();

    expect(api.resolveSecondaryMaxPx({ valuePx: 1, secondaryToValueRatio: 0.1 })).toBe(1);
  });

  it("derives secondary size from the value rect height when valuePx is missing, zero, or non-finite", function () {
    const api = createApi();

    expect(api.resolveSecondaryMaxPx({ valueRect: { h: 100 } })).toBe(72);
    expect(api.resolveSecondaryMaxPx({ valuePx: 0, valueRect: { h: 100 } })).toBe(72);
    expect(api.resolveSecondaryMaxPx({ valuePx: -5, valueRect: { h: 100 } })).toBe(72);
    expect(api.resolveSecondaryMaxPx({ valuePx: NaN, valueRect: { h: 100 } })).toBe(72);
  });

  it("uses a custom valueMaxPxRatio for the rect-height fallback path", function () {
    const api = createApi();

    expect(api.resolveSecondaryMaxPx({ valueRect: { h: 100 }, valueMaxPxRatio: 0.5 })).toBe(40);
  });

  it("falls back to a 1px rect height when valueRect is missing, not an object, or has no usable h", function () {
    const api = createApi();

    expect(api.resolveSecondaryMaxPx({})).toBe(1);
    expect(api.resolveSecondaryMaxPx({ valueRect: "not-an-object" })).toBe(1);
    expect(api.resolveSecondaryMaxPx({ valueRect: { h: "bad" } })).toBe(1);
  });
});
