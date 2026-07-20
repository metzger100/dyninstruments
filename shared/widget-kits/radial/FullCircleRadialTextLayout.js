/**
 * @file FullCircleRadialTextLayout - Shared text layout helpers for full-circle dial widgets
 * Documentation: documentation/radial/full-circle-dial-engine.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniFullCircleRadialTextLayout = factory();
  }
})(this, function () {
  "use strict";

  const hasOwn = Object.prototype.hasOwnProperty;

  /** @param {unknown} def @param {DyniComponentContext} componentContext */ function create(def, componentContext) {
    const drawing = /** @type {DyniFullCircleRadialDrawingApi} */ (
      componentContext.components.require("FullCircleRadialDrawing")
    );
    const drawSingleFlat = drawing.drawSingleFlat;
    const drawSingleHigh = drawing.drawSingleHigh;
    const drawSingleNormal = drawing.drawSingleNormal;
    const drawDualNormal = drawing.drawDualNormal;
    /** @param {DyniFullCircleRenderState} state @param {string} mode @param {DyniFullCircleDisplay} display @param {DyniFullCircleModeOptions | undefined} opts */ function drawSingleModeText(
      state,
      mode,
      display,
      opts
    ) {
      if (mode === "flat") {
        drawSingleFlat(state, display, opts);
        return;
      }
      if (mode === "high") {
        drawSingleHigh(state, display, opts);
        return;
      }
      drawSingleNormal(state, display);
    }

    /** @param {DyniFullCircleRenderState} state @param {string} mode @param {DyniFullCircleDisplay} left @param {DyniFullCircleDisplay} right @param {DyniFullCircleModeOptions | undefined} opts */ function drawDualModeText(
      state,
      mode,
      left,
      right,
      opts
    ) {
      if (mode === "flat") {
        drawSingleFlat(state, left, {
          side: "left",
          align: opts && hasOwn.call(opts, "leftAlign") ? opts.leftAlign : "left"
        });
        drawSingleFlat(state, right, {
          side: "right",
          align: opts && hasOwn.call(opts, "rightAlign") ? opts.rightAlign : "right"
        });
        return;
      }
      if (mode === "high") {
        drawSingleHigh(state, left, { slot: "top" });
        drawSingleHigh(state, right, { slot: "bottom" });
        return;
      }
      drawDualNormal(state, left, right);
    }

    return {
      id: "FullCircleRadialTextLayout",
      drawSingleModeText: drawSingleModeText,
      drawDualModeText: drawDualModeText
    };
  }

  return { id: "FullCircleRadialTextLayout", create: create };
});
