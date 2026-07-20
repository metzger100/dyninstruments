const { loadFresh } = require("../../helpers/load-umd");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("GeometryScale", function () {
  function createScaleApi() {
    return loadFresh("shared/widget-kits/layout/GeometryScale.js").create();
  }

  it("registers itself on the global DyniComponents root in a non-module browser load", function () {
    const context = createScriptContext();

    runIifeScript("shared/widget-kits/layout/GeometryScale.js", context);

    expect(context.DyniComponents.DyniGeometryScale).toBeTruthy();
    expect(context.DyniComponents.DyniGeometryScale.id).toBe("GeometryScale");
  });

  it("treats non-numeric primary dimension, factor, or weight inputs as zero extent", function () {
    const api = createScaleApi();

    expect(api.scale(undefined, 0.08)).toBe(1);
    expect(api.scale("abc", 0.08)).toBe(1);
    expect(api.scale(150, undefined)).toBe(1);
    expect(api.scaleStroke(150, 0.02, "bad")).toBe(1);
  });

  it("scales factors to whole pixels and supports explicit extent floors", function () {
    const api = createScaleApi();

    expect(api.scale(150, 0.08, 3)).toBe(12);
    expect(api.scale(10, 0.08, 3)).toBe(3);
    expect(api.scale(150, 0.08)).toBe(12);
    expect(api.scale(50, 0.08)).toBe(4);
    expect(api.scale(10, 0.08)).toBe(1);
  });

  it("applies stroke and pointer weights through the same shared formula", function () {
    const api = createScaleApi();

    expect(api.scaleStroke(150, 0.02, 1.4)).toBe(4);
    expect(api.scaleStroke(150, 0.02, 0.67)).toBe(2);
    expect(api.scaleStroke(150, 0.01, 1.35)).toBe(2);
    expect(api.scaleStroke(10, 0.02, 1.0, 2)).toBe(2);
    expect(api.scaleStroke(150, 0.02, 0.67, 1)).toBe(2);
    expect(api.scalePointer(150, 0.22, 1)).toBe(33);
    expect(api.scalePointer(150, 0.11, 1.54)).toBe(25);
    expect(api.scalePointer(150, 0.11, 0.72)).toBe(11);
  });

  it("derives stroke and extent floors from stroke weight presets", function () {
    const api = createScaleApi();

    expect(api.strokeFloor(0.67)).toBe(1);
    expect(api.strokeFloor(1.0)).toBe(2);
    expect(api.strokeFloor(1.4)).toBe(3);
    expect(api.strokeFloor(1.35)).toBe(3);
    expect(api.extentFloor(1.0)).toBe(3);
    expect(api.extentFloor(0.67)).toBe(2);
  });

  it("returns one for zero or negative primary dimensions and keeps positive results at or above one", function () {
    const api = createScaleApi();

    expect(api.scale(0, 0.08)).toBe(1);
    expect(api.scale(-50, 0.08)).toBe(1);
    expect(api.scaleStroke(0, 0.02, 1.4)).toBe(1);
    expect(api.scaleStroke(-50, 0.02, 1.4)).toBe(1);
    expect(api.scalePointer(0, 0.22, 1)).toBe(1);
    expect(api.scalePointer(-50, 0.22, 1)).toBe(1);

    [1, 10, 50, 150].forEach(function (primaryDim) {
      expect(api.scale(primaryDim, 0.08)).toBeGreaterThanOrEqual(1);
      expect(api.scaleStroke(primaryDim, 0.02, 1.4)).toBeGreaterThanOrEqual(1);
      expect(api.scalePointer(primaryDim, 0.11, 1)).toBeGreaterThanOrEqual(1);
    });
  });
});
