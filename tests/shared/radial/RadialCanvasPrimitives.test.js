const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("RadialCanvasPrimitives", function () {
  function create() {
    const mod = loadFresh(
      "shared/widget-kits/radial/RadialCanvasPrimitives.js",
    );
    return mod.create(
      {},
      createComponentContextMock({
        modules: {
          RadialAngleMath: loadFresh(
            "shared/widget-kits/radial/RadialAngleMath.js",
          ),
        },
      }),
    );
  }

  function callsNamed(ctx, name) {
    return ctx.calls.filter(function (call) {
      return call.name === name;
    });
  }

  function expectBalancedSaveRestore(ctx) {
    expect(callsNamed(ctx, "save")).toHaveLength(1);
    expect(callsNamed(ctx, "restore")).toHaveLength(1);
  }

  function pointDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function pointerMetrics(ctx) {
    const points = ctx.calls
      .filter(function (call) {
        return call.name === "moveTo" || call.name === "lineTo";
      })
      .map(function (call) {
        return { x: call.args[0], y: call.args[1] };
      });
    const tip = points[0];
    const left = points[1];
    const right = points[2];
    const baseCenter = {
      x: (left.x + right.x) / 2,
      y: (left.y + right.y) / 2,
    };
    return {
      width: pointDistance(left, right),
      length: pointDistance(tip, baseCenter),
    };
  }

  it("applies stroke styles through drawRing and balances save/restore", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawRing(ctx, 100, 100, 50, {
      strokeStyle: "#224466",
      lineWidth: 3,
      dash: [4, 2],
    });

    expect(ctx.strokeStyle).toBe("#224466");
    expect(callsNamed(ctx, "setLineDash")).toHaveLength(1);
    expect(callsNamed(ctx, "setLineDash")[0].args[0]).toEqual([4, 2]);
    expect(callsNamed(ctx, "arc")).toHaveLength(1);
    expect(callsNamed(ctx, "stroke")).toHaveLength(1);
    expectBalancedSaveRestore(ctx);
  });

  it("fills annular sectors with balanced save/restore semantics", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawAnnularSector(ctx, 100, 100, 50, {
      startDeg: 0,
      endDeg: 90,
      thickness: 8,
      fillStyle: "#123456",
      strokeStyle: "#abcdef",
      lineWidth: 2,
    });

    expect(ctx.fillStyle).toBe("#123456");
    expect(callsNamed(ctx, "fill")).toHaveLength(1);
    expect(callsNamed(ctx, "stroke")).toHaveLength(1);
    expectBalancedSaveRestore(ctx);
  });

  it("uses pointer color from fillStyle", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawPointerAtRim(ctx, 100, 100, 50, 0, {
      fillStyle: "#123456",
      depth: 10,
      halfWidth: 4,
    });
    expect(ctx.fillStyle).toBe("#123456");
    expectBalancedSaveRestore(ctx);
  });

  it("supports color alias for pointer color", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawPointerAtRim(ctx, 100, 100, 50, 0, {
      color: "#abcdef",
      depth: 10,
      halfWidth: 4,
    });
    expect(ctx.fillStyle).toBe("#abcdef");
    expectBalancedSaveRestore(ctx);
  });

  it("does not alter pointer geometry by variant when dimensions are fixed", function () {
    function pointerPath(ctx) {
      return ctx.calls
        .filter(function (call) {
          return call.name === "moveTo" || call.name === "lineTo";
        })
        .map(function (call) {
          return [call.name].concat(call.args);
        });
    }

    const draw = create();
    const normalCtx = createMockContext2D();
    const longCtx = createMockContext2D();
    const pointerOptions = {
      depth: 10,
      halfWidth: 4,
      fillStyle: "#123456",
    };

    draw.drawPointerAtRim(
      normalCtx,
      100,
      100,
      50,
      0,
      Object.assign({}, pointerOptions, { variant: "normal" }),
    );
    draw.drawPointerAtRim(
      longCtx,
      100,
      100,
      50,
      0,
      Object.assign({}, pointerOptions, { variant: "long" }),
    );

    expect(pointerPath(longCtx)).toEqual(pointerPath(normalCtx));
  });

  it("keeps rendered width fixed when only depth changes", function () {
    const draw = create();
    const shortCtx = createMockContext2D();
    const longCtx = createMockContext2D();

    draw.drawPointerAtRim(shortCtx, 100, 100, 50, 0, {
      depth: 10,
      halfWidth: 4,
      fillStyle: "#123456",
    });
    draw.drawPointerAtRim(longCtx, 100, 100, 50, 0, {
      depth: 18,
      halfWidth: 4,
      fillStyle: "#123456",
    });

    const shortMetrics = pointerMetrics(shortCtx);
    const longMetrics = pointerMetrics(longCtx);

    expect(longMetrics.width).toBeCloseTo(shortMetrics.width, 6);
    expect(longMetrics.length).toBeGreaterThan(shortMetrics.length);
  });

  it("keeps rendered length fixed when only halfWidth changes", function () {
    const draw = create();
    const narrowCtx = createMockContext2D();
    const wideCtx = createMockContext2D();

    draw.drawPointerAtRim(narrowCtx, 100, 100, 50, 0, {
      depth: 10,
      halfWidth: 3,
      fillStyle: "#123456",
    });
    draw.drawPointerAtRim(wideCtx, 100, 100, 50, 0, {
      depth: 10,
      halfWidth: 8,
      fillStyle: "#123456",
    });

    const narrowMetrics = pointerMetrics(narrowCtx);
    const wideMetrics = pointerMetrics(wideCtx);

    expect(wideMetrics.length).toBeCloseTo(narrowMetrics.length, 6);
    expect(wideMetrics.width).toBeGreaterThan(narrowMetrics.width);
  });

  it("uses supplied pointer dimensions directly, including fractional values", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawPointerAtRim(ctx, 100, 100, 50, 0, {
      depth: 10.7,
      halfWidth: 4.3,
      fillStyle: "#123456",
    });

    expect(pointerMetrics(ctx).length).toBeCloseTo(9.7, 6);
    expect(pointerMetrics(ctx).width).toBeCloseTo(8.6, 6);
  });

  it("returns without drawing when pointer dimensions are invalid", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawPointerAtRim(ctx, 100, 100, 50, 0, {
      depth: 0,
      halfWidth: 4.3,
      fillStyle: "#123456",
    });

    expect(ctx.calls).toHaveLength(0);
  });

  it("uses supplied rim marker dimensions directly, including fractional values", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawRimMarker(ctx, 100, 100, 150, 0, {
      len: 12.7,
      width: 3.4,
      strokeStyle: "#123456",
    });

    expect(ctx.lineWidth).toBeCloseTo(3.4, 6);
    expect(
      pointDistance(
        {
          x: callsNamed(ctx, "moveTo")[0].args[0],
          y: callsNamed(ctx, "moveTo")[0].args[1],
        },
        {
          x: callsNamed(ctx, "lineTo")[0].args[0],
          y: callsNamed(ctx, "lineTo")[0].args[1],
        },
      ),
    ).toBeCloseTo(12.7, 6);
  });

  it("returns without drawing when rim marker dimensions are invalid", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawRimMarker(ctx, 100, 100, 150, 0, {
      len: 12.7,
      width: 0,
      strokeStyle: "#123456",
    });

    expect(ctx.calls).toHaveLength(0);
  });

  it("keeps drawArrow floors at one for tiny positive dimensions", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawArrow(ctx, 100, 100, 50, 0, {
      tail: 0.4,
      head: 0.2,
      width: 0.3,
      strokeStyle: "#123456",
    });

    const pathPoints = ctx.calls
      .filter(function (call) {
        return call.name === "moveTo" || call.name === "lineTo";
      })
      .map(function (call) {
        return { x: call.args[0], y: call.args[1] };
      });

    expect(ctx.lineWidth).toBe(1);
    expect(pointDistance(pathPoints[2], pathPoints[3])).toBeCloseTo(1, 6);
    expect(pointDistance(pathPoints[4], pathPoints[5])).toBeCloseTo(1, 6);
  });
});
