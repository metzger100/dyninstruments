const { loadFresh } = require("./load-umd");

function createFontAwareContext(calls, options) {
  const opts = options || {};
  const charFactor = Number.isFinite(opts.charFactor) ? opts.charFactor : 0.58;
  const ctxCalls = calls || [];
  let currentFont = "600 10px sans-serif";
  let currentFontPx = 10;
  const stateStack = [];

  return {
    calls: ctxCalls,
    textAlign: "left",
    textBaseline: "alphabetic",
    get font() {
      return currentFont;
    },
    set font(value) {
      currentFont = String(value || "");
      const match = currentFont.match(/([0-9]+(?:\.[0-9]+)?)px/);
      currentFontPx = match ? Number(match[1]) : 10;
    },
    measureText(text) {
      const content = String(text || "");
      const width = content.length * currentFontPx * charFactor;
      ctxCalls.push({
        type: "measureText",
        text: content,
        font: currentFont,
        fontPx: currentFontPx,
        width: width
      });
      return { width: width };
    },
    save() {
      stateStack.push({
        textAlign: this.textAlign,
        textBaseline: this.textBaseline,
        font: currentFont,
        fontPx: currentFontPx
      });
      ctxCalls.push({ type: "save" });
    },
    restore() {
      const prev = stateStack.pop();
      if (prev) {
        this.textAlign = prev.textAlign;
        this.textBaseline = prev.textBaseline;
        currentFont = prev.font;
        currentFontPx = prev.fontPx;
      }
      ctxCalls.push({ type: "restore" });
    },
    beginPath() {
      ctxCalls.push({ type: "beginPath" });
    },
    rect(x, y, w, h) {
      ctxCalls.push({ type: "rect", x: x, y: y, w: w, h: h });
    },
    clip() {
      ctxCalls.push({ type: "clip" });
    },
    fillText(text, x, y) {
      ctxCalls.push({
        type: "fillText",
        text: String(text || ""),
        x: x,
        y: y,
        align: this.textAlign,
        font: currentFont,
        fontPx: currentFontPx
      });
    }
  };
}

function createTextLayout() {
  const textLayoutMod = loadFresh("shared/widget-kits/linear/LinearGaugeTextLayout.js");
  const labelFitMod = loadFresh("shared/widget-kits/linear/LinearGaugeLabelFit.js");
  return textLayoutMod.create({}, {
    getModule(id) {
      if (id === "LinearGaugeLabelFit") {
        return labelFitMod;
      }
      throw new Error("unexpected module: " + id);
    }
  });
}

module.exports = {
  createFontAwareContext,
  createTextLayout
};
