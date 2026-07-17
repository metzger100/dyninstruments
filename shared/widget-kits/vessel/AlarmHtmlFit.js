/**
 * @file AlarmHtmlFit - Text-fit and token-style owner for vessel alarm HTML
 * Documentation: documentation/widgets/alarm.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniAlarmHtmlFit = factory();
  }
}(this, function () {
  "use strict";

  const SECONDARY_SCALE = 0.8;
  const CONTENT_PAD_X_RATIO = 0.03;
  const FIT_CACHE_KEY = "__dyniAlarmHtmlFitCache";
  /** @type {DyniValueMathApi["toObject"]} */
  let toObject;

  /** @param {number} width @param {number} height @returns {number} */
  function computeContentPadX(width, height) {
    return Math.max(2, Math.floor(Math.min(width, height) * CONTENT_PAD_X_RATIO));
  }

  /**
   * @param {DyniAlarmResolvedTheme | null | undefined} theme
   * @returns {DyniAlarmThemeTokens}
   */
  function resolveThemeColors(theme) {
    const colors = theme && theme.colors && typeof theme.colors === "object" ? theme.colors : null;
    const alarmWidget = colors && colors.alarmWidget && typeof colors.alarmWidget === "object"
      ? colors.alarmWidget
      : null;
    return {
      bg: alarmWidget ? alarmWidget.bg : undefined,
      fg: alarmWidget ? alarmWidget.fg : undefined,
      strip: alarmWidget ? alarmWidget.strip : undefined
    };
  }

  /**
   * @param {DyniAlarmModeFitArgs | null | undefined} args
   * @param {DyniTextLayoutEngineApi} textLayout
   * @param {DyniHtmlWidgetUtilsApi} htmlUtils
   * @returns {DyniAlarmModeFit}
   */
  function computeModeFit(args, textLayout, htmlUtils) {
    const cfg = /** @type {DyniAlarmModeFitArgs} */ (args || {});
    const mode = cfg.mode;
    const model = cfg.model;
    const width = Math.max(1, Math.round(cfg.width));
    const height = Math.max(1, Math.round(cfg.height));
    const padX = computeContentPadX(width, height);
    const maxW = Math.max(1, width - padX * 2);
    const ctx = cfg.ctx;
    const family = cfg.family;
    const valueWeight = cfg.valueWeight;
    const labelWeight = cfg.labelWeight;
    const secScale = SECONDARY_SCALE;
    const textFillScale = 1;
    const gapBase = Math.max(0, Math.floor(Math.min(width, height) * 0.04));
    const innerY = Math.max(0, Math.floor(Math.min(width, height) * 0.05));

    if (mode === "flat") {
      const fit = textLayout.fitInlineTriplet({
        ctx: ctx,
        captionText: model.captionText,
        valueText: model.valueText,
        unitText: "",
        secScale: secScale,
        gap: gapBase,
        maxW: maxW,
        maxH: height,
        family: family,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        useMono: false,
        monoFamily: family,
        textFillScale: textFillScale
      });
      return {
        captionPx: fit.sPx,
        valuePx: fit.vPx,
        modeFit: fit
      };
    }

    if (mode === "high") {
      const fit = textLayout.fitThreeRowBlock({
        ctx: ctx,
        W: maxW,
        H: height,
        padX: 0,
        innerY: innerY,
        secScale: secScale,
        textFillScale: textFillScale,
        captionText: model.captionText,
        valueText: model.valueText,
        unitText: "",
        family: family,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        useMono: false,
        monoFamily: family
      });
      return {
        captionPx: fit.cPx,
        valuePx: fit.vPx,
        modeFit: fit
      };
    }

    const fit = textLayout.fitValueUnitCaptionRows({
      ctx: ctx,
      W: maxW,
      H: height,
      padX: 0,
      innerY: innerY,
      gapBase: gapBase,
      secScale: secScale,
      textFillScale: textFillScale,
      captionText: model.captionText,
      valueText: model.valueText,
      unitText: "",
      family: family,
      valueWeight: valueWeight,
      labelWeight: labelWeight,
      useMono: false,
      monoFamily: family
    });
    return {
      captionPx: fit.cPx,
      valuePx: fit.vPx,
      modeFit: fit
    };
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniAlarmHtmlFitApi}
   */
  function create(def, componentContext) {
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const htmlMeasureUtils = componentContext.components.require("HtmlMeasureUtils");
    const textLayout = componentContext.components.require("TextLayoutEngine");
    const themeResolver = /** @type {DyniAlarmThemeResolver} */ (
      /** @type {unknown} */ (componentContext.theme && componentContext.theme.tokens)
    );
    const chromeApi = componentContext.components.require("AlarmHtmlFitChrome");
    toObject = componentContext.components.require("ValueMath").toObject;

    /**
     * @param {DyniAlarmHtmlFitComputeArgs | null | undefined} args
     * @returns {DyniAlarmHtmlFitResult | null}
     */
    function compute(args) {
      const cfg = args || {};
      const model = /** @type {DyniAlarmFitModel} */ (toObject(cfg.model));
      const shellRect = cfg.shellRect && typeof cfg.shellRect === "object"
        ? /** @type {DyniAlarmShellRect} */ (cfg.shellRect)
        : null;
      const targetEl = cfg.targetEl || cfg.rootEl || null;
      if (!model || !shellRect || !targetEl) {
        return null;
      }

      const rootEl = componentContext.dom.requirePluginRoot(targetEl);
      const theme = themeResolver.resolveForRoot(rootEl);
      const tokens = resolveThemeColors(theme);
      const measureCtx = htmlMeasureUtils.resolveMeasureContext(cfg.hostContext, targetEl);
      if (!measureCtx || typeof measureCtx.measureText !== "function") {
        return null;
      }

      const fitCache = htmlMeasureUtils.resolveFitCache(cfg.hostContext, FIT_CACHE_KEY);
      const font = theme && theme.font && typeof theme.font === "object" ? theme.font : null;
      if (!font) {
        return null;
      }
      const layout = chromeApi.resolveLayout({
        model: model,
        shellRect: shellRect
      });
      if (!layout) {
        return null;
      }
      const padX = computeContentPadX(layout.contentRect.width, layout.contentRect.height);
      const family = font.family;
      const valueWeight = font.weight;
      const labelWeight = font.labelWeight;
      const signature = chromeApi.buildSignature({
        mode: layout.mode,
        width: layout.contentRect.width,
        height: layout.contentRect.height,
        shellWidth: layout.shellRect.width,
        shellHeight: layout.shellRect.height,
        chrome: layout.contentRect.chrome,
        padX: padX,
        model: model,
        family: family,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        themeBg: tokens.bg,
        themeFg: tokens.fg,
        themeStrip: tokens.strip,
        fontMetricsEpoch: cfg.fontMetricsEpoch
      });
      if (fitCache && fitCache.signature === signature && fitCache.result) {
        return /** @type {DyniAlarmHtmlFitResult} */ (fitCache.result);
      }

      const modeFit = computeModeFit({
        mode: layout.mode,
        model: model,
        width: layout.contentRect.width,
        height: layout.contentRect.height,
        ctx: measureCtx,
        family: family,
        valueWeight: valueWeight,
        labelWeight: labelWeight
      }, textLayout, htmlUtils);

      const activeBackgroundStyle = model.showActiveBackground === true ? htmlUtils.toStyleText("background-color", tokens.bg) : "";
      const activeForegroundStyle = model.state === "active" ? htmlUtils.toStyleText("color", tokens.fg) : "";
      const chrome = layout.contentRect.chrome;
      const shellStyle = chromeApi.buildShellStyle(chrome);
      const accentStyle = chromeApi.buildAccentStyle(model, chrome, tokens);
      const result = /** @type {DyniAlarmHtmlFitResult} */ ({
        mode: layout.mode,
        captionPx: modeFit.captionPx,
        valuePx: modeFit.valuePx,
        captionStyle: htmlUtils.toFontStyle(modeFit.captionPx),
        valueStyle: htmlUtils.toFontStyle(modeFit.valuePx),
        shellStyle: shellStyle,
        accentStyle: accentStyle,
        activeBackgroundStyle: activeBackgroundStyle,
        activeForegroundStyle: activeForegroundStyle,
        idleStripStyle: accentStyle,
        showStrip: model.showStrip === true,
        showActiveBackground: model.showActiveBackground === true,
        valueSingleLine: true,
        interactionState: model.interactionState || "passive",
        state: model.state || "idle"
      });

      if (fitCache) {
        fitCache.signature = signature;
        fitCache.result = result;
      }
      return result;
    }

    return {
      id: "AlarmHtmlFit",
      compute: compute,
      resolveLayout: function (args) {
        return chromeApi.resolveLayout(args);
      }
    };
  }

  return { id: "AlarmHtmlFit", create: create };
}));
