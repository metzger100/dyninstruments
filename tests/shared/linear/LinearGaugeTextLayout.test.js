const { loadFresh } = require("../../helpers/load-umd");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("LinearGaugeTextLayout", function () {
  function createState(textFillScale) {
    return {
      ctx: createMockContext2D({ charWidth: 7 }),
      family: "sans-serif",
      valueWeight: 700,
      labelWeight: 600,
      textFillScale: textFillScale,
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
      labelFontPx: 12,
      labelInsetPx: 4
    };
  }

  it("applies a stronger label boost for normal mode than flat mode", function () {
    const textLayout = loadFresh("shared/widget-kits/linear/LinearGaugeTextLayout.js").create();

    expect(textLayout.resolveLabelBoost("high")).toBe(1.2);
    expect(textLayout.resolveLabelBoost("normal")).toBe(1.26);
    expect(textLayout.resolveLabelBoost("flat")).toBe(1.0);
  });

  it("scales caption, value, and inline fits with textFillScale", function () {
    const textLayout = loadFresh("shared/widget-kits/linear/LinearGaugeTextLayout.js").create();
    const compactCalls = { captionMax: [], valueFit: [], inlineFit: [] };
    const largeCalls = { captionMax: [], valueFit: [], inlineFit: [] };

    function createTextApi(calls) {
      return {
        measureValueUnitFit() {
          return { vPx: 20, uPx: 10, gap: 4, total: 60 };
        },
        fitInlineCapValUnit() {
          return { cPx: 9, vPx: 20, uPx: 10, g1: 4, g2: 4, total: 80 };
        },
        drawCaptionMax(ctx, family, x, y, w, h, caption, capMaxPx) {
          calls.captionMax.push(capMaxPx);
        },
        drawValueUnitWithFit(ctx, family, x, y, w, h, valueText, unitText, fit) {
          calls.valueFit.push(fit);
        },
        drawInlineCapValUnit(ctx, family, x, y, w, h, caption, valueText, unitText, fit) {
          calls.inlineFit.push(fit);
        }
      };
    }

    textLayout.drawCaptionRow(createState(1.18), createTextApi(compactCalls), "AWA", { x: 0, y: 0, w: 90, h: 30 }, 0.8, "left");
    textLayout.drawCaptionRow(createState(1), createTextApi(largeCalls), "AWA", { x: 0, y: 0, w: 90, h: 30 }, 0.8, "left");
    textLayout.drawValueUnitRow(createState(1.18), createTextApi(compactCalls), "23", "kn", { x: 0, y: 0, w: 90, h: 30 }, 0.8, "left");
    textLayout.drawValueUnitRow(createState(1), createTextApi(largeCalls), "23", "kn", { x: 0, y: 0, w: 90, h: 30 }, 0.8, "left");
    textLayout.drawInlineRow(createState(1.18), createTextApi(compactCalls), "AWA", "23", "kn", { x: 0, y: 0, w: 140, h: 30 }, 0.8);
    textLayout.drawInlineRow(createState(1), createTextApi(largeCalls), "AWA", "23", "kn", { x: 0, y: 0, w: 140, h: 30 }, 0.8);

    expect(compactCalls.captionMax[0]).toBeGreaterThan(largeCalls.captionMax[0]);
    expect(compactCalls.valueFit[0].vPx).toBeGreaterThan(largeCalls.valueFit[0].vPx);
    expect(compactCalls.valueFit[0].uPx).toBeGreaterThan(largeCalls.valueFit[0].uPx);
    expect(compactCalls.inlineFit[0].vPx).toBeGreaterThan(largeCalls.inlineFit[0].vPx);
    expect(compactCalls.inlineFit[0].cPx).toBeGreaterThan(largeCalls.inlineFit[0].cPx);
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

    textLayout.drawTickLabels(
      layerCtx,
      createState(1),
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
