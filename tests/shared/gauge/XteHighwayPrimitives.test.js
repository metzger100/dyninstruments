const { loadFresh } = require("../../helpers/load-umd");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("XteHighwayPrimitives", function () {
  function create() {
    const mod = loadFresh("shared/widget-kits/gauge/XteHighwayPrimitives.js");
    return mod.create();
  }

  function extractBoatPoints(ctx) {
    const calls = ctx.calls;
    const beginIdx = [];
    for (let i = 0; i < calls.length; i += 1) {
      if (calls[i].name === "beginPath") {
        beginIdx.push(i);
      }
    }
    const markerStart = beginIdx[1];
    const markerEnd = calls.findIndex(function (call, idx) {
      return idx > markerStart && call.name === "closePath";
    });
    return calls
      .slice(markerStart, markerEnd + 1)
      .filter(function (call) { return call.name === "moveTo" || call.name === "lineTo"; })
      .map(function (call) { return { x: call.args[0], y: call.args[1] }; });
  }

  function span(points, axis) {
    const values = points.map(function (point) { return point[axis]; });
    return Math.max.apply(null, values) - Math.min.apply(null, values);
  }

  function createLineWidthTrackerContext() {
    const ctx = createMockContext2D();
    const widths = [];
    let value = ctx.lineWidth;
    Object.defineProperty(ctx, "lineWidth", {
      configurable: true,
      get() {
        return value;
      },
      set(next) {
        value = next;
        widths.push(next);
      }
    });
    return { ctx, widths };
  }

  it("draws boat marker as multi-point hull instead of triangle", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawDynamicHighway(ctx, {
      cx: 150,
      horizonY: 40,
      baseY: 170,
      nearHalf: 120
    }, {
      pointer: "#f00",
      alarm: "#f00"
    }, 0.2, false);

    const points = extractBoatPoints(ctx);
    const lineSegments = points.length - 1;
    expect(lineSegments).toBeGreaterThan(6);
  });

  it("scales boat marker and overflow cue with highway size", function () {
    const draw = create();
    const colors = { pointer: "#f00", alarm: "#f00" };
    const smallCtx = createMockContext2D();
    const largeCtx = createMockContext2D();

    draw.drawDynamicHighway(smallCtx, {
      cx: 100,
      horizonY: 40,
      baseY: 120,
      nearHalf: 40
    }, colors, 1.2, true);

    draw.drawDynamicHighway(largeCtx, {
      cx: 220,
      horizonY: 40,
      baseY: 230,
      nearHalf: 140
    }, colors, 1.2, true);

    const smallBoat = extractBoatPoints(smallCtx);
    const largeBoat = extractBoatPoints(largeCtx);
    const smallArc = smallCtx.calls.find(function (call) { return call.name === "arc"; });
    const largeArc = largeCtx.calls.find(function (call) { return call.name === "arc"; });

    expect(span(largeBoat, "y")).toBeGreaterThan(span(smallBoat, "y"));
    expect(span(largeBoat, "x")).toBeGreaterThan(span(smallBoat, "x"));
    expect(largeArc.args[2]).toBeGreaterThan(smallArc.args[2]);
  });

  it("scales static and dynamic line widths with configured lineWidthFactor", function () {
    const draw = create();
    const geom = { cx: 150, horizonY: 40, baseY: 170, nearHalf: 120, farHalf: 30 };
    const colors = {
      pointer: "#f00",
      alarm: "#f00",
      warning: "#f90",
      laylinePort: "#f66",
      laylineStb: "#6f6",
      roadLine: "#fff",
      stripeLine: "#ccc"
    };

    const staticBase = createLineWidthTrackerContext();
    const staticScaled = createLineWidthTrackerContext();
    draw.drawStaticHighway(staticBase.ctx, geom, colors, "normal", { lineWidthFactor: 1 });
    draw.drawStaticHighway(staticScaled.ctx, geom, colors, "normal", { lineWidthFactor: 2 });

    const dynamicBase = createLineWidthTrackerContext();
    const dynamicScaled = createLineWidthTrackerContext();
    draw.drawDynamicHighway(dynamicBase.ctx, geom, colors, 0.1, false, { lineWidthFactor: 1 });
    draw.drawDynamicHighway(dynamicScaled.ctx, geom, colors, 0.1, false, { lineWidthFactor: 2 });

    expect(Math.max.apply(null, staticScaled.widths)).toBeGreaterThan(Math.max.apply(null, staticBase.widths));
    expect(Math.max.apply(null, dynamicScaled.widths)).toBeGreaterThan(Math.max.apply(null, dynamicBase.widths));
  });
});
