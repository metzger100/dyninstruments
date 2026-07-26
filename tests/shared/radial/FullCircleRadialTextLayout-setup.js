const { loadFresh } = require("../../helpers/load-umd");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

function createRadialTextApi() {
  const fitting = loadFresh("shared/widget-kits/radial/RadialTextFitting.js");
  return loadFresh("shared/widget-kits/text/CanvasTextLayout.js").create(
    {},
    createComponentContextMock({
      modules: {
        RadialTextFitting: fitting
      }
    })
  );
}

// @ts-ignore -- pre-existing untyped test mock boundary
function createHarness(overrides) {
  const cfg = overrides || {};
  const calls = {
    threeRows: [],
    valueUnit: [],
    inline: []
  };
  const state = {
    ctx: {},
    family: "sans-serif",
    valueWeight: 700,
    labelWeight: 700,
    pad: 8,
    W: 300,
    H: 300,
    textFillScale: hasOwn(cfg, "textFillScale") ? cfg.textFillScale : 1,
    theme: cfg.theme || {},
    geom: Object.assign(
      {
        R: 120,
        rOuter: 120,
        cx: 150,
        cy: 150
      },
      cfg.geom || {}
    ),
    layout: Object.assign(
      {
        contentRect: { x: 8, y: 8, w: 284, h: 284 },
        normal: {
          safeRadius: 78,
          compactCenterHeight: 14,
          dualCompactWidth: 120,
          dualCompactInset: 5,
          dualCompactHeight: 55
        }
      },
      cfg.layout || {}
    ),
    slots: Object.assign(
      {
        leftTop: { x: 8, y: 90, w: 36, h: 42 },
        leftBottom: { x: 8, y: 132, w: 36, h: 42 },
        rightTop: { x: 256, y: 90, w: 36, h: 42 },
        rightBottom: { x: 256, y: 132, w: 36, h: 42 },
        top: { x: 8, y: 8, w: 284, h: 26 },
        bottom: { x: 8, y: 266, w: 284, h: 26 }
      },
      cfg.slots || {}
    ),
    text: {
      // @ts-ignore -- pre-existing untyped test mock boundary
      measureValueUnitFit(ctx, family, valueText, unitText, maxW, maxH) {
        return {
          vPx: Math.max(1, Math.floor(maxH * 0.7)),
          uPx: Math.max(1, Math.floor(maxH * 0.45)),
          gap: 4
        };
      },
      // @ts-ignore -- pre-existing untyped test mock boundary
      drawValueUnitWithFit(ctx, family, x, y, w, h, valueText, unitText, fit, align) {
        // @ts-ignore -- pre-existing untyped test mock boundary
        calls.valueUnit.push({ x, y, w, h, valueText, unitText, fit, align });
      },
      // @ts-ignore -- pre-existing untyped test mock boundary
      fitTextPx(ctx, text, maxW, maxH) {
        const len = Math.max(1, String(text || "").length);
        return Math.max(1, Math.min(Math.floor(maxW / len), Math.max(1, Math.floor(maxH * 0.8))));
      },
      // @ts-ignore -- pre-existing untyped test mock boundary
      drawThreeRowsBlock(ctx, family, x, y, w, h, caption, value, unit, secScale, align, sizes) {
        // @ts-ignore -- pre-existing untyped test mock boundary
        calls.threeRows.push({
          x,
          y,
          w,
          h,
          caption,
          value,
          unit,
          secScale,
          align,
          sizes
        });
      },
      drawCaptionMax() {},
      // @ts-ignore -- pre-existing untyped test mock boundary
      fitInlineCapValUnit(ctx, family, caption, valueText, unitText, maxW, maxH) {
        return {
          cPx: Math.max(1, Math.floor(maxH * 0.4)),
          vPx: Math.max(1, Math.floor(maxH * 0.7)),
          uPx: Math.max(1, Math.floor(maxH * 0.45)),
          g1: 4,
          g2: 4,
          total: maxW
        };
      },
      // @ts-ignore -- pre-existing untyped test mock boundary
      drawInlineCapValUnit(ctx, family, x, y, w, h, caption, valueText, unitText, fit) {
        // @ts-ignore -- pre-existing untyped test mock boundary
        calls.inline.push({ x, y, w, h, caption, valueText, unitText, fit });
      }
    }
  };

  return { state, calls };
}

// @ts-ignore -- pre-existing untyped test mock boundary
function hasOwn(source, key) {
  return Object.prototype.hasOwnProperty.call(source || {}, key);
}

// @ts-ignore -- pre-existing untyped test mock boundary
function makeSingleDisplay(overrides) {
  return Object.assign(
    {
      caption: "HDM",
      value: "185",
      unit: "deg",
      secScale: 0.8
    },
    overrides || {}
  );
}

function makeDualDisplay() {
  return {
    left: { caption: "AWA", value: "041", unit: "deg", secScale: 0.8 },
    right: { caption: "AWS", value: "15.3", unit: "kn", secScale: 0.8 }
  };
}

// @ts-ignore -- pre-existing untyped test mock boundary
function createRealTextHarness(overrides) {
  const text = createRadialTextApi();
  const captures = {
    valueUnit: [],
    threeRows: []
  };
  const ctx = {
    calls: [],
    textAlign: "left",
    textBaseline: "alphabetic",
    font: "10px sans-serif",
    save() {
      // @ts-ignore -- pre-existing untyped test mock boundary
      this.calls.push({ name: "save", args: [] });
    },
    restore() {
      // @ts-ignore -- pre-existing untyped test mock boundary
      this.calls.push({ name: "restore", args: [] });
    },
    translate() {
      // @ts-ignore -- pre-existing untyped test mock boundary
      this.calls.push({ name: "translate", args: Array.from(arguments) });
    },
    scale() {
      // @ts-ignore -- pre-existing untyped test mock boundary
      this.calls.push({ name: "scale", args: Array.from(arguments) });
    },
    fillText() {
      // @ts-ignore -- pre-existing untyped test mock boundary
      this.calls.push({ name: "fillText", args: Array.from(arguments) });
    },
    // @ts-ignore -- pre-existing untyped test mock boundary
    measureText(label) {
      // @ts-ignore -- pre-existing untyped test mock boundary
      this.calls.push({ name: "measureText", args: Array.from(arguments) });
      const match = String(this.font || "").match(/([0-9]+(?:\.[0-9]+)?)px/);
      const px = match ? Number(match[1]) : 10;
      return { width: String(label || "").length * px * 0.62 };
    }
  };
  const harness = createHarness(overrides);
  harness.state.ctx = ctx;
  harness.state.text = {
    // @ts-ignore -- pre-existing untyped test mock boundary
    setFont: text.setFont,
    fitTextPx: text.fitTextPx,
    fitSingleTextPx: text.fitSingleTextPx,
    measureValueUnitFit: text.measureValueUnitFit,
    fitInlineCapValUnit: text.fitInlineCapValUnit,
    drawCaptionMax: text.drawCaptionMax,
    drawInlineCapValUnit: text.drawInlineCapValUnit,
    drawDisconnectOverlay: text.drawDisconnectOverlay,
    // @ts-ignore -- pre-existing untyped test mock boundary
    drawValueUnitWithFit(ctxArg, family, x, y, w, h, valueText, unitText, fit, align, valueWeight, labelWeight) {
      const start = ctxArg.calls.length;
      text.drawValueUnitWithFit(ctxArg, family, x, y, w, h, valueText, unitText, fit, align, valueWeight, labelWeight);
      // @ts-ignore -- pre-existing untyped test mock boundary
      const scaled = ctxArg.calls.slice(start).some((entry) => entry.name === "scale" && Number(entry.args[0]) < 1);
      // @ts-ignore -- pre-existing untyped test mock boundary
      captures.valueUnit.push({ w, valueText, unitText, fit, scaled });
    },
    drawThreeRowsBlock(
      // @ts-ignore -- pre-existing untyped test mock boundary
      ctxArg,
      // @ts-ignore -- pre-existing untyped test mock boundary
      family,
      // @ts-ignore -- pre-existing untyped test mock boundary
      x,
      // @ts-ignore -- pre-existing untyped test mock boundary
      y,
      // @ts-ignore -- pre-existing untyped test mock boundary
      w,
      // @ts-ignore -- pre-existing untyped test mock boundary
      h,
      // @ts-ignore -- pre-existing untyped test mock boundary
      caption,
      // @ts-ignore -- pre-existing untyped test mock boundary
      valueText,
      // @ts-ignore -- pre-existing untyped test mock boundary
      unitText,
      // @ts-ignore -- pre-existing untyped test mock boundary
      secScale,
      // @ts-ignore -- pre-existing untyped test mock boundary
      align,
      // @ts-ignore -- pre-existing untyped test mock boundary
      sizes,
      // @ts-ignore -- pre-existing untyped test mock boundary
      valueWeight,
      // @ts-ignore -- pre-existing untyped test mock boundary
      labelWeight
    ) {
      const start = ctxArg.calls.length;
      text.drawThreeRowsBlock(
        ctxArg,
        family,
        x,
        y,
        w,
        h,
        caption,
        valueText,
        unitText,
        secScale,
        align,
        sizes,
        valueWeight,
        labelWeight
      );
      // @ts-ignore -- pre-existing untyped test mock boundary
      const scaled = ctxArg.calls.slice(start).some((entry) => entry.name === "scale" && Number(entry.args[0]) < 1);
      // @ts-ignore -- pre-existing untyped test mock boundary
      captures.threeRows.push({
        w,
        caption,
        valueText,
        unitText,
        sizes,
        scaled
      });
    }
  };
  // @ts-ignore -- pre-existing untyped test mock boundary
  harness.captures = captures;
  // @ts-ignore -- pre-existing untyped test mock boundary
  harness.realText = text;
  return harness;
}

const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

module.exports = {
  createComponentContextMock,
  createHarness,
  createRadialTextApi,
  createRealTextHarness,
  createScriptContext,
  hasOwn,
  loadFresh,
  makeDualDisplay,
  makeSingleDisplay,
  runIifeScript
};
