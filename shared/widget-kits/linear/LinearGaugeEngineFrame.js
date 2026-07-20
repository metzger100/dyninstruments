/**
 * @file LinearGaugeEngineFrame - Shared per-frame draw dispatch for the linear gauge engine
 * Documentation: documentation/linear/linear-shared-api.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniLinearGaugeEngineFrame = factory();
  }
})(this, function () {
  "use strict";

  /**
   * Draws the engine's default (non-custom) mode-specific caption/value/unit rows.
   * @param {DyniLinearGaugeDrawingState} state @param {DyniLinearGaugeEngineFrameParams} deps
   * @returns {void}
   */
  function drawDefaultModeText(state, deps) {
    const text = deps.text;
    const textLayout = deps.textLayout;
    const displayState = deps.displayState;
    const valueText = deps.valueText;
    const unit = deps.unit;
    const rowBoxes = deps.rowBoxes;
    const secScale = deps.secScale;
    if (state.mode === "high") {
      textLayout.drawCaptionRow(state, text, displayState.caption, rowBoxes.captionBox, secScale, "center");
      textLayout.drawValueUnitRow(state, text, valueText, unit, rowBoxes.valueBox, secScale, "center");
    } else if (state.mode === "normal") {
      textLayout.drawInlineRow(state, text, displayState.caption, valueText, unit, state.layout.inlineBox, secScale);
    } else {
      textLayout.drawCaptionRow(state, text, displayState.caption, rowBoxes.captionBox, secScale, "right");
      textLayout.drawValueUnitRow(state, text, valueText, unit, rowBoxes.valueBox, secScale, "right");
    }
  }

  /** @returns {DyniLinearGaugeEngineFrameApi} */
  function create() {
    /**
     * Assembles the per-frame draw API, dispatches the widget's custom frame/mode
     * renderers (or the engine's default pointer + text-row rendering), blits the
     * front layer, and reports whether another animation frame is needed.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {DyniLinearGaugeDrawingState} state
     * @param {HTMLCanvasElement} canvasElement
     * @param {DyniLinearGaugeEngineFrameParams} deps
     * @returns {DyniLinearRenderResult}
     */
    function renderFrame(ctx, state, canvasElement, deps) {
      const layout = deps.layout;
      const theme = deps.theme;
      const primitives = deps.primitives;
      const drawing = deps.drawing;
      const easedDisplayNum = deps.easedDisplayNum;
      const pointerDepthBase = deps.pointerDepthBase;
      const markerSizeBase = deps.markerSizeBase;
      const cfg = deps.cfg;
      const p = deps.p;
      const displayState = deps.displayState;
      const hookApi = deps.hookApi;
      const text = deps.text;
      const textLayout = deps.textLayout;
      const valueText = deps.valueText;
      const unit = deps.unit;
      const rowBoxes = deps.rowBoxes;
      const secScale = deps.secScale;
      const layerCache = deps.layerCache;
      const springMotion = deps.springMotion;

      const drawApi = {
        drawDefaultPointer: /** @param {DyniLinearDrawOptions} [opts] */ function (opts) {
          drawing.drawPointerAtValue(
            ctx,
            state,
            layout,
            theme,
            primitives,
            state.mapValueToX,
            easedDisplayNum,
            pointerDepthBase,
            markerSizeBase,
            opts
          );
        },
        drawPointerAtValue: /** @param {unknown} valueNum @param {DyniLinearDrawOptions} [opts] */ function (
          valueNum,
          opts
        ) {
          drawing.drawPointerAtValue(
            ctx,
            state,
            layout,
            theme,
            primitives,
            state.mapValueToX,
            valueNum,
            pointerDepthBase,
            markerSizeBase,
            opts
          );
        },
        drawMarkerAtValue: /** @param {unknown} valueNum @param {DyniLinearDrawOptions} [opts] */ function (
          valueNum,
          opts
        ) {
          drawing.drawMarkerAtValue(
            ctx,
            state,
            layout,
            theme,
            primitives,
            state.mapValueToX,
            valueNum,
            markerSizeBase,
            opts
          );
        }
      };
      let drawResult = null;
      if (typeof cfg.drawFrame === "function")
        drawResult = cfg.drawFrame(
          state,
          p,
          /** @type {DyniLinearRichDisplay} */ (/** @type {unknown} */ (displayState)),
          Object.assign({}, hookApi, drawApi)
        );
      else drawApi.drawDefaultPointer();

      layerCache.blitLayer(ctx, "front");

      const modeKey = /** @type {"flat" | "normal" | "high"} */ (state.mode);
      const modeRenderer = cfg.drawMode && cfg.drawMode[modeKey];
      let modeResult = null;
      if (typeof modeRenderer === "function") {
        modeResult = modeRenderer(
          state,
          p,
          /** @type {DyniLinearRichDisplay} */ (/** @type {unknown} */ (displayState)),
          Object.assign({}, hookApi, drawApi)
        );
      } else {
        drawDefaultModeText(state, deps);
      }

      if (
        (drawResult && drawResult.wantsFollowUpFrame === true) ||
        (modeResult && modeResult.wantsFollowUpFrame === true) ||
        springMotion.isActive(canvasElement)
      ) {
        return { wantsFollowUpFrame: true };
      }
    }

    return { id: "LinearGaugeEngineFrame", renderFrame: renderFrame };
  }

  return { id: "LinearGaugeEngineFrame", create: create };
});
