const { createMockContext2D } = require("../../helpers/mock-canvas");
const { createFontAwareContext, createTextLayout } = require("../../helpers/linear-label-fit");

describe("LinearGaugeTextLayout", function () {
  /** @param {number} textFillScale */
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
    const textLayout = createTextLayout();

    expect(textLayout.resolveLabelBoost("high")).toBe(1.2);
    expect(textLayout.resolveLabelBoost("normal")).toBe(1.26);
    expect(textLayout.resolveLabelBoost("flat")).toBe(1.0);
  });

  it("scales caption, value, and inline fits with textFillScale", function () {
    const textLayout = createTextLayout();
    /** @type {{ captionMax: any[], valueFit: any[], inlineFit: any[] }} */
    const compactCalls = { captionMax: [], valueFit: [], inlineFit: [] };
    /** @type {{ captionMax: any[], valueFit: any[], inlineFit: any[] }} */
    const largeCalls = { captionMax: [], valueFit: [], inlineFit: [] };

    /** @param {{ captionMax: any[], valueFit: any[], inlineFit: any[] }} calls */
    function createTextApi(calls) {
      return {
        measureValueUnitFit() {
          return { vPx: 20, uPx: 10, gap: 4, total: 60 };
        },
        fitInlineCapValUnit() {
          return { cPx: 9, vPx: 20, uPx: 10, g1: 4, g2: 4, total: 80 };
        },
        /**
         * @param {any} ctx
         * @param {any} family
         * @param {any} x
         * @param {any} y
         * @param {any} w
         * @param {any} h
         * @param {any} caption
         * @param {any} capMaxPx
         */
        drawCaptionMax(ctx, family, x, y, w, h, caption, capMaxPx) {
          calls.captionMax.push(capMaxPx);
        },
        /**
         * @param {any} ctx
         * @param {any} family
         * @param {any} x
         * @param {any} y
         * @param {any} w
         * @param {any} h
         * @param {any} valueText
         * @param {any} unitText
         * @param {any} fit
         */
        drawValueUnitWithFit(ctx, family, x, y, w, h, valueText, unitText, fit) {
          calls.valueFit.push(fit);
        },
        /**
         * @param {any} ctx
         * @param {any} family
         * @param {any} x
         * @param {any} y
         * @param {any} w
         * @param {any} h
         * @param {any} caption
         * @param {any} valueText
         * @param {any} unitText
         * @param {any} fit
         */
        drawInlineCapValUnit(ctx, family, x, y, w, h, caption, valueText, unitText, fit) {
          calls.inlineFit.push(fit);
        }
      };
    }

    textLayout.drawCaptionRow(
      createState(1.18),
      createTextApi(compactCalls),
      "AWA",
      { x: 0, y: 0, w: 90, h: 30 },
      0.8,
      "left"
    );
    textLayout.drawCaptionRow(
      createState(1),
      createTextApi(largeCalls),
      "AWA",
      { x: 0, y: 0, w: 90, h: 30 },
      0.8,
      "left"
    );
    textLayout.drawValueUnitRow(
      createState(1.18),
      createTextApi(compactCalls),
      "23",
      "kn",
      { x: 0, y: 0, w: 90, h: 30 },
      0.8,
      "left"
    );
    textLayout.drawValueUnitRow(
      createState(1),
      createTextApi(largeCalls),
      "23",
      "kn",
      { x: 0, y: 0, w: 90, h: 30 },
      0.8,
      "left"
    );
    textLayout.drawInlineRow(
      createState(1.18),
      createTextApi(compactCalls),
      "AWA",
      "23",
      "kn",
      { x: 0, y: 0, w: 140, h: 30 },
      0.8
    );
    textLayout.drawInlineRow(
      createState(1),
      createTextApi(largeCalls),
      "AWA",
      "23",
      "kn",
      { x: 0, y: 0, w: 140, h: 30 },
      0.8
    );

    expect(compactCalls.captionMax[0]).toBeGreaterThan(largeCalls.captionMax[0]);
    expect(compactCalls.valueFit[0].vPx).toBeGreaterThan(largeCalls.valueFit[0].vPx);
    expect(compactCalls.valueFit[0].uPx).toBeGreaterThan(largeCalls.valueFit[0].uPx);
    expect(compactCalls.inlineFit[0].vPx).toBeGreaterThan(largeCalls.inlineFit[0].vPx);
    expect(compactCalls.inlineFit[0].cPx).toBeGreaterThan(largeCalls.inlineFit[0].cPx);
  });

  it("supports custom tick label formatter callback", function () {
    const textLayout = createTextLayout();
    const calls = /** @type {any[]} */ ([]);
    const layerCtx = {
      font: "",
      textAlign: "",
      textBaseline: "",
      /** @param {any} text */
      measureText(text) {
        return { width: String(text || "").length * 8 };
      },
      /**
       * @param {any} text
       * @param {any} x
       * @param {any} y
       */
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
        /**
         * @param {number} value
         * @param {number} minV
         * @param {number} maxV
         * @param {number} x0
         * @param {number} x1
         */
        mapValueToX(value, minV, maxV, x0, x1) {
          return x0 + (x1 - x0) * ((value - minV) / (maxV - minV));
        },
        /** @param {any} value */
        formatTickLabel(value) {
          return String(value);
        }
      },
      /** @param {any} value */
      function (value) {
        return "C" + String(value);
      }
    );

    expect(calls.map((entry) => entry.text)).toEqual(["C0", "C50", "C100"]);
  });

  it("uses edge-aware alignment for first and last tick labels", function () {
    const textLayout = createTextLayout();
    const calls = /** @type {any[]} */ ([]);
    const layerCtx = {
      font: "",
      textAlign: "",
      textBaseline: "",
      /** @param {any} text */
      measureText(text) {
        return { width: String(text || "").length * 6 };
      },
      /**
       * @param {any} text
       * @param {any} x
       * @param {any} y
       */
      fillText(text, x, y) {
        calls.push({ text: text, x: x, y: y, align: layerCtx.textAlign });
      }
    };

    textLayout.drawTickLabels(layerCtx, createState(1), { major: [0, 50, 100], minor: [] }, true, {
      /**
       * @param {number} value
       * @param {number} minV
       * @param {number} maxV
       * @param {number} x0
       * @param {number} x1
       */
      mapValueToX(value, minV, maxV, x0, x1) {
        return x0 + (x1 - x0) * ((value - minV) / (maxV - minV));
      },
      /** @param {any} value */
      formatTickLabel(value) {
        return String(value);
      }
    });

    expect(calls.map((entry) => entry.align)).toEqual(["left", "center", "right"]);
    expect(calls[0].x).toBe(1);
    expect(calls[2].x).toBe(99);
    expect(layerCtx.textAlign).toBe("center");
  });

  it("fits all major labels in a cramped graphics-only layout instead of dropping overlaps", function () {
    const textLayout = createTextLayout();
    const calls = /** @type {any[]} */ ([]);
    const layerCtx = createFontAwareContext(calls);
    const state = createState(1);
    state.ctx = layerCtx;
    state.labelFontPx = 18;
    state.labelInsetPx = 6;
    state.layout = {
      trackY: 22,
      trackBox: { y: 0, h: 48 },
      scaleX0: 0,
      scaleX1: 60
    };
    state.axis = {
      min: 0,
      max: 40
    };

    textLayout.drawTickLabels(layerCtx, state, { major: [0, 10, 20, 30, 40], minor: [] }, true, {
      /**
       * @param {number} value
       * @param {number} minV
       * @param {number} maxV
       * @param {number} x0
       * @param {number} x1
       */
      mapValueToX(value, minV, maxV, x0, x1) {
        return x0 + (x1 - x0) * ((value - minV) / (maxV - minV));
      },
      /** @param {any} value */
      formatTickLabel(value) {
        return String(value);
      }
    });

    const fills = calls.filter((entry) => entry.type === "fillText");
    const fontPx = Number((fills[0].font.match(/([0-9]+(?:\.[0-9]+)?)px/) || [])[1]);

    expect(fills.map((entry) => entry.text)).toEqual(["0", "10", "20", "30", "40"]);
    expect(fontPx).toBeLessThan(18);
    expect(fills.every((entry) => entry.x >= 0 && entry.x <= 60)).toBe(true);
  });
});
