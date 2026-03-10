const { loadFresh } = require("../../helpers/load-umd");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("LinearCanvasPrimitives", function () {
  function create() {
    const mod = loadFresh("shared/widget-kits/linear/LinearCanvasPrimitives.js");
    return mod.create();
  }

  function callsNamed(ctx, name) {
    return ctx.calls.filter(function (call) { return call.name === name; });
  }

  function expectBalancedSaveRestore(ctx) {
    expect(callsNamed(ctx, "save")).toHaveLength(1);
    expect(callsNamed(ctx, "restore")).toHaveLength(1);
  }

  it("applies dash styles through drawTrack and balances save/restore", function () {
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
    expectBalancedSaveRestore(ctx);
    expect(ctx.calls.map(function (call) { return call.name; })).toEqual([
      "save",
      "setLineDash",
      "beginPath",
      "moveTo",
      "lineTo",
      "stroke",
      "restore"
    ]);
  });

  it("strokes bands when lineWidth is positive and balances save/restore", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawBand(ctx, 12, 52, 20, 6, {
      fillStyle: "#f00",
      strokeStyle: "#0f0",
      lineWidth: 2
    });

    expect(ctx.calls.filter(function (call) { return call.name === "fillRect"; })).toHaveLength(1);
    expect(ctx.calls.filter(function (call) { return call.name === "strokeRect"; })).toHaveLength(1);
    expectBalancedSaveRestore(ctx);
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
    expectBalancedSaveRestore(ctx);
  });

  it("draws ticks with the expected path and balances save/restore", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawTick(ctx, 24, 36, 8, {
      strokeStyle: "#0ff",
      lineWidth: 2
    });

    expectBalancedSaveRestore(ctx);
    expect(ctx.calls.map(function (call) { return call.name; })).toEqual([
      "save",
      "beginPath",
      "moveTo",
      "lineTo",
      "stroke",
      "restore"
    ]);
    expect(callsNamed(ctx, "moveTo")[0].args).toEqual([24, 36]);
    expect(callsNamed(ctx, "lineTo")[0].args).toEqual([24, 28]);
  });

  it("draws pointer paths with fill semantics intact and balances save/restore", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawPointer(ctx, 40, 30, {
      color: "#abcdef",
      depth: 9,
      side: 6
    });

    expect(ctx.fillStyle).toBe("#abcdef");
    expectBalancedSaveRestore(ctx);
    expect(ctx.calls.map(function (call) { return call.name; })).toEqual([
      "save",
      "beginPath",
      "moveTo",
      "lineTo",
      "lineTo",
      "closePath",
      "fill",
      "restore"
    ]);
    expect(callsNamed(ctx, "moveTo")[0].args).toEqual([40, 30]);
    expect(callsNamed(ctx, "lineTo")[0].args).toEqual([34, 21]);
    expect(callsNamed(ctx, "lineTo")[1].args).toEqual([46, 21]);
  });
});
