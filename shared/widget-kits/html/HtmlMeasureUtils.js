/**
 * Module: HtmlMeasureUtils - Canonical HTML text-measurement helpers for fit modules
 * Documentation: documentation/conventions/shared-helpers.md
 * Depends: ValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniHtmlMeasureUtils = factory();
  }
}(this, function () {
  "use strict";

  const APPROX_CHAR_WIDTH_RATIO = 0.56;
  const MEASURE_CTX_KEY = "__dyniHtmlMeasureUtilsCtx";

  let toText;

  function parseFontPx(fontString) {
    const source = String(fontString || "");
    const match = source.match(/(\d+(?:\.\d+)?)px/);
    return match ? Number(match[1]) : 12;
  }

  function createApproximateMeasureContext() {
    return {
      font: "700 12px sans-serif",
      measureText: function (text) {
        const px = Math.max(1, parseFontPx(this.font));
        return { width: toText(text).length * px * APPROX_CHAR_WIDTH_RATIO };
      }
    };
  }

  function resolveOwnerDocument(targetEl) {
    if (targetEl && targetEl.ownerDocument) {
      return targetEl.ownerDocument;
    }
    if (typeof document !== "undefined") {
      return document;
    }
    return null;
  }

  function resolveMeasureContext(hostContext, targetElOrOwnerDocument) {
    const ctxStore = hostContext && typeof hostContext === "object" ? hostContext : null;
    const cached = ctxStore ? ctxStore[MEASURE_CTX_KEY] : null;
    if (cached) {
      return cached;
    }

    const ownerDocument = targetElOrOwnerDocument && typeof targetElOrOwnerDocument.createElement === "function"
      ? targetElOrOwnerDocument
      : resolveOwnerDocument(targetElOrOwnerDocument);
    const probe = ownerDocument && typeof ownerDocument.createElement === "function"
      ? ownerDocument.createElement("canvas")
      : null;
    const context2d = probe && typeof probe.getContext === "function"
      ? probe.getContext("2d")
      : null;
    const resolved = context2d || createApproximateMeasureContext();
    if (ctxStore) {
      ctxStore[MEASURE_CTX_KEY] = resolved;
    }
    return resolved;
  }

  function toStyle(px, htmlUtils) {
    const n = htmlUtils.toFiniteNumber(px);
    if (!(n > 0)) {
      return "";
    }
    return "font-size:" + Math.max(1, Math.floor(n)) + "px;";
  }

  function measurePx(args, htmlUtils, tileLayout) {
    const cfg = args || {};
    const rect = cfg.rect;
    if (!rect || !(rect.w > 0) || !(rect.h > 0) || !cfg.text) {
      return 0;
    }
    const explicitMaxPx = htmlUtils.toFiniteNumber(cfg.maxPx);
    const maxPxRatio = htmlUtils.toFiniteNumber(cfg.maxPxRatio);
    const requestedMaxPx = explicitMaxPx > 0
      ? explicitMaxPx
      : Math.max(1, Math.floor(rect.h * (maxPxRatio > 0 ? maxPxRatio : 1)));
    const fit = tileLayout.measureFittedLine({
      textApi: cfg.textApi,
      ctx: cfg.ctx,
      text: cfg.text,
      maxW: Math.max(1, Math.floor(rect.w)),
      maxH: Math.max(1, Math.floor(rect.h)),
      maxPx: Math.max(1, Math.floor(requestedMaxPx)),
      textFillScale: cfg.textFillScale,
      family: cfg.family,
      weight: cfg.weight
    });
    if (!fit) {
      return null;
    }
    cfg.textApi.setFont(cfg.ctx, fit.px, cfg.weight, cfg.family);
    return {
      px: fit.px,
      text: fit.text,
      width: cfg.ctx.measureText(toText(cfg.text)).width
    };
  }

  function measureStyle(args, htmlUtils, tileLayout) {
    return toStyle((measurePx(args, htmlUtils, tileLayout) || {}).px, htmlUtils);
  }

  function resolveFitCache(hostContext, cacheKey) {
    const ctx = hostContext && typeof hostContext === "object" ? hostContext : null;
    const key = typeof cacheKey === "string" && cacheKey ? cacheKey : "";
    if (!ctx || !key) {
      return null;
    }
    const existing = ctx[key];
    if (existing && typeof existing === "object") {
      return existing;
    }
    const cache = { signature: "", result: null };
    ctx[key] = cache;
    return cache;
  }

  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");
    toText = valueMath.toText;

    return {
      id: "HtmlMeasureUtils",
      APPROX_CHAR_WIDTH_RATIO: APPROX_CHAR_WIDTH_RATIO,
      parseFontPx: parseFontPx,
      createApproximateMeasureContext: createApproximateMeasureContext,
      resolveMeasureContext: resolveMeasureContext,
      measurePx: measurePx,
      measureStyle: measureStyle,
      toStyle: toStyle,
      resolveOwnerDocument: resolveOwnerDocument,
      resolveFitCache: resolveFitCache
    };
  }

  return {
    id: "HtmlMeasureUtils",
    create: create
  };
}));
