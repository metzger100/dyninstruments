const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("XteLinearPrimitives", function () {
  function create() {
    const mod = loadFresh("shared/widget-kits/xte/XteLinearPrimitives.js");
    return mod.create(
      {},
      createComponentContextMock({
        modules: {
          GeometryScale: loadFresh("shared/widget-kits/layout/GeometryScale.js"),
          LinearCanvasPrimitives: loadFresh("shared/widget-kits/linear/LinearCanvasPrimitives.js"),
          LinearGaugeMath: loadFresh("shared/widget-kits/linear/LinearGaugeMath.js")
        }
      })
    );
  }

  /** @param {Record<string, any>} [overrides] */
  function makeTheme(overrides) {
    const base = {
      strokeWeight: 1,
      pointerDepthWeight: 1,
      pointerSideWeight: 1,
      surface: { fg: "#ffffff" },
      linear: {
        track: { widthFactor: 0.16, lineWidthFactor: 0.018 },
        ticks: {
          majorLenFactor: 0.109,
          majorWidthFactor: 0.027,
          minorLenFactor: 0.064,
          minorWidthFactor: 0.014
        },
        pointer: { depthFactor: 0.24, sideFactor: 0.12 },
        labels: { insetFactor: 1.8, fontFactor: 0.14 }
      }
    };
    return Object.assign({}, base, overrides || {});
  }

  /** @param {Record<string, any>} [overrides] */
  function makeLayout(overrides) {
    const base = {
      gaugeBar: { x: 0, y: 0, w: 200, h: 40 },
      responsive: { textFillScale: 1 }
    };
    return Object.assign({}, base, overrides || {});
  }

  /** @param {any} ctx @param {any} theme @param {any} geom @param {any} ticks @param {any} showEndLabels */
  function endLabelOptions(ctx, theme, geom, ticks, showEndLabels) {
    return {
      ctx,
      theme,
      geom,
      ticks,
      showEndLabels,
      family: "sans-serif",
      labelWeight: 700
    };
  }

  it("resolves geometry with x0 before x1 and a valid label font size", function () {
    const draw = create();
    const geom = draw.resolveGeometry(makeLayout(), makeTheme());

    expect(geom.x0).toBeLessThan(geom.x1);
    expect(geom.primaryDim).toBe(40);
    expect(geom.labelFontPx).toBeGreaterThan(0);
    expect(geom.trackY).toBe(20);
  });

  it("scales stroke widths and pointer size with theme stroke/pointer weights", function () {
    const draw = create();
    const baseGeom = draw.resolveGeometry(makeLayout(), makeTheme());
    const scaledGeom = draw.resolveGeometry(
      makeLayout(),
      makeTheme({ strokeWeight: 3, pointerDepthWeight: 2, pointerSideWeight: 2 })
    );

    expect(scaledGeom.trackLineWidth).toBeGreaterThan(baseGeom.trackLineWidth);
    expect(scaledGeom.majorTickWidth).toBeGreaterThan(baseGeom.majorTickWidth);
    expect(scaledGeom.minorTickWidth).toBeGreaterThan(baseGeom.minorTickWidth);
    expect(scaledGeom.pointerDepth).toBeGreaterThan(baseGeom.pointerDepth);
    expect(scaledGeom.pointerSide).toBeGreaterThan(baseGeom.pointerSide);
  });

  it("skips end labels when disabled or when fewer than two major ticks exist", function () {
    const draw = create();
    const geom = draw.resolveGeometry(makeLayout(), makeTheme());
    const ticks = { major: [-1, 0, 1], minor: [] };
    const theme = makeTheme();

    const disabledCtx = createMockContext2D();
    draw.drawEndLabels(endLabelOptions(disabledCtx, theme, geom, ticks, false));
    expect(disabledCtx.calls.filter((/** @type {any} */ c) => c.name === "fillText")).toHaveLength(0);

    const tooFewCtx = createMockContext2D();
    draw.drawEndLabels(endLabelOptions(tooFewCtx, theme, geom, { major: [0], minor: [] }, true));
    expect(tooFewCtx.calls.filter((/** @type {any} */ c) => c.name === "fillText")).toHaveLength(0);
  });

  it("draws the first and last major tick labels left- and right-aligned", function () {
    const draw = create();
    const geom = draw.resolveGeometry(makeLayout(), makeTheme());
    const ticks = { major: [-1, 0, 1], minor: [] };
    const ctx = createMockContext2D();

    draw.drawEndLabels(endLabelOptions(ctx, makeTheme(), geom, ticks, true));

    const textAligns = ctx.calls
      .filter((/** @type {any} */ c) => c.name === "fillText")
      .map((/** @type {any} */ c) => c.args[0]);
    expect(textAligns).toEqual(["-1", "1"]);
  });

  it("draws the pointer as an upward-pointing triangle in the requested color", function () {
    const draw = create();
    const geom = draw.resolveGeometry(makeLayout(), makeTheme());
    const ctx = createMockContext2D();

    draw.drawPointerUpward(ctx, 100, geom, "#44ccff");

    const names = ctx.calls.map((/** @type {any} */ c) => c.name);
    expect(names).toEqual(expect.arrayContaining(["beginPath", "moveTo", "lineTo", "lineTo", "closePath", "fill"]));
    expect(ctx.fillStyle).toBe("#44ccff");
    const moveTo = ctx.calls.find((/** @type {any} */ c) => c.name === "moveTo");
    expect(moveTo.args[0]).toBe(100);
  });

  it("draws the track as a single horizontal stroked segment", function () {
    const draw = create();
    const geom = draw.resolveGeometry(makeLayout(), makeTheme());
    const ctx = createMockContext2D();

    draw.drawTrackLayer(ctx, geom, "#ffffff");

    const moveTo = ctx.calls.find((/** @type {any} */ c) => c.name === "moveTo");
    const lineTo = ctx.calls.find((/** @type {any} */ c) => c.name === "lineTo");
    expect(moveTo.args).toEqual([geom.x0, geom.trackY]);
    expect(lineTo.args).toEqual([geom.x1, geom.trackY]);
    expect(ctx.calls.some((/** @type {any} */ c) => c.name === "stroke")).toBe(true);
  });

  it("draws minor and major ticks across the configured xte scale", function () {
    const draw = create();
    const geom = draw.resolveGeometry(makeLayout(), makeTheme());
    const ticks = { major: [-1, 0, 1], minor: [-0.5, 0.5] };
    const ctx = createMockContext2D();

    draw.drawTicksLayer(ctx, geom, ticks, 1, "#ffffff");

    const lineTos = ctx.calls.filter((/** @type {any} */ c) => c.name === "lineTo");
    expect(lineTos).toHaveLength(5);
  });

  it("skips minor and major ticks whose mapped position is not finite", function () {
    const draw = create();
    const geom = draw.resolveGeometry(makeLayout(), makeTheme());
    const ticks = { major: [NaN], minor: [Infinity] };
    const ctx = createMockContext2D();

    draw.drawTicksLayer(ctx, geom, ticks, 1, "#ffffff");

    expect(ctx.calls.filter((/** @type {any} */ c) => c.name === "lineTo")).toHaveLength(0);
  });
});
