const { loadFresh } = require("../../helpers/load-umd");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("RadialCanvasPrimitives", function () {
  function create() {
    const mod = loadFresh("shared/widget-kits/radial/RadialCanvasPrimitives.js");
    return mod.create({}, {
      getModule(id) {
        if (id !== "RadialAngleMath") throw new Error("unexpected module: " + id);
        return loadFresh("shared/widget-kits/radial/RadialAngleMath.js");
      }
    });
  }

  it("uses pointer color from fillStyle", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawPointerAtRim(ctx, 100, 100, 50, 0, {
      fillStyle: "#123456",
      sideFactor: 0.25,
      lengthFactor: 2
    });
    expect(ctx.fillStyle).toBe("#123456");
  });

  it("supports color alias for pointer color", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawPointerAtRim(ctx, 100, 100, 50, 0, {
      color: "#abcdef",
      sideFactor: 0.25,
      lengthFactor: 2
    });
    expect(ctx.fillStyle).toBe("#abcdef");
  });

  it("does not alter pointer geometry by variant when factors are fixed", function () {
    function pointerPath(ctx) {
      return ctx.calls
        .filter(function (call) { return call.name === "moveTo" || call.name === "lineTo"; })
        .map(function (call) { return [call.name].concat(call.args); });
    }

    const draw = create();
    const normalCtx = createMockContext2D();
    const longCtx = createMockContext2D();
    const pointerOptions = {
      depth: 10,
      sideFactor: 0.3,
      lengthFactor: 1,
      fillStyle: "#123456"
    };

    draw.drawPointerAtRim(normalCtx, 100, 100, 50, 0, Object.assign({}, pointerOptions, { variant: "normal" }));
    draw.drawPointerAtRim(longCtx, 100, 100, 50, 0, Object.assign({}, pointerOptions, { variant: "long" }));

    expect(pointerPath(longCtx)).toEqual(pointerPath(normalCtx));
  });
});
