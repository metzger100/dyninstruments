const { loadFresh } = require("../../helpers/load-umd");

describe("GeometryScale", function () {
  function createScaleApi() {
    return loadFresh("shared/widget-kits/layout/GeometryScale.js").create();
  }

  it("scales factors to whole pixels with a hard floor of one", function () {
    const api = createScaleApi();

    expect(api.scale(150, 0.08)).toBe(12);
    expect(api.scale(110, 0.109)).toBe(11);
    expect(api.scale(0, 0.08)).toBe(1);
    expect(api.scale(-50, 0.08)).toBe(1);
  });

  it("applies stroke and pointer weights through the same shared formula", function () {
    const api = createScaleApi();

    expect(api.scaleStroke(150, 0.02, 1.35)).toBe(4);
    expect(api.scalePointer(150, 0.11, 1)).toBe(16);
    expect(api.scalePointer(150, 0.11, 0.72)).toBe(11);
  });

  it("treats non-finite inputs as zeroed boundary values", function () {
    const api = createScaleApi();

    expect(api.scale(Number.NaN, 0.08)).toBe(1);
    expect(api.scaleStroke(150, Number.NaN, 1.2)).toBe(1);
    expect(api.scalePointer(150, 0.11, Number.NaN)).toBe(1);
  });
});
