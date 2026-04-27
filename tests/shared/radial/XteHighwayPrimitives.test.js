const { loadFresh } = require("../../helpers/load-umd");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("XteHighwayPrimitives", function () {
  function create() {
    const geometryScale = loadFresh("shared/widget-kits/layout/GeometryScale.js");
    const mod = loadFresh("shared/widget-kits/xte/XteHighwayPrimitives.js");
    return mod.create({}, {
      getModule(id) {
        if (id === "GeometryScale") {
          return geometryScale;
        }
        throw new Error("Unexpected dependency: " + id);
      }
    });
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

  function boatLengthFromPoints(points) {
    return span(points, "y") / 1.18;
  }

  function lineSegments(ctx) {
    const segments = [];
    const calls = ctx.calls;
    for (let i = 0; i < calls.length - 1; i += 1) {
      if (calls[i].name === "moveTo" && calls[i + 1].name === "lineTo") {
        segments.push({
          from: { x: calls[i].args[0], y: calls[i].args[1] },
          to: { x: calls[i + 1].args[0], y: calls[i + 1].args[1] }
        });
      }
    }
    return segments;
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

  it("stores the provided primary dimension in highway geometry", function () {
    const draw = create();
    const geom = draw.highwayGeometry({
      x: 0,
      y: 0,
      w: 280,
      h: 170
    }, "normal", 170);

    expect(geom.primaryDim).toBe(170);
  });

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
    }, 0.2, false, 120, 1, 1);

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
    }, colors, 1.2, true, 40, 1, 1);

    draw.drawDynamicHighway(largeCtx, {
      cx: 220,
      horizonY: 40,
      baseY: 230,
      nearHalf: 140
    }, colors, 1.2, true, 140, 1, 1);

    const smallBoat = extractBoatPoints(smallCtx);
    const largeBoat = extractBoatPoints(largeCtx);
    const smallArc = smallCtx.calls.find(function (call) { return call.name === "arc"; });
    const largeArc = largeCtx.calls.find(function (call) { return call.name === "arc"; });

    expect(span(largeBoat, "y")).toBeGreaterThan(span(smallBoat, "y"));
    expect(span(largeBoat, "x")).toBeGreaterThan(span(smallBoat, "x"));
    expect(largeArc.args[2]).toBeGreaterThan(smallArc.args[2]);
  });

  it("scales the boat marker with configured pointerDepthWeight", function () {
    const draw = create();
    const colors = { pointer: "#f00", alarm: "#f00" };
    const baseCtx = createMockContext2D();
    const scaledCtx = createMockContext2D();
    const geom = {
      cx: 150,
      horizonY: 40,
      baseY: 170,
      nearHalf: 120
    };

    draw.drawDynamicHighway(baseCtx, geom, colors, 0.2, false, 120, 1, 1);
    draw.drawDynamicHighway(scaledCtx, geom, colors, 0.2, false, 120, 1, 1.5);

    const baseBoat = extractBoatPoints(baseCtx);
    const scaledBoat = extractBoatPoints(scaledCtx);

    expect(span(scaledBoat, "y")).toBeGreaterThan(span(baseBoat, "y"));
    expect(span(scaledBoat, "x")).toBeGreaterThan(span(baseBoat, "x"));
  });

  it("draws the static highway as stroke-only geometry with crisp line caps", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawStaticHighway(ctx, {
      cx: 150,
      horizonY: 40,
      baseY: 170,
      nearHalf: 120,
      farHalf: 30
    }, {
      roadLine: "#fff",
      stripeLine: "#ccc"
    }, "normal", 120, 1);

    const fillCalls = ctx.calls.filter(function (call) { return call.name === "fill"; });
    const strokeCalls = ctx.calls.filter(function (call) { return call.name === "stroke"; });

    expect(fillCalls).toHaveLength(0);
    expect(strokeCalls.length).toBeGreaterThan(5);
    expect(ctx.lineCap).toBe("butt");
    expect(ctx.lineJoin).toBe("miter");
  });

  it("scales static and dynamic line widths with configured strokeWeight", function () {
    const draw = create();
    const geom = { cx: 150, horizonY: 40, baseY: 170, nearHalf: 120, farHalf: 30 };
    const colors = {
      pointer: "#f00",
      alarm: "#f00",
      roadLine: "#fff",
      stripeLine: "#ccc"
    };

    const staticBase = createLineWidthTrackerContext();
    const staticScaled = createLineWidthTrackerContext();
    draw.drawStaticHighway(staticBase.ctx, geom, colors, "normal", 120, 1);
    draw.drawStaticHighway(staticScaled.ctx, geom, colors, "normal", 120, 2);

    const dynamicBase = createLineWidthTrackerContext();
    const dynamicScaled = createLineWidthTrackerContext();
    draw.drawDynamicHighway(dynamicBase.ctx, geom, colors, 0.1, false, 120, 1, 1);
    draw.drawDynamicHighway(dynamicScaled.ctx, geom, colors, 0.1, false, 120, 2, 1);

    expect(Math.max.apply(null, staticScaled.widths)).toBeGreaterThan(Math.max.apply(null, staticBase.widths));
    expect(Math.max.apply(null, dynamicScaled.widths)).toBeGreaterThan(Math.max.apply(null, dynamicBase.widths));
  });

  it("scales the highway and boat marker from the primary dimension and respects the lane-depth clamp", function () {
    const draw = create();
    const colors = { pointer: "#f00", alarm: "#f00", roadLine: "#fff", stripeLine: "#ccc" };
    const staticTracker = createLineWidthTrackerContext();

    draw.drawStaticHighway(staticTracker.ctx, {
      cx: 140,
      horizonY: 0,
      baseY: 170,
      nearHalf: 120,
      farHalf: 40
    }, colors, "normal", 170, 1);

    expect(staticTracker.widths[0]).toBe(2);
    expect(Math.max.apply(null, staticTracker.widths)).toBeGreaterThanOrEqual(2);

    [
      { primaryDim: 170, laneDepth: 170, geom: { cx: 140, horizonY: 0, baseY: 170, nearHalf: 120, farHalf: 40 }, expectedLength: 13 },
      { primaryDim: 40, laneDepth: 40, geom: { cx: 80, horizonY: 0, baseY: 40, nearHalf: 40, farHalf: 10 }, expectedLength: 3 }
    ].forEach(function (testCase) {
      const ctx = createMockContext2D();
      draw.drawDynamicHighway(ctx, testCase.geom, colors, 0.2, false, testCase.primaryDim, 1, 1);
      const markerLength = boatLengthFromPoints(extractBoatPoints(ctx));

      expect(markerLength).toBeCloseTo(testCase.expectedLength, 6);
      expect(markerLength).toBeLessThanOrEqual(testCase.laneDepth * 0.24);
    });

    const tinyStatic = createMockContext2D();
    draw.drawStaticHighway(tinyStatic, {
      cx: 20,
      horizonY: 0,
      baseY: 10,
      nearHalf: 8,
      farHalf: 3
    }, colors, "normal", 10, 1);

    const seamLengths = lineSegments(tinyStatic)
      .filter(function (segment) { return segment.from.x === segment.to.x; })
      .map(function (segment) { return Math.abs(segment.to.y - segment.from.y); });

    expect(Math.min.apply(null, seamLengths)).toBe(1);
  });
});
