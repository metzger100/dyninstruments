const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("RadialFrameRenderer", function () {
  function create() {
    const mod = loadFresh("shared/widget-kits/radial/RadialFrameRenderer.js");
    return mod.create(
      {},
      createComponentContextMock({
        modules: {
          RadialAngleMath: loadFresh("shared/widget-kits/radial/RadialAngleMath.js"),
          RadialTickMath: loadFresh("shared/widget-kits/radial/RadialTickMath.js"),
          RadialCanvasPrimitives: loadFresh("shared/widget-kits/radial/RadialCanvasPrimitives.js")
        }
      })
    );
  }

  /** @param {any} ctx @param {string} name */
  function callsNamed(ctx, name) {
    return ctx.calls.filter(function (/** @type {any} */ call) {
      return call.name === name;
    });
  }

  /** @param {number[]} point */
  function distanceFromOrigin(point) {
    return Math.sqrt(point[0] * point[0] + point[1] * point[1]);
  }

  it("draws minor and major tick lines from an explicit tick range", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawTicks(ctx, 100, 100, 50, {
      startDeg: 0,
      endDeg: 90,
      stepMajor: 30,
      stepMinor: 15,
      includeEnd: true
    });

    expect(callsNamed(ctx, "moveTo").length).toBeGreaterThan(0);
    expect(callsNamed(ctx, "stroke").length).toBeGreaterThan(0);
  });

  it("skips drawing when both major and minor angle lists are empty", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawTicksFromAngles(ctx, 100, 100, 50, { majors: [], minors: [] });

    expect(callsNamed(ctx, "moveTo")).toHaveLength(0);
    expect(callsNamed(ctx, "stroke")).toHaveLength(0);
  });

  it("uses the configured lineCap and major/minor lengths for tick geometry", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawTicksFromAngles(
      ctx,
      0,
      0,
      100,
      { majors: [0], minors: [] },
      {
        lineCap: "round",
        major: { len: 20, width: 4 },
        strokeStyle: "#112233"
      }
    );

    expect(ctx.lineCap).toBe("round");
    expect(ctx.strokeStyle).toBe("#112233");
    const moveTo = callsNamed(ctx, "moveTo")[0];
    const lineTo = callsNamed(ctx, "lineTo")[0];
    expect(distanceFromOrigin(moveTo.args)).toBeCloseTo(80, 6);
    expect(distanceFromOrigin(lineTo.args)).toBeCloseTo(100, 6);
  });

  it("formats generated labels with the default identity formatter", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawLabels(ctx, 100, 100, 50, {
      startDeg: 0,
      endDeg: 90,
      step: 45,
      includeEnd: true
    });

    expect(callsNamed(ctx, "fillText").length).toBeGreaterThan(0);
    expect(
      callsNamed(ctx, "fillText").some(function (/** @type {any} */ call) {
        return call.args[0] === "0";
      })
    ).toBe(true);
  });

  it("uses explicit angles and a labelsMap lookup over the default formatter", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawLabels(ctx, 100, 100, 50, {
      angles: [0, 90],
      labelsMap: { 0: "N", 90: "E" }
    });

    const texts = callsNamed(ctx, "fillText").map(function (/** @type {any} */ call) {
      return call.args[0];
    });
    expect(texts).toEqual(["N", "E"]);
  });

  it("skips labels rejected by labelFilter and blank formatted text", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawLabels(ctx, 100, 100, 50, {
      angles: [0, 45, 90],
      labelFilter: function (/** @type {number} */ deg) {
        return deg !== 45;
      },
      labelFormatter: function (/** @type {number} */ deg) {
        return deg === 90 ? "" : String(deg);
      }
    });

    const texts = callsNamed(ctx, "fillText").map(function (/** @type {any} */ call) {
      return call.args[0];
    });
    expect(texts).toEqual(["0"]);
  });

  it("rotates tangent and radial label text around the label position", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawLabels(ctx, 100, 100, 50, {
      angles: [0],
      textRotation: "tangent"
    });

    expect(callsNamed(ctx, "translate")).toHaveLength(1);
    expect(callsNamed(ctx, "rotate")).toHaveLength(1);
    // withCtx contributes one save/restore pair; the per-label rotation branch adds a second.
    expect(callsNamed(ctx, "save")).toHaveLength(2);
    expect(callsNamed(ctx, "restore")).toHaveLength(2);
  });

  it("composes ring, ticks, and labels in drawDialFrame when all are requested", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawDialFrame(ctx, 100, 100, 50, {
      ring: { strokeStyle: "#000000" },
      ticks: { startDeg: 0, endDeg: 90, stepMajor: 45 },
      labels: { angles: [0, 90] }
    });

    expect(callsNamed(ctx, "arc").length).toBeGreaterThan(0);
    expect(callsNamed(ctx, "fillText").length).toBeGreaterThan(0);
    expect(callsNamed(ctx, "stroke").length).toBeGreaterThan(0);
  });

  it("skips the ring in drawDialFrame when ring is explicitly disabled", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawDialFrame(ctx, 100, 100, 50, { ring: false });

    expect(callsNamed(ctx, "arc")).toHaveLength(0);
  });
});
