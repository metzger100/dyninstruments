/**
 * Module: StateScreenTextFit - Shared measured single-line fit helper for state-screen labels
 * Documentation: documentation/shared/state-screens.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniStateScreenTextFit = factory(); }
}(this, function () {
  "use strict";

  const MIN_FONT_PX = 0.5;
  const DEFAULT_FAMILY = "sans-serif";
  const DEFAULT_WEIGHT = 700;
  const WIDTH_EPSILON = 0.01;
  const MEASURE_CTX_KEY = "__dyniStateScreenTextFitCtx";

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function clampPositive(value, fallback) {
    const n = toFiniteNumber(value);
    return n > 0 ? n : fallback;
  }

  function parseFontPx(fontValue) {
    const source = String(fontValue || "");
    const match = source.match(/(\d+(?:\.\d+)?)px/);
    return match ? Number(match[1]) : 0;
  }

  function createApproximateMeasureContext() {
    return {
      font: "700 12px sans-serif",
      measureText: function (text) {
        const px = Math.max(1, parseFontPx(this.font) || 12);
        return { width: String(text || "").length * px * 0.56 };
      }
    };
  }

  function tryCreateCanvasContext(ownerDocument) {
    if (!ownerDocument || typeof ownerDocument.createElement !== "function") {
      return null;
    }
    const ownerView = ownerDocument.defaultView;
    const userAgent = ownerView && ownerView.navigator ? String(ownerView.navigator.userAgent || "") : "";
    if (/jsdom/i.test(userAgent)) {
      return null;
    }
    const canvas = ownerDocument.createElement("canvas");
    if (!canvas || typeof canvas.getContext !== "function") {
      return null;
    }
    return canvas.getContext("2d");
  }

  function resolveOwnerDocument(args) {
    const cfg = args || {};
    if (cfg.ownerDocument) {
      return cfg.ownerDocument;
    }
    if (cfg.targetEl && cfg.targetEl.ownerDocument) {
      return cfg.targetEl.ownerDocument;
    }
    if (typeof document !== "undefined") {
      return document;
    }
    return null;
  }

  function resolveMeasureContext(args) {
    const cfg = args || {};
    if (cfg.measureCtx && typeof cfg.measureCtx.measureText === "function") {
      return cfg.measureCtx;
    }

    const hostContext = cfg.hostContext && typeof cfg.hostContext === "object"
      ? cfg.hostContext
      : null;
    if (hostContext && hostContext[MEASURE_CTX_KEY]) {
      return hostContext[MEASURE_CTX_KEY];
    }

    const ownerDocument = resolveOwnerDocument(cfg);
    const readyContext = tryCreateCanvasContext(ownerDocument) || createApproximateMeasureContext();
    if (hostContext) {
      hostContext[MEASURE_CTX_KEY] = readyContext;
    }
    return readyContext;
  }

  function setFont(ctx, px, weight, family) {
    const fontPx = Math.max(MIN_FONT_PX, clampPositive(px, MIN_FONT_PX));
    const fontWeight = clampPositive(weight, DEFAULT_WEIGHT);
    ctx.font = Math.floor(fontWeight) + " " + fontPx + "px " + (family || DEFAULT_FAMILY);
  }

  function measureTextWidth(ctx, text) {
    return ctx.measureText(String(text || "")).width;
  }

  function fitSingleTextPx(ctx, text, basePx, maxW, maxH, family, weight) {
    const ceilingPx = Math.min(clampPositive(basePx, MIN_FONT_PX), clampPositive(maxH, MIN_FONT_PX));
    const widthLimit = Math.max(0, Number(maxW) || 0);
    const content = String(text || "");
    if (!content) {
      return 0;
    }
    if (widthLimit <= 0) {
      return MIN_FONT_PX;
    }

    setFont(ctx, ceilingPx, weight, family);
    const measuredWidth = measureTextWidth(ctx, content);
    if (measuredWidth <= widthLimit + WIDTH_EPSILON) {
      return ceilingPx;
    }

    const ratio = Math.max(0.01, widthLimit / Math.max(WIDTH_EPSILON, measuredWidth));
    return Math.min(ceilingPx, Math.max(MIN_FONT_PX, ceilingPx * ratio));
  }

  function toFontStyle(px) {
    const resolved = toFiniteNumber(px);
    if (!(resolved > 0)) {
      return "";
    }
    return "font-size:" + Math.max(1, Math.floor(resolved)) + "px;";
  }

  function create() {
    function compute(args) {
      const cfg = args || {};
      const label = typeof cfg.label === "string" ? cfg.label.trim() : "";
      const rect = cfg.shellRect || cfg.availableRect || null;
      const width = toFiniteNumber(rect && rect.width);
      const height = toFiniteNumber(rect && rect.height);
      if (!label || !(width > 0) || !(height > 0)) {
        return "";
      }

      const maxW = Math.floor(width * 0.8);
      const maxH = Math.floor(height * 0.8);
      if (!(maxW > 0) || !(maxH > 0)) {
        return "";
      }

      const measureCtx = resolveMeasureContext(cfg);
      if (!measureCtx || typeof measureCtx.measureText !== "function") {
        return "";
      }

      const textApi = cfg.textApi && typeof cfg.textApi.fitSingleTextPx === "function"
        ? cfg.textApi
        : { fitSingleTextPx: fitSingleTextPx };
      const family = String(cfg.family || DEFAULT_FAMILY);
      const weight = clampPositive(cfg.weight, DEFAULT_WEIGHT);
      const fittedPx = textApi.fitSingleTextPx(
        measureCtx,
        label,
        maxH,
        maxW,
        maxH,
        family,
        weight
      );

      return toFontStyle(fittedPx);
    }

    return {
      id: "StateScreenTextFit",
      compute: compute
    };
  }

  return {
    id: "StateScreenTextFit",
    create: create
  };
}));
