/**
 * Module: MapZoomHtmlFit - Per-element text fitting for map zoom HTML renderer
 * Documentation: documentation/widgets/map-zoom.md
 * Depends: Helpers.resolveFontFamily, TextLayoutEngine
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniMapZoomHtmlFit = factory(); }
}(this, function () {
  "use strict";

  const MEASURE_CTX_KEY = "__dyniMapZoomMeasureCtx";
  const EMPTY_STYLES = Object.freeze({
    captionStyle: "",
    valueStyle: "",
    unitStyle: "",
    requiredStyle: ""
  });
  const VALUE_WEIGHT = 700;
  const LABEL_WEIGHT = 700;
  const SECONDARY_DEFAULT_SCALE = 0.8;

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function numberOr(value, defaultNumber) {
    return typeof value === "number" ? value : defaultNumber;
  }

  function resolveShellRect(hostContext) {
    const commit = hostContext && hostContext.__dyniHostCommitState;
    const target = commit && (commit.shellEl || commit.rootEl);
    if (!target || typeof target.getBoundingClientRect !== "function") {
      return null;
    }
    const rect = target.getBoundingClientRect();
    const width = toFiniteNumber(rect && rect.width);
    const height = toFiniteNumber(rect && rect.height);
    if (!(width > 0) || !(height > 0)) {
      return null;
    }
    return { width: width, height: height };
  }

  function buildApproximateMeasureContext() {
    const context = {
      font: "700 12px sans-serif",
      approxFontPx: 12,
      measureText: function (text) {
        const source = String(this.font || "");
        const match = source.match(/(\d+(?:\.\d+)?)px/);
        const parsed = match ? Number(match[1]) : this.approxFontPx;
        const resolvedPx = Number.isFinite(parsed) ? parsed : this.approxFontPx;
        this.approxFontPx = Math.max(1, resolvedPx);
        return { width: String(text).length * this.approxFontPx * 0.58 };
      }
    };
    return context;
  }

  function getMeasureTarget(hostContext) {
    const commit = hostContext && hostContext.__dyniHostCommitState;
    return commit && (commit.shellEl || commit.rootEl);
  }

  function resolveMeasureContext(hostContext) {
    if (hostContext && hostContext[MEASURE_CTX_KEY]) {
      return hostContext[MEASURE_CTX_KEY];
    }

    const target = getMeasureTarget(hostContext);
    const ownerDocument = target && target.ownerDocument ? target.ownerDocument : (typeof document !== "undefined" ? document : null);
    const ownerView = ownerDocument && ownerDocument.defaultView;
    const userAgent = ownerView && ownerView.navigator ? String(ownerView.navigator.userAgent || "") : "";
    const isJsDom = /jsdom/i.test(userAgent);

    let context2d = null;
    if (!isJsDom && ownerDocument && typeof ownerDocument.createElement === "function") {
      const canvas = ownerDocument.createElement("canvas");
      if (canvas && typeof canvas.getContext === "function") {
        context2d = canvas.getContext("2d");
      }
    }
    const out = context2d || buildApproximateMeasureContext();
    if (hostContext && typeof hostContext === "object") {
      hostContext[MEASURE_CTX_KEY] = out;
    }
    return out;
  }

  function toFontStyle(px) {
    const resolved = toFiniteNumber(px);
    const out = Math.floor(numberOr(resolved, 0));
    return out > 0 ? ("font-size:" + out + "px;") : "";
  }

  function estimateMainUsedHeight(args) {
    const cfg = args || {};
    const fit = cfg.fit;
    if (!fit || typeof fit !== "object") {
      return 0;
    }
    const captionPx = toFiniteNumber(fit.cPx);
    const valuePx = toFiniteNumber(fit.vPx);
    const unitPx = toFiniteNumber(fit.uPx);
    const secondaryPx = toFiniteNumber(fit.sPx);
    const gapValue = toFiniteNumber(cfg.gapPx);
    const gap = Math.max(0, Math.floor(numberOr(gapValue, 0)));
    const captionSafe = numberOr(captionPx, 0);
    const valueSafe = numberOr(valuePx, 0);
    const unitSafe = numberOr(unitPx, 0);
    const secondarySafe = numberOr(secondaryPx, 0);
    if (cfg.mode === "high") {
      return captionSafe + valueSafe + unitSafe
        + (captionSafe > 0 && valueSafe > 0 ? gap : 0)
        + (unitSafe > 0 && valueSafe > 0 ? gap : 0);
    }
    if (cfg.mode === "normal") {
      const topPx = Math.max(valueSafe, unitSafe);
      const bottomPx = captionSafe;
      return topPx + bottomPx + (topPx > 0 && bottomPx > 0 ? gap : 0);
    }
    return Math.max(valueSafe, secondarySafe);
  }

  function hasText(value) {
    return String(value).trim().length > 0;
  }

  function toMainFitState(args) {
    const cfg = args || {};
    const text = cfg.textApi;
    const mode = cfg.mode;
    if (mode === "high") {
      const fitHigh = text.fitThreeRowBlock({
        ctx: cfg.ctx,
        W: cfg.maxW,
        H: cfg.maxH,
        padX: 0,
        innerY: cfg.innerY,
        secScale: cfg.secScale,
        textFillScale: cfg.textFillScale,
        captionText: cfg.captionText,
        valueText: cfg.valueText,
        unitText: cfg.unitText,
        family: cfg.family,
        valueWeight: VALUE_WEIGHT,
        labelWeight: LABEL_WEIGHT
      });
      return {
        captionPx: fitHigh.cPx,
        valuePx: fitHigh.vPx,
        unitPx: fitHigh.uPx,
        modeFit: fitHigh
      };
    }
    if (mode === "normal") {
      const fitNormal = text.fitValueUnitCaptionRows({
        ctx: cfg.ctx,
        W: cfg.maxW,
        H: cfg.maxH,
        padX: 0,
        innerY: cfg.innerY,
        gapBase: cfg.gapPx,
        secScale: cfg.secScale,
        textFillScale: cfg.textFillScale,
        captionText: cfg.captionText,
        valueText: cfg.valueText,
        unitText: cfg.unitText,
        family: cfg.family,
        valueWeight: VALUE_WEIGHT,
        labelWeight: LABEL_WEIGHT
      });
      return {
        captionPx: fitNormal.cPx,
        valuePx: fitNormal.vPx,
        unitPx: fitNormal.uPx,
        modeFit: fitNormal
      };
    }
    const fitFlat = text.fitInlineTriplet({
      ctx: cfg.ctx,
      captionText: cfg.captionText,
      valueText: cfg.valueText,
      unitText: cfg.unitText,
      secScale: cfg.secScale,
      gap: cfg.gapPx,
      maxW: cfg.maxW,
      maxH: cfg.maxH,
      family: cfg.family,
      valueWeight: VALUE_WEIGHT,
      labelWeight: LABEL_WEIGHT
    });
    return {
      captionPx: hasText(cfg.captionText) ? fitFlat.sPx : 0,
      valuePx: fitFlat.vPx,
      unitPx: hasText(cfg.unitText) ? fitFlat.sPx : 0,
      modeFit: fitFlat
    };
  }

  function fitRequiredPx(args) {
    const cfg = args || {};
    if (!hasText(cfg.requiredText)) {
      return { px: 0 };
    }
    const mainUsedH = estimateMainUsedHeight({
      fit: cfg.mainFit,
      mode: cfg.mode,
      gapPx: cfg.gapPx
    });
    const rowGap = mainUsedH > 0 ? cfg.gapPx : 0;
    const remainingH = Math.max(0, cfg.maxH - mainUsedH - rowGap);
    if (!(remainingH > 0)) {
      return { px: 0 };
    }
    const requiredFit = cfg.textApi.fitSingleLineBinary({
      ctx: cfg.ctx,
      text: cfg.requiredText,
      minPx: 1,
      maxPx: Math.max(1, Math.floor(remainingH)),
      maxW: cfg.maxW,
      maxH: Math.max(1, remainingH),
      family: cfg.family,
      weight: LABEL_WEIGHT
    });
    return {
      px: requiredFit.px
    };
  }

  function create(def, Helpers) {
    const textApi = Helpers.getModule("TextLayoutEngine").create(def, Helpers);

    function compute(args) {
      const cfg = args || {};
      const model = cfg.model;
      const hostContext = cfg.hostContext ? cfg.hostContext : null;
      if (!model || typeof model !== "object") {
        return EMPTY_STYLES;
      }
      const rect = cfg.shellRect || resolveShellRect(hostContext);
      if (!rect) {
        return EMPTY_STYLES;
      }

      const measureCtx = resolveMeasureContext(hostContext);
      if (!measureCtx || typeof measureCtx.measureText !== "function") {
        return EMPTY_STYLES;
      }
      const target = getMeasureTarget(hostContext);
      const family = Helpers.resolveFontFamily(target || undefined);
      const shellW = Math.max(1, Math.round(rect.width));
      const shellH = Math.max(1, Math.round(rect.height));
      const responsiveInsets = textApi.computeResponsiveInsets(shellW, shellH);
      const contentW = Math.max(1, shellW - responsiveInsets.padX * 2);
      const contentH = Math.max(1, shellH - responsiveInsets.innerY * 2);
      const innerY = Math.max(1, Math.floor(responsiveInsets.innerY));
      const gapPx = Math.max(1, Math.floor(responsiveInsets.gapBase));
      const secScaleRaw = toFiniteNumber(model.captionUnitScale);
      const secScale = secScaleRaw > 0 ? secScaleRaw : SECONDARY_DEFAULT_SCALE;
      const mode = typeof model.mode === "string" && model.mode.length
        ? model.mode
        : "normal";

      const mainFit = toMainFitState({
        textApi: textApi,
        mode: mode,
        ctx: measureCtx,
        maxW: contentW,
        maxH: contentH,
        gapPx: gapPx,
        innerY: innerY,
        textFillScale: responsiveInsets.responsive.textFillScale,
        secScale: secScale,
        captionText: model.caption,
        valueText: model.zoomText,
        unitText: model.unit,
        family: family
      });
      const requiredFit = fitRequiredPx({
        textApi: textApi,
        mode: mode,
        mainFit: mainFit.modeFit,
        requiredText: model.showRequired ? model.requiredText : "",
        ctx: measureCtx,
        maxW: contentW,
        maxH: contentH,
        gapPx: gapPx,
        family: family
      });

      return {
        captionStyle: toFontStyle(mainFit.captionPx),
        valueStyle: toFontStyle(mainFit.valuePx),
        unitStyle: toFontStyle(mainFit.unitPx),
        requiredStyle: toFontStyle(requiredFit.px)
      };
    }

    return {
      id: "MapZoomHtmlFit",
      compute: compute
    };
  }

  return { id: "MapZoomHtmlFit", create: create };
}));
