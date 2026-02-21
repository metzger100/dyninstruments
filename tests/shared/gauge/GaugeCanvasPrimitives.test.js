const { loadFresh } = require("../../helpers/load-umd");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("GaugeCanvasPrimitives", function () {
  function create() {
    const mod = loadFresh("shared/widget-kits/gauge/GaugeCanvasPrimitives.js");
    return mod.create({}, {
      getModule(id) {
        if (id !== "GaugeAngleMath") throw new Error("unexpected module: " + id);
        return loadFresh("shared/widget-kits/gauge/GaugeAngleMath.js");
      }
    });
  }

  it("uses pointer color from fillStyle", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawPointerAtRim(ctx, 100, 100, 50, 0, {
      fillStyle: "#123456"
    });
    expect(ctx.fillStyle).toBe("#123456");
  });

  it("supports color alias for pointer color", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawPointerAtRim(ctx, 100, 100, 50, 0, {
      color: "#abcdef"
    });
    expect(ctx.fillStyle).toBe("#abcdef");
  });
});
