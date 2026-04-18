/**
 * Module: StateScreenCanvasOverlay - Shared canvas dim-and-label primitive for semantic state-screens
 * Documentation: documentation/shared/state-screens.md
 * Depends: StateScreenLabels
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniStateScreenCanvasOverlay = factory(); }
}(this, function () {
  "use strict";

  function setFont(ctx, px, weight, family) {
    const fontPx = Math.max(1, Math.floor(Number(px) || 1));
    const fontWeight = weight == null ? 700 : weight;
    const fontFamily = family || "sans-serif";
    ctx.font = String(fontWeight) + " " + String(fontPx) + "px " + String(fontFamily);
  }

  function isDevMode() {
    return !!(
      typeof process !== "undefined" &&
      process &&
      process.env &&
      process.env.NODE_ENV !== "production"
    );
  }

  function create(def, Helpers) {
    const labels = Helpers.getModule("StateScreenLabels").create(def, Helpers);

    function drawStateScreen(args) {
      const cfg = args || {};
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
      const labelText = typeof cfg.label === "string" ? cfg.label : (labels.LABELS[kind] || "");
      const px = Math.max(12, Math.floor(Math.min(W, H) * 0.18));

      ctx.save();
      ctx.globalAlpha = 0.20;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
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
