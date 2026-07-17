/**
 * @file StateScreenCanvasOverlay - Shared canvas label primitive for semantic state-screens
 * Documentation: documentation/shared/state-screens.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniStateScreenCanvasOverlay = factory();
  }
}(this, function () {
  "use strict";

  /** @returns {boolean} */
  function isDevMode() {
    return !!(
      typeof process !== "undefined" &&
      process &&
      process.env &&
      process.env.NODE_ENV !== "production"
    );
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniStateScreenCanvasOverlayApi}
   */
  function create(def, componentContext) {
    const labels = componentContext.components.require("StateScreenLabels");
    const fitting = componentContext.components.require("CanvasTextFitting");
    const setFont = fitting.setFont;

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} labelText
     * @param {number} W
     * @param {number} H
     * @param {unknown} weight
     * @param {unknown} family
     * @returns {number}
     */
    function resolveFontPx(ctx, labelText, W, H, weight, family) {
      const maxWidth = Math.max(1, Math.floor(W * 0.8));
      const maxHeight = Math.max(1, Math.floor(Math.min(W, H) * 0.8));
      let px = maxHeight;
      let measuredWidth;

      setFont(ctx, px, weight, family);
      measuredWidth = Number(ctx.measureText(labelText).width) || 0;

      if (measuredWidth > maxWidth) {
        px = Math.max(1, Math.floor(px * (maxWidth / measuredWidth)));
      }

      return px;
    }

    /** @param {unknown} args @returns {void} */
    function drawStateScreen(args) {
      const cfg = /** @type {DyniStateScreenDrawArgs} */ (args || {});
      const kind = cfg.kind;
      const ctx = cfg.ctx;

      if (!ctx) {
        return;
      }

      if (kind === labels.KINDS.HIDDEN || kind === labels.KINDS.DATA) {
        if (isDevMode()) {
          throw new Error("StateScreenCanvasOverlay.drawStateScreen: kind '" + String(kind) + "' is invalid on canvas");
        }
        return;
      }

      const W = Math.max(1, Math.floor(Number(cfg.W) || 1));
      const H = Math.max(1, Math.floor(Number(cfg.H) || 1));
      const color = typeof cfg.color === "string" && cfg.color
        ? cfg.color
        : (typeof ctx.fillStyle === "string" && ctx.fillStyle ? ctx.fillStyle : "");
      const labelText = typeof cfg.label === "string"
        ? cfg.label
        : (labels.LABELS[/** @type {string} */ (kind)] || "");
      const px = resolveFontPx(ctx, labelText, W, H, cfg.labelWeight, cfg.family);

      ctx.save();
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      setFont(ctx, px, cfg.labelWeight, cfg.family);
      ctx.fillText(labelText, Math.floor(W / 2), Math.floor(H / 2));
      ctx.restore();
    }

    return {
      id: "StateScreenCanvasOverlay",
      drawStateScreen: drawStateScreen,
      setFont: setFont
    };
  }

  return {
    id: "StateScreenCanvasOverlay",
    create: create
  };
}));
