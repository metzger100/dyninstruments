const { createFontAwareContext, createTextLayout } = require("../../helpers/linear-label-fit");

describe("LinearGaugeLabelFit edge policy", function () {
  function createState(policy) {
    return {
      ctx: null,
      family: "sans-serif",
      valueWeight: 700,
      labelWeight: 600,
      textFillScale: 1,
      theme: {
        linear: {
          ticks: {
            majorLen: 8,
            minorLen: 4
          }
        }
      },
      layout: {
        trackY: 20,
        trackBox: { y: 0, h: 40 },
        scaleX0: 0,
        scaleX1: 100
      },
      axis: {
        min: 0,
        max: 100
      },
      labelFontPx: 10,
      labelInsetPx: 4,
      labelEdgePolicy: policy
    };
  }

  function drawLabels(policy) {
    const calls = [];
    const layerCtx = createFontAwareContext(calls, { charFactor: 1 });
    const textLayout = createTextLayout();
    const state = createState(policy);
    state.ctx = layerCtx;

    textLayout.drawTickLabels(
      layerCtx,
      state,
      { major: [5, 40], minor: [] },
      true,
      {
        mapValueToX(value, minV, maxV, x0, x1, doClamp) {
          void doClamp;
          return x0 + (x1 - x0) * ((value - minV) / (maxV - minV));
        },
        formatTickLabel(value) {
          return String(value).padStart(3, "0");
        }
      }
    );

    return {
      calls: calls,
      fills: calls.filter((entry) => entry.type === "fillText")
    };
  }

  it("keeps sliding labels centered on natural positions and clips the row", function () {
    const result = drawLabels("sliding");

    expect(result.fills.map((entry) => entry.text)).toEqual(["005", "040"]);
    expect(result.fills[0].x).toBe(5);
    expect(result.fills[1].x).toBe(40);
    expect(result.fills[0].fontPx).toBe(10);
    expect(result.calls.some((entry) => entry.type === "save")).toBe(true);
    expect(result.calls.some((entry) => entry.type === "clip")).toBe(true);
    expect(result.calls.some((entry) => entry.type === "restore")).toBe(true);
  });

  it("still edge-protects the default static policy", function () {
    const result = drawLabels("inset");

    expect(result.fills.map((entry) => entry.text)).toEqual(["005", "040"]);
    expect(result.fills[0].x).toBeLessThan(5);
    expect(result.fills[0].align).toBe("left");
    expect(result.fills[0].fontPx).toBeLessThan(10);
  });
});
