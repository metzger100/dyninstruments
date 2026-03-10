const { loadFresh } = require("../../helpers/load-umd");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("LinearCanvasPrimitives", function () {
  function create() {
    const mod = loadFresh("shared/widget-kits/linear/LinearCanvasPrimitives.js");
    return mod.create();
  }

  it("applies dash styles through public draw paths", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawTrack(ctx, 10, 90, 24, {
      strokeStyle: "#fff",
      lineWidth: 3,
      dash: [6, 3]
    });

    const dashCalls = ctx.calls.filter(function (call) { return call.name === "setLineDash"; });
    expect(dashCalls).toHaveLength(1);
    expect(dashCalls[0].args[0]).toEqual([6, 3]);
  });

  it("strokes bands when lineWidth is positive", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawBand(ctx, 12, 52, 20, 6, {
      fillStyle: "#f00",
      strokeStyle: "#0f0",
      lineWidth: 2
    });

    expect(ctx.calls.filter(function (call) { return call.name === "fillRect"; })).toHaveLength(1);
    expect(ctx.calls.filter(function (call) { return call.name === "strokeRect"; })).toHaveLength(1);
  });

  it("keeps fill-only bands stroke-free when lineWidth is not positive", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawBand(ctx, 12, 52, 20, 6, {
      fillStyle: "#f00",
      strokeStyle: "#0f0",
      lineWidth: 0
    });

    expect(ctx.calls.filter(function (call) { return call.name === "fillRect"; })).toHaveLength(1);
    expect(ctx.calls.filter(function (call) { return call.name === "strokeRect"; })).toHaveLength(0);
  });
});
