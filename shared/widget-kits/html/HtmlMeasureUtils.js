/**
 * @file HtmlMeasureUtils - Canonical HTML text-measurement helpers for fit modules
 * Documentation: documentation/conventions/shared-helpers.md
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

  /** @type {DyniValueMathApi["toText"]} */
  let toText;

  /** @param {unknown} fontString @returns {number} */
  function parseFontPx(fontString) {
    const source = String(fontString || "");
    const match = source.match(/(\d+(?:\.\d+)?)px/);
    return match ? Number(match[1]) : 12;
  }

  /** @returns {DyniTextMeasureContext} */
  function createApproximateMeasureContext() {
    return {
      font: "700 12px sans-serif",
      measureText: /** @this {{ font: string }} @param {unknown} text @returns {{ width: number }} */ function (text) {
        const px = Math.max(1, parseFontPx(this.font));
        return { width: toText(text).length * px * APPROX_CHAR_WIDTH_RATIO };
      }
    };
  }

  /** @param {unknown} targetEl @returns {Document | null} */
  function resolveOwnerDocument(targetEl) {
    const el = /** @type {{ ownerDocument?: Document } | null | undefined} */ (targetEl);
    if (el && el.ownerDocument) {
      return el.ownerDocument;
    }
    if (typeof document !== "undefined") {
      return document;
    }
    return null;
  }

  /**
   * @param {unknown} hostContext
   * @param {unknown} targetElOrOwnerDocument
   * @returns {CanvasRenderingContext2D | null}
   */
  function resolveMeasureContext(hostContext, targetElOrOwnerDocument) {
    const ctxStore = hostContext && typeof hostContext === "object"
      ? /** @type {Record<string, unknown>} */ (hostContext)
      : null;
    const cached = ctxStore
      ? /** @type {CanvasRenderingContext2D | null} */ (ctxStore[MEASURE_CTX_KEY])
      : null;
    if (cached) {
      return cached;
    }

    const ownerDocument = targetElOrOwnerDocument
      && typeof /** @type {{ createElement?: unknown }} */ (targetElOrOwnerDocument).createElement === "function"
      ? /** @type {Document} */ (targetElOrOwnerDocument)
      : resolveOwnerDocument(targetElOrOwnerDocument);
    const probe = ownerDocument && typeof ownerDocument.createElement === "function"
      ? ownerDocument.createElement("canvas")
      : null;
    const context2d = probe && typeof probe.getContext === "function"
      ? probe.getContext("2d")
      : null;
    const resolved = context2d || /** @type {CanvasRenderingContext2D} */ (createApproximateMeasureContext());
    if (ctxStore) {
      ctxStore[MEASURE_CTX_KEY] = resolved;
    }
    return resolved;
  }

  /** @param {unknown} px @param {DyniHtmlWidgetUtilsApi} htmlUtils @returns {string} */
  function toStyle(px, htmlUtils) {
    const n = /** @type {number} */ (htmlUtils.toFiniteNumber(px));
    if (!(n > 0)) {
      return "";
    }
    return "font-size:" + Math.max(1, Math.floor(n)) + "px;";
  }

  /**
   * @param {unknown} args
   * @param {DyniHtmlWidgetUtilsApi} htmlUtils
   * @param {DyniTextTileLayoutApi} tileLayout
   * @returns {DyniHtmlMeasureResult | 0 | null}
   */
  function measurePx(args, htmlUtils, tileLayout) {
    const cfg = /** @type {Record<string, unknown>} */ (args || {});
    const rect = /** @type {DyniRect | undefined} */ (cfg.rect);
    if (!rect || !(rect.w > 0) || !(rect.h > 0) || !cfg.text) {
      return 0;
    }
    const explicitMaxPx = /** @type {number} */ (htmlUtils.toFiniteNumber(cfg.maxPx));
    const maxPxRatio = /** @type {number} */ (htmlUtils.toFiniteNumber(cfg.maxPxRatio));
    const requestedMaxPx = explicitMaxPx > 0
      ? explicitMaxPx
      : Math.max(1, Math.floor(rect.h * (maxPxRatio > 0 ? maxPxRatio : 1)));
    const fit = /** @type {{ px: number, text: string } | null} */ (tileLayout.measureFittedLine({
      textApi: cfg.textApi,
      ctx: cfg.ctx,
      text: cfg.text,
      maxW: Math.max(1, Math.floor(rect.w)),
      maxH: Math.max(1, Math.floor(rect.h)),
      maxPx: Math.max(1, Math.floor(requestedMaxPx)),
      textFillScale: cfg.textFillScale,
      family: cfg.family,
      weight: cfg.weight
    }));
    if (!fit) {
      return null;
    }
    /** @type {DyniCanvasTextFittingApi} */ (cfg.textApi).setFont(
      /** @type {CanvasRenderingContext2D} */ (cfg.ctx),
      fit.px,
      cfg.weight,
      cfg.family
    );
    return {
      px: fit.px,
      text: fit.text,
      width: /** @type {CanvasRenderingContext2D} */ (cfg.ctx).measureText(toText(cfg.text)).width
    };
  }

  /**
   * @param {unknown} args
   * @param {DyniHtmlWidgetUtilsApi} htmlUtils
   * @param {DyniTextTileLayoutApi} tileLayout
   * @returns {string}
   */
  function measureStyle(args, htmlUtils, tileLayout) {
    return toStyle(
      /** @type {{ px?: unknown }} */ (measurePx(args, htmlUtils, tileLayout) || {}).px,
      htmlUtils
    );
  }

  /** @param {unknown} hostContext @param {unknown} cacheKey @returns {DyniHtmlFitCache | null} */
  function resolveFitCache(hostContext, cacheKey) {
    const ctx = hostContext && typeof hostContext === "object"
      ? /** @type {Record<string, unknown>} */ (hostContext)
      : null;
    const key = typeof cacheKey === "string" && cacheKey ? cacheKey : "";
    if (!ctx || !key) {
      return null;
    }
    const existing = ctx[key];
    if (existing && typeof existing === "object") {
      return /** @type {DyniHtmlFitCache} */ (existing);
    }
    const cache = { signature: "", result: null };
    ctx[key] = cache;
    return cache;
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniHtmlMeasureUtilsApi}
   */
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
