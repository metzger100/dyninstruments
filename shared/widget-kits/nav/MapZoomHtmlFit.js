/**
 * Module: MapZoomHtmlFit - Per-element text fitting for map zoom HTML renderer
 * Documentation: documentation/widgets/map-zoom.md
 * Depends: Helpers.requirePluginRoot, TextLayoutEngine, HtmlWidgetUtils, ThemeResolver
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniMapZoomHtmlFit = factory(); }
}(this, function () {
  "use strict";

  const MEASURE_CTX_KEY = "__dyniMapZoomMeasureCtx";
  const FIT_CACHE_KEY = "__dyniMapZoomHtmlFitCache";
  const EMPTY_STYLES = Object.freeze({
    captionStyle: "",
    valueStyle: "",
    unitStyle: "",
    requiredStyle: ""
  });
  const SECONDARY_DEFAULT_SCALE = 0.8;

  function numberOr(value, defaultNumber) {
    return typeof value === "number" ? value : defaultNumber;
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

  function resolveFitCache(hostContext) {
    const ctx = hostContext && typeof hostContext === "object" ? hostContext : null;
    if (!ctx) {
      return null;
    }
    const existing = ctx[FIT_CACHE_KEY];
    if (existing && typeof existing === "object") {
      return existing;
    }
    const cache = { signature: "", result: null };
    ctx[FIT_CACHE_KEY] = cache;
    return cache;
  }

  function toFontStyle(px, htmlUtils) {
    const resolved = htmlUtils.toFiniteNumber(px);
    const out = Math.floor(numberOr(resolved, 0));
    return out > 0 ? ("font-size:" + out + "px;") : "";
  }

  function estimateMainUsedHeight(args, htmlUtils) {
    const cfg = args || {};
    const fit = cfg.fit;
    if (!fit || typeof fit !== "object") {
      return 0;
    }
    const captionPx = htmlUtils.toFiniteNumber(fit.cPx);
    const valuePx = htmlUtils.toFiniteNumber(fit.vPx);
    const unitPx = htmlUtils.toFiniteNumber(fit.uPx);
    const secondaryPx = htmlUtils.toFiniteNumber(fit.sPx);
    const gapValue = htmlUtils.toFiniteNumber(cfg.gapPx);
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
    return value != null && String(value).trim().length > 0;
  }

  function toMainFitState(args) {
    const cfg = args || {};
    const text = cfg.textApi;
    if (cfg.mode === "high") {
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
        valueWeight: cfg.valueWeight,
        labelWeight: cfg.labelWeight,
        useMono: cfg.useMono === true,
        monoFamily: cfg.monoFamily
      });
      return { captionPx: fitHigh.cPx, valuePx: fitHigh.vPx, unitPx: fitHigh.uPx, modeFit: fitHigh };
    }
    if (cfg.mode === "normal") {
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
        valueWeight: cfg.valueWeight,
        labelWeight: cfg.labelWeight,
        useMono: cfg.useMono === true,
        monoFamily: cfg.monoFamily
      });
      return { captionPx: fitNormal.cPx, valuePx: fitNormal.vPx, unitPx: fitNormal.uPx, modeFit: fitNormal };
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
      valueWeight: cfg.valueWeight,
      labelWeight: cfg.labelWeight,
      useMono: cfg.useMono === true,
      monoFamily: cfg.monoFamily
    });
    return {
      captionPx: hasText(cfg.captionText) ? fitFlat.sPx : 0,
      valuePx: fitFlat.vPx,
      unitPx: hasText(cfg.unitText) ? fitFlat.sPx : 0,
      modeFit: fitFlat
    };
  }

  function isTextCleanFit(args) {
    const cfg = args || {};
    if (!hasText(cfg.text) || !(cfg.px > 0)) {
      return false;
    }
    const fit = cfg.textApi.fitSingleLineBinary({
      ctx: cfg.ctx,
      text: cfg.text,
      minPx: Math.max(1, Math.floor(cfg.px)),
      maxPx: Math.max(1, Math.floor(cfg.px)),
      maxW: Math.max(1, Math.floor(cfg.maxW)),
      maxH: Math.max(1, Math.floor(cfg.maxH)),
      family: cfg.family,
      weight: cfg.weight
    });
    return numberOr(fit && fit.width, 0) <= Math.max(1, Math.floor(cfg.maxW)) + 0.01;
  }

  function fitRequiredPx(args, htmlUtils) {
    const cfg = args || {};
    if (!hasText(cfg.requiredText)) {
      return { px: 0 };
    }
    const mainUsedH = estimateMainUsedHeight({
      fit: cfg.mainFit,
      mode: cfg.mode,
      gapPx: cfg.gapPx
    }, htmlUtils);
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
      weight: cfg.labelWeight
    });
    return {
      px: requiredFit.px
    };
  }

  function buildFitSignature(args) {
    const cfg = args || {};
    const model = cfg.model;
    if (!model || typeof model !== "object") {
      return "";
    }
    return JSON.stringify([
      cfg.width,
      cfg.height,
      cfg.family,
      cfg.valueFamily,
      cfg.valueWeight,
      cfg.labelWeight,
      cfg.mode,
      cfg.secScale,
      model.showRequired ? 1 : 0,
      model.stableDigitsEnabled ? 1 : 0,
      model.caption,
      model.zoomText,
      model.zoomFallbackText,
      model.unit,
      model.requiredText,
      model.requiredFallbackText
    ]);
  }

  function create(def, Helpers) {
    const textApi = Helpers.getModule("TextLayoutEngine").create(def, Helpers);
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);
    const themeApi = Helpers.getModule("ThemeResolver");

    function compute(args) {
      const cfg = args || {};
      const model = cfg.model;
      const hostContext = cfg.hostContext ? cfg.hostContext : null;
      if (!model || typeof model !== "object") {
        return EMPTY_STYLES;
      }
      const rect = cfg.shellRect || htmlUtils.resolveShellRect(hostContext);
      if (!rect) {
        return EMPTY_STYLES;
      }

      const measureCtx = resolveMeasureContext(hostContext);
      if (!measureCtx || typeof measureCtx.measureText !== "function") {
        return EMPTY_STYLES;
      }
      const target = getMeasureTarget(hostContext);
      const themeRoot = Helpers.requirePluginRoot(target || cfg.targetEl);
      const tokens = themeApi.resolveForRoot(themeRoot);
      const family = tokens.font.family;
      const valueFamily = model.stableDigitsEnabled === true && tokens.font.familyMono
        ? tokens.font.familyMono
        : family;
      const valueWeight = tokens.font.weight;
      const labelWeight = tokens.font.labelWeight;
      const shellW = Math.max(1, Math.round(rect.width));
      const shellH = Math.max(1, Math.round(rect.height));
      const responsiveInsets = textApi.computeResponsiveInsets(shellW, shellH);
      const contentW = Math.max(1, shellW - responsiveInsets.padX * 2);
      const contentH = Math.max(1, shellH - responsiveInsets.innerY * 2);
      const innerY = Math.max(1, Math.floor(responsiveInsets.innerY));
      const gapPx = Math.max(1, Math.floor(responsiveInsets.gapBase));
      const secScaleRaw = htmlUtils.toFiniteNumber(model.captionUnitScale);
      const secScale = secScaleRaw > 0 ? secScaleRaw : SECONDARY_DEFAULT_SCALE;
      const mode = typeof model.mode === "string" && model.mode.length
        ? model.mode
        : "normal";
      const fitCache = resolveFitCache(hostContext);
      const fitSignature = buildFitSignature({
        width: shellW,
        height: shellH,
        family: family,
        valueFamily: valueFamily,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        mode: mode,
        secScale: secScale,
        model: model
      });
      if (fitCache && fitCache.signature === fitSignature && fitCache.result) {
        return fitCache.result;
      }

      const mainFitArgs = {
        textApi: textApi,
        mode: mode,
        ctx: measureCtx,
        maxW: contentW,
        maxH: contentH,
        gapPx: gapPx,
        innerY: innerY,
        padX: responsiveInsets.padX,
        textFillScale: responsiveInsets.responsive.textFillScale,
        secScale: secScale,
        captionText: model.caption,
        valueFamily: valueFamily,
        unitText: model.unit,
        family: family,
        useMono: model.stableDigitsEnabled === true,
        monoFamily: valueFamily,
        valueWeight: valueWeight,
        labelWeight: labelWeight
      };
      const mainFit = toMainFitState(Object.assign({ valueText: model.zoomText }, mainFitArgs));
      const mainCandidate = isTextCleanFit({
        textApi: textApi,
        ctx: measureCtx,
        text: model.zoomText,
        px: mainFit.valuePx,
        maxW: contentW,
        maxH: contentH,
        family: valueFamily,
        weight: valueWeight
      }) || !hasText(model.zoomFallbackText) || model.zoomFallbackText === model.zoomText
        ? mainFit
        : toMainFitState(Object.assign({ valueText: model.zoomFallbackText }, mainFitArgs));
      const requiredFitArgs = {
        textApi: textApi,
        mode: mode,
        mainFit: mainCandidate.modeFit,
        ctx: measureCtx,
        maxW: contentW,
        maxH: contentH,
        gapPx: gapPx,
        family: valueFamily,
        labelWeight: labelWeight
      };
      const requiredPrimary = fitRequiredPx(Object.assign({
        requiredText: model.showRequired ? model.requiredText : ""
      }, requiredFitArgs), htmlUtils);
      const requiredCandidate = isTextCleanFit({
        textApi: textApi,
        ctx: measureCtx,
        text: model.requiredText,
        px: requiredPrimary.px,
        maxW: contentW,
        maxH: contentH,
        family: valueFamily,
        weight: labelWeight
      }) || !hasText(model.requiredFallbackText) || model.requiredFallbackText === model.requiredText
        ? requiredPrimary
        : fitRequiredPx(Object.assign({ requiredText: model.requiredFallbackText }, requiredFitArgs), htmlUtils);

      const out = {
        captionStyle: toFontStyle(mainCandidate.captionPx, htmlUtils),
        valueStyle: toFontStyle(mainCandidate.valuePx, htmlUtils),
        unitStyle: toFontStyle(mainCandidate.unitPx, htmlUtils),
        requiredStyle: toFontStyle(requiredCandidate.px, htmlUtils),
        zoomText: mainCandidate === mainFit ? model.zoomText : model.zoomFallbackText,
        requiredText: requiredCandidate === requiredPrimary ? model.requiredText : model.requiredFallbackText
      };
      if (fitCache) {
        fitCache.signature = fitSignature;
        fitCache.result = out;
      }
      return out;
    }

    return {
      id: "MapZoomHtmlFit",
      compute: compute
    };
  }

  return { id: "MapZoomHtmlFit", create: create };
}));
