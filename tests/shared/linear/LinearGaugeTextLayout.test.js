const { createMockContext2D } = require("../../helpers/mock-canvas");
const { createFontAwareContext, createTextLayout } = require("../../helpers/linear-label-fit");

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
    const textLayout = createTextLayout();

    expect(textLayout.resolveLabelBoost("high")).toBe(1.2);
    expect(textLayout.resolveLabelBoost("normal")).toBe(1.26);
    expect(textLayout.resolveLabelBoost("flat")).toBe(1.0);
  });

  it("scales caption, value, and inline fits with textFillScale", function () {
    const textLayout = createTextLayout();
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
    const textLayout = createTextLayout();
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

  it("uses edge-aware alignment for first and last tick labels", function () {
    const textLayout = createTextLayout();
    const calls = [];
    const layerCtx = {
      font: "",
      textAlign: "",
      textBaseline: "",
      measureText(text) {
        return { width: String(text || "").length * 6 };
      },
      fillText(text, x, y) {
        calls.push({ text: text, x: x, y: y, align: layerCtx.textAlign });
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
      }
    );

    expect(calls.map((entry) => entry.align)).toEqual(["left", "center", "right"]);
    expect(calls[0].x).toBe(1);
    expect(calls[2].x).toBe(99);
    expect(layerCtx.textAlign).toBe("center");
  });

  it("fits all major labels in a cramped graphics-only layout instead of dropping overlaps", function () {
    const textLayout = createTextLayout();
    const calls = [];
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

    textLayout.drawTickLabels(
      layerCtx,
      state,
      { major: [0, 10, 20, 30, 40], minor: [] },
      true,
      {
        mapValueToX(value, minV, maxV, x0, x1) {
          return x0 + (x1 - x0) * ((value - minV) / (maxV - minV));
        },
        formatTickLabel(value) {
          return String(value);
        }
      }
    );

    const fills = calls.filter((entry) => entry.type === "fillText");
    const fontPx = Number((fills[0].font.match(/([0-9]+(?:\.[0-9]+)?)px/) || [])[1]);

    expect(fills.map((entry) => entry.text)).toEqual(["0", "10", "20", "30", "40"]);
    expect(fontPx).toBeLessThan(18);
    expect(fills.every((entry) => entry.x >= 0 && entry.x <= 60)).toBe(true);
  });

  it("keeps first and last visible non-endpoint labels edge-protected on moving axes", function () {
    const textLayout = createTextLayout();
    const calls = [];
    const layerCtx = createFontAwareContext(calls, { charFactor: 1 });
    const state = createState(1);
    state.ctx = layerCtx;
    state.labelFontPx = 12;
    state.labelInsetPx = 4;
    state.layout = {
      trackY: 24,
      trackBox: { y: 0, h: 52 },
      scaleX0: 0,
      scaleX1: 80
    };
    state.axis = {
      min: 12,
      max: 372
    };

    textLayout.drawTickLabels(
      layerCtx,
      state,
      { major: [12, 42, 342, 372], minor: [] },
      false,
      {
        mapValueToX(value, minV, maxV, x0, x1) {
          return x0 + (x1 - x0) * ((value - minV) / (maxV - minV));
        },
        formatTickLabel(value) {
          return String(value).padStart(3, "0");
        }
      }
    );

    const fills = calls.filter((entry) => entry.type === "fillText");
    const firstVisible = fills.find((entry) => entry.text === "042");
    const lastVisible = fills.find((entry) => entry.text === "342");

    expect(fills.map((entry) => entry.text)).not.toContain("12");
    expect(fills.map((entry) => entry.text)).not.toContain("372");
    expect(firstVisible.align).toBe("left");
    expect(firstVisible.x).toBeLessThanOrEqual(2);
    expect(lastVisible.align).toBe("right");
    expect(lastVisible.x).toBeGreaterThanOrEqual(78);
  });

  it("keeps centered wind-like labels drawn while hiding only exact axis endpoints", function () {
    const textLayout = createTextLayout();
    const calls = [];
    const layerCtx = createFontAwareContext(calls);
    const state = createState(1);
    state.ctx = layerCtx;
    state.labelFontPx = 12;
    state.labelInsetPx = 4;
    state.layout = {
      trackY: 24,
      trackBox: { y: 0, h: 52 },
      scaleX0: 0,
      scaleX1: 120
    };
    state.axis = {
      min: -180,
      max: 180
    };

    textLayout.drawTickLabels(
      layerCtx,
      state,
      { major: [-180, -150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180], minor: [] },
      false,
      {
        mapValueToX(value, minV, maxV, x0, x1) {
          return x0 + (x1 - x0) * ((value - minV) / (maxV - minV));
        },
        formatTickLabel(value) {
          return String(value);
        }
      }
    );

    const fills = calls.filter((entry) => entry.type === "fillText");
    const drawnLabels = fills.map((entry) => entry.text);

    expect(drawnLabels).toEqual(expect.arrayContaining(["-150", "0", "150"]));
    expect(drawnLabels).not.toContain("-180");
    expect(drawnLabels).not.toContain("180");
  });

  it("caps tick label y against inlineBox top when present", function () {
    const textLayout = createTextLayout();
    const calls = [];
    const state = createState(1);
    state.layout.inlineBox = { x: 0, y: 26, w: 100, h: 12 };
    const layerCtx = {
      font: "",
      textAlign: "",
      textBaseline: "",
      measureText(text) {
        return { width: String(text || "").length * 6 };
      },
      fillText(text, x, y) {
        calls.push({ text: text, x: x, y: y });
      }
    };

    textLayout.drawTickLabels(
      layerCtx,
      state,
      { major: [0], minor: [] },
      true,
      {
        mapValueToX() {
          return 0;
        },
        formatTickLabel() {
          return "0";
        }
      }
    );

    expect(calls[0].y).toBe(12);
  });

  it("uses layout-owned label font sizes without a local readable-floor override", function () {
    const textLayout = createTextLayout();
    const fonts = [];
    const layerCtx = {
      font: "",
      textAlign: "",
      textBaseline: "",
      measureText(text) {
        return { width: String(text || "").length * 6 };
      },
      fillText() {
        fonts.push(layerCtx.font);
      }
    };

    textLayout.drawTickLabels(
      layerCtx,
      Object.assign(createState(1), { labelFontPx: 4, labelInsetPx: 2 }),
      { major: [0], minor: [] },
      true,
      {
        mapValueToX() {
          return 10;
        },
        formatTickLabel() {
          return "0";
        }
      }
    );

    expect(fonts[0]).toContain("4px");
  });
});
