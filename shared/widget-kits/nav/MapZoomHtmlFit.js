/**
 * @file MapZoomHtmlFit - Per-element text fitting for map zoom HTML renderer
 * Documentation: documentation/widgets/map-zoom.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniMapZoomHtmlFit = factory();
  }
}(this, function () {
  "use strict";

  const FIT_CACHE_KEY = "__dyniMapZoomHtmlFitCache";
  const EMPTY_STYLES = Object.freeze({
    captionStyle: "",
    valueStyle: "",
    unitStyle: "",
    requiredStyle: ""
  });
  const SECONDARY_DEFAULT_SCALE = 0.8;
  /** @type {DyniValueMathApi["hasText"]} */
  let hasText;

  /**
   * @param {unknown} value
   * @param {number} defaultNumber
   * @returns {number}
   */
  function numberOr(value, defaultNumber) {
    return typeof value === "number" ? value : defaultNumber;
  }

  /**
   * @param {DyniMapZoomHeightEstimateArgs | undefined} args
   * @param {DyniHtmlWidgetUtilsApi} htmlUtils
   * @returns {number}
   */
  function estimateMainUsedHeight(args, htmlUtils) {
    const cfg = /** @type {DyniMapZoomHeightEstimateArgs} */ (args || {});
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

  /**
   * @param {DyniMapZoomMainFitArgs | undefined} args
   * @returns {DyniMapZoomMainFitState}
   */
  function toMainFitState(args) {
    const cfg = /** @type {DyniMapZoomMainFitArgs} */ (args || {});
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
      return {
        captionPx: fitHigh.cPx,
        valuePx: fitHigh.vPx,
        unitPx: fitHigh.uPx,
        modeFit: fitHigh
      };
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

  /**
   * @param {DyniMapZoomCleanFitArgs | undefined} args
   * @returns {boolean}
   */
  function isTextCleanFit(args) {
    const cfg = /** @type {DyniMapZoomCleanFitArgs} */ (args || {});
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

  /**
   * @param {DyniMapZoomRequiredFitArgs | undefined} args
   * @param {DyniHtmlWidgetUtilsApi} htmlUtils
   * @returns {DyniMapZoomRequiredFit}
   */
  function fitRequiredPx(args, htmlUtils) {
    const cfg = /** @type {DyniMapZoomRequiredFitArgs} */ (args || {});
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

  /**
   * @param {DyniMapZoomSignatureArgs | undefined} args
   * @returns {string}
   */
  function buildFitSignature(args) {
    const cfg = /** @type {DyniMapZoomSignatureArgs} */ (args || {});
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
      model.zoomPlainText,
      model.unit,
      model.requiredText,
      model.requiredPlainText
    ]);
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniMapZoomHtmlFitApi}
   */
  function create(def, componentContext) {
    const textApi = componentContext.components.require("TextLayoutEngine");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const htmlMeasureUtils = componentContext.components.require("HtmlMeasureUtils");
    const valueMath = componentContext.components.require("ValueMath");
    const themeApi = /** @type {DyniMapZoomThemeResolver} */ (
      /** @type {{ theme: { tokens: DyniMapZoomThemeResolver } }} */ (/** @type {unknown} */ (componentContext)).theme.tokens
    );
    hasText = valueMath.hasText;

    /**
     * @param {DyniMapZoomHtmlFitArgs | undefined} args
     * @returns {DyniMapZoomHtmlFitResult}
     */
    function compute(args) {
      const cfg = /** @type {DyniMapZoomHtmlFitArgs} */ (args || {});
      const model = cfg.model;
      const hostContext = cfg.hostContext ? cfg.hostContext : null;
      if (!model || typeof model !== "object") {
        return EMPTY_STYLES;
      }
      const rect = cfg.shellRect || htmlUtils.resolveShellRect(hostContext);
      if (!rect) {
        return EMPTY_STYLES;
      }

      const target = htmlUtils.resolveHostCommitTarget(hostContext, cfg.targetEl);
      const measureCtx = htmlMeasureUtils.resolveMeasureContext(hostContext, target || cfg.targetEl);
      if (!measureCtx || typeof measureCtx.measureText !== "function") {
        return EMPTY_STYLES;
      }
      const themeRoot = componentContext.dom.requirePluginRoot(target || cfg.targetEl);
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
      const secScale = typeof secScaleRaw === "number" && secScaleRaw > 0
        ? secScaleRaw
        : SECONDARY_DEFAULT_SCALE;
      const mode = typeof model.mode === "string" && model.mode.length
        ? model.mode
        : "normal";
      const fitCache = htmlMeasureUtils.resolveFitCache(hostContext, FIT_CACHE_KEY);
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
        return /** @type {DyniMapZoomHtmlFitResult} */ (fitCache.result);
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
      }) || !valueMath.hasText(model.zoomPlainText) || model.zoomPlainText === model.zoomText
        ? mainFit
        : toMainFitState(Object.assign({ valueText: model.zoomPlainText }, mainFitArgs));
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
      }) || !valueMath.hasText(model.requiredPlainText) || model.requiredPlainText === model.requiredText
        ? requiredPrimary
        : fitRequiredPx(Object.assign({ requiredText: model.requiredPlainText }, requiredFitArgs), htmlUtils);

      const out = {
        captionStyle: htmlUtils.toFontStyle(mainCandidate.captionPx),
        valueStyle: htmlUtils.toFontStyle(mainCandidate.valuePx),
        unitStyle: htmlUtils.toFontStyle(mainCandidate.unitPx),
        requiredStyle: htmlUtils.toFontStyle(requiredCandidate.px),
        zoomText: mainCandidate === mainFit ? model.zoomText : model.zoomPlainText,
        requiredText: requiredCandidate === requiredPrimary ? model.requiredText : model.requiredPlainText
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
