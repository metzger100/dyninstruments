const { loadFresh } = require("../../helpers/load-umd");

describe("LinearGaugeTextLayout", function () {
  it("applies a stronger label boost for normal mode than flat mode", function () {
    const textLayout = loadFresh("shared/widget-kits/linear/LinearGaugeTextLayout.js").create();

    expect(textLayout.resolveLabelBoost("high")).toBe(1.2);
    expect(textLayout.resolveLabelBoost("normal")).toBe(1.26);
    expect(textLayout.resolveLabelBoost("flat")).toBe(1.0);
  });

  it("supports custom tick label formatter callback", function () {
    const textLayout = loadFresh("shared/widget-kits/linear/LinearGaugeTextLayout.js").create();
    const calls = [];
    const layerCtx = {
      font: "",
      textAlign: "",
      textBaseline: "",
      measureText(text) {
        return { width: String(text || "").length * 8 };
      },
      fillText(text, x, y) {
        calls.push({ text: text, x: x, y: y });
      }
    };

    const state = {
      labelFontPx: 12,
      labelWeight: 700,
      family: "sans-serif",
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
      }
    };

    textLayout.drawTickLabels(
      layerCtx,
      state,
      { major: [0, 50, 100], minor: [] },
      true,
      {
        mapValueToX(value, minV, maxV, x0, x1) {
          return x0 + (x1 - x0) * ((value - minV) / (maxV - minV));
        },
        formatTickLabel(value) {
          return String(value);
        }
      },
      function (value) {
        return "C" + String(value);
      }
    );

    expect(calls.map((entry) => entry.text)).toEqual(["C0", "C50", "C100"]);
  });
});
