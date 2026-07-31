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

/**
 * @typedef {{ caption: string, secScale: number, unit: string, value: string }} Display
 * @typedef {{ gap: number, uPx: number, vPx: number }} ValueUnitFit
 * @typedef {{ cPx: number, g1: number, g2: number, total: number, uPx: number, vPx: number }} InlineFit
 * @typedef {{ geom?: Record<string, number>, layout?: Record<string, unknown>, slots?: Record<string, unknown>, textFillScale?: number, theme?: Record<string, unknown> }} HarnessOverrides
 */

/** @param {HarnessOverrides} [overrides] */
function createHarness(overrides) {
  const cfg = overrides || {};
  const calls =
    /** @type {{ inline: Array<{ caption: string, fit: InlineFit, h: number, unitText: string, valueText: string, w: number, x: number, y: number }>, threeRows: Array<{ align: string, caption: string, h: number, secScale: number, sizes: unknown, unit: string, value: string, w: number, x: number, y: number }>, valueUnit: Array<{ align: string, fit: ValueUnitFit, h: number, unitText: string, valueText: string, w: number, x: number, y: number }> }} */ ({
      threeRows: [],
      valueUnit: [],
      inline: []
    });
  const state =
    /** @type {{ H: number, W: number, ctx: object, family: string, geom: { R: number, cx: number, cy: number, rOuter: number }, labelWeight: number, layout: { normal: { compactCenterHeight: number, dualCompactHeight: number, dualCompactInset: number, dualCompactWidth: number, safeRadius: number }, contentRect: { h: number, w: number, x: number, y: number } }, pad: number, slots: object, text: Record<string, unknown> & { fitTextPx: (...args: unknown[]) => number }, textFillScale: number, theme: object, valueWeight: number }} */ ({
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
        /** @param {unknown} ctx @param {string} family @param {string} valueText @param {string} unitText @param {number} maxW @param {number} maxH @returns {ValueUnitFit} */
        measureValueUnitFit(ctx, family, valueText, unitText, maxW, maxH) {
          return {
            vPx: Math.max(1, Math.floor(maxH * 0.7)),
            uPx: Math.max(1, Math.floor(maxH * 0.45)),
            gap: 4
          };
        },
        /** @param {unknown} ctx @param {string} family @param {number} x @param {number} y @param {number} w @param {number} h @param {string} valueText @param {string} unitText @param {ValueUnitFit} fit @param {string} align */
        drawValueUnitWithFit(ctx, family, x, y, w, h, valueText, unitText, fit, align) {
          calls.valueUnit.push({ x, y, w, h, valueText, unitText, fit, align });
        },
        /** @param {unknown} ctx @param {string} text @param {number} maxW @param {number} maxH */
        fitTextPx(ctx, text, maxW, maxH) {
          const len = Math.max(1, String(text || "").length);
          return Math.max(1, Math.min(Math.floor(maxW / len), Math.max(1, Math.floor(maxH * 0.8))));
        },
        /** @param {unknown} ctx @param {string} family @param {number} x @param {number} y @param {number} w @param {number} h @param {string} caption @param {string} value @param {string} unit @param {number} secScale @param {string} align @param {unknown} sizes */
        drawThreeRowsBlock(ctx, family, x, y, w, h, caption, value, unit, secScale, align, sizes) {
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
        /** @param {unknown} ctx @param {string} family @param {string} caption @param {string} valueText @param {string} unitText @param {number} maxW @param {number} maxH @returns {InlineFit} */
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
        /** @param {unknown} ctx @param {string} family @param {number} x @param {number} y @param {number} w @param {number} h @param {string} caption @param {string} valueText @param {string} unitText @param {InlineFit} fit */
        drawInlineCapValUnit(ctx, family, x, y, w, h, caption, valueText, unitText, fit) {
          calls.inline.push({ x, y, w, h, caption, valueText, unitText, fit });
        }
      }
    });

  return { state, calls };
}

/** @param {object | undefined} source @param {PropertyKey} key */
function hasOwn(source, key) {
  return Object.prototype.hasOwnProperty.call(source || {}, key);
}

/** @param {Partial<Display>} [overrides] @returns {Display} */
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

/** @param {HarnessOverrides} [overrides] */
function createRealTextHarness(overrides) {
  const text = createRadialTextApi();
  const captures = {
    valueUnit:
      /** @type {Array<{ fit: unknown, scaled: boolean, unitText: string, valueText: string, w: number }>} */ ([]),
    threeRows:
      /** @type {Array<{ caption: string, scaled: boolean, sizes: unknown, unitText: string, valueText: string, w: number }>} */ ([])
  };
  const ctx = {
    calls: /** @type {DyniTestCall[]} */ ([]),
    textAlign: "left",
    textBaseline: "alphabetic",
    font: "10px sans-serif",
    save() {
      this.calls.push({ name: "save", args: [] });
    },
    restore() {
      this.calls.push({ name: "restore", args: [] });
    },
    translate() {
      this.calls.push({ name: "translate", args: Array.from(arguments) });
    },
    scale() {
      this.calls.push({ name: "scale", args: Array.from(arguments) });
    },
    fillText() {
      this.calls.push({ name: "fillText", args: Array.from(arguments) });
    },
    /** @param {string} label */
    measureText(label) {
      this.calls.push({ name: "measureText", args: Array.from(arguments) });
      const match = String(this.font || "").match(/([0-9]+(?:\.[0-9]+)?)px/);
      const px = match ? Number(match[1]) : 10;
      return { width: String(label || "").length * px * 0.62 };
    }
  };
  const harness = createHarness(overrides);
  harness.state.ctx = ctx;
  harness.state.text = {
    setFont: text.setFont,
    fitTextPx: text.fitTextPx,
    fitSingleTextPx: text.fitSingleTextPx,
    measureValueUnitFit: text.measureValueUnitFit,
    fitInlineCapValUnit: text.fitInlineCapValUnit,
    drawCaptionMax: text.drawCaptionMax,
    drawInlineCapValUnit: text.drawInlineCapValUnit,
    drawDisconnectOverlay: text.drawDisconnectOverlay,
    /** @param {DyniTestCanvasContext} ctxArg @param {string} family @param {number} x @param {number} y @param {number} w @param {number} h @param {string} valueText @param {string} unitText @param {unknown} fit @param {string} align @param {number} valueWeight @param {number} labelWeight */
    drawValueUnitWithFit(ctxArg, family, x, y, w, h, valueText, unitText, fit, align, valueWeight, labelWeight) {
      const start = ctxArg.calls.length;
      text.drawValueUnitWithFit(ctxArg, family, x, y, w, h, valueText, unitText, fit, align, valueWeight, labelWeight);
      const scaled = ctxArg.calls.slice(start).some((entry) => entry.name === "scale" && Number(entry.args[0]) < 1);
      captures.valueUnit.push({ w, valueText, unitText, fit, scaled });
    },
    /** @param {DyniTestCanvasContext} ctxArg @param {string} family @param {number} x @param {number} y @param {number} w @param {number} h @param {string} caption @param {string} valueText @param {string} unitText @param {number} secScale @param {string} align @param {unknown} sizes @param {number} valueWeight @param {number} labelWeight */
    drawThreeRowsBlock(
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
      const scaled = ctxArg.calls
        .slice(start)
        .some(/** @param {DyniTestCall} entry */ (entry) => entry.name === "scale" && Number(entry.args[0]) < 1);
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
  return { ...harness, captures, realText: text };
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
