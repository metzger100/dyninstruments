// @ts-check
const { createFontAwareContext, createState, createTextLayout } = require("./LinearGaugeTextLayout-setup");

describe("LinearGaugeTextLayout", function () {
  it("keeps first and last visible non-endpoint labels edge-protected on moving axes", function () {
    /** @typedef {{ align: string, text: string, type: string, x: number, y: number }} TextCall */
    const textLayout = createTextLayout();
    const calls = /** @type {TextCall[]} */ ([]);
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

    textLayout.drawTickLabels(layerCtx, state, { major: [12, 42, 342, 372], minor: [] }, false, {
      /** @param {number} value @param {number} minV @param {number} maxV @param {number} x0 @param {number} x1 */
      mapValueToX(value, minV, maxV, x0, x1) {
        return x0 + (x1 - x0) * ((value - minV) / (maxV - minV));
      },
      /** @param {number} value */
      formatTickLabel(value) {
        return String(value).padStart(3, "0");
      }
    });

    const fills = calls.filter((entry) => entry.type === "fillText");
    const firstVisible = fills.find((entry) => entry.text === "042");
    const lastVisible = fills.find((entry) => entry.text === "342");

    if (!firstVisible || !lastVisible) {
      throw new Error("Expected both protected axis labels.");
    }

    expect(fills.map((entry) => entry.text)).not.toContain("12");
    expect(fills.map((entry) => entry.text)).not.toContain("372");
    expect(firstVisible.align).toBe("left");
    expect(firstVisible.x).toBeLessThanOrEqual(2);
    expect(lastVisible.align).toBe("right");
    expect(lastVisible.x).toBeGreaterThanOrEqual(78);
  });

  it("keeps centered wind-like labels drawn while hiding only exact axis endpoints", function () {
    /** @typedef {{ text: string, type: string }} TextCall */
    const textLayout = createTextLayout();
    const calls = /** @type {TextCall[]} */ ([]);
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
      {
        major: [-180, -150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180],
        minor: []
      },
      false,
      {
        /** @param {number} value @param {number} minV @param {number} maxV @param {number} x0 @param {number} x1 */
        mapValueToX(value, minV, maxV, x0, x1) {
          return x0 + (x1 - x0) * ((value - minV) / (maxV - minV));
        },
        /** @param {number} value */
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
    /** @typedef {{ text: string, x: number, y: number }} TextCall */
    const textLayout = createTextLayout();
    const calls = /** @type {TextCall[]} */ ([]);
    const state = createState(1);
    state.layout.inlineBox = { x: 0, y: 26, w: 100, h: 12 };
    const layerCtx = {
      font: "",
      textAlign: "",
      textBaseline: "",
      /** @param {string} text */
      measureText(text) {
        return { width: String(text || "").length * 6 };
      },
      /** @param {string} text @param {number} x @param {number} y */
      fillText(text, x, y) {
        calls.push({ text: text, x: x, y: y });
      }
    };

    textLayout.drawTickLabels(layerCtx, state, { major: [0], minor: [] }, true, {
      mapValueToX() {
        return 0;
      },
      formatTickLabel() {
        return "0";
      }
    });

    const firstCall = calls[0];
    if (!firstCall) {
      throw new Error("Expected one tick label call.");
    }
    expect(firstCall.y).toBe(12);
  });

  it("uses layout-owned label font sizes without a local readable-floor override", function () {
    const textLayout = createTextLayout();
    const fonts = /** @type {string[]} */ ([]);
    const layerCtx = {
      font: "",
      textAlign: "",
      textBaseline: "",
      /** @param {string} text */
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

    const firstFont = fonts[0];
    if (!firstFont) {
      throw new Error("Expected one label font capture.");
    }
    expect(firstFont).toContain("4px");
  });
});
