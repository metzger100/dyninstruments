const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("RadialMajorValueLabels", function () {
  /** @param {any[]} drawLabelsCalls */
  function create(drawLabelsCalls) {
    const mod = loadFresh("shared/widget-kits/radial/RadialMajorValueLabels.js");
    return mod.create(
      {},
      createComponentContextMock({
        modules: {
          RadialToolkit: {
            create() {
              return {
                angle: {
                  /** @param {number} v @param {number} minV @param {number} maxV @param {any} arc */
                  valueToAngleFlat(v, minV, maxV, arc) {
                    return arc.startDeg + ((v - minV) / (maxV - minV)) * (arc.endDeg - arc.startDeg);
                  }
                },
                value: {
                  /** @param {number} a @param {number} b @param {number} epsilon */
                  isApprox(a, b, epsilon) {
                    return Math.abs(a - b) <= epsilon;
                  },
                  /** @param {number} v */
                  formatMajorLabel(v) {
                    return String(v);
                  }
                },
                draw: {
                  /** @param {any} ctx @param {number} cx @param {number} cy @param {number} rOuter @param {any} opts */
                  drawLabels(ctx, cx, cy, rOuter, opts) {
                    drawLabelsCalls.push(opts);
                  }
                }
              };
            }
          }
        }
      })
    );
  }

  it("draws one label per major tick across the value range", function () {
    const calls = /** @type {any[]} */ ([]);
    const api = create(calls);

    api.drawMajorValueLabels({
      ctx: {},
      family: "sans-serif",
      geom: { cx: 50, cy: 50, rOuter: 40 },
      labels: { radiusOffset: 4, fontPx: 12 },
      minV: 0,
      maxV: 30,
      majorStep: 10,
      arc: { startDeg: 270, endDeg: 450 },
      showEndLabels: true,
      labelWeight: 700
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].angles).toHaveLength(4);
    expect(Object.keys(calls[0].labelsMap)).toHaveLength(4);
    expect(calls[0].weight).toBe(700);
    expect(calls[0].fontPx).toBe(12);
    expect(calls[0].radiusOffset).toBe(4);
  });

  it("skips the first and last labels when showEndLabels is false", function () {
    const calls = /** @type {any[]} */ ([]);
    const api = create(calls);

    api.drawMajorValueLabels({
      ctx: {},
      family: "sans-serif",
      geom: { cx: 50, cy: 50, rOuter: 40 },
      labels: { radiusOffset: 4, fontPx: 12 },
      minV: 0,
      maxV: 30,
      majorStep: 10,
      arc: { startDeg: 270, endDeg: 450 },
      showEndLabels: false,
      labelWeight: 700
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].angles).toHaveLength(2);
  });

  it("draws nothing when the value range is invalid", function () {
    const calls = /** @type {any[]} */ ([]);
    const api = create(calls);

    api.drawMajorValueLabels({
      ctx: {},
      family: "sans-serif",
      geom: { cx: 0, cy: 0, rOuter: 0 },
      labels: { radiusOffset: 0, fontPx: 0 },
      minV: 30,
      maxV: 0,
      majorStep: 10,
      arc: { startDeg: 270, endDeg: 450 }
    });

    expect(calls).toHaveLength(0);
  });

  it("draws nothing when majorStep is not a positive finite number", function () {
    const calls = /** @type {any[]} */ ([]);
    const api = create(calls);

    api.drawMajorValueLabels({
      ctx: {},
      family: "sans-serif",
      geom: { cx: 0, cy: 0, rOuter: 0 },
      labels: { radiusOffset: 0, fontPx: 0 },
      minV: 0,
      maxV: 30,
      majorStep: 0,
      arc: { startDeg: 270, endDeg: 450 },
      showEndLabels: true,
      labelWeight: 700
    });

    expect(calls).toHaveLength(0);
  });
});
