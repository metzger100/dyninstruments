/**
 * @file ActiveRouteHtmlFit - Shared text-fit model for ActiveRoute interactive HTML renderer
 * Documentation: documentation/widgets/active-route.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniActiveRouteHtmlFit = factory();
  }
})(this, function () {
  "use strict";

  const METRIC_SEC_SCALE = 0.72;
  const ROUTE_NAME_MAX_PX_RATIO_FLAT = 0.46;
  const ROUTE_NAME_MAX_PX_RATIO_HIGH = 0.54;
  const ROUTE_NAME_MAX_PX_RATIO_NORMAL = 0.66;
  const FIT_CACHE_KEY = "__dyniActiveRouteHtmlFitCache";

  /**
   * @param {unknown} props
   * @returns {DyniActiveRouteDisplayProps}
   */
  function ensureDisplayProps(props) {
    const p = /** @type {Record<string, unknown>} */ (props || {});
    if (!p.display || typeof p.display !== "object") {
      throw new Error("ActiveRouteTextHtmlWidget: props.display is required");
    }
    if (!p.captions || typeof p.captions !== "object") {
      throw new Error("ActiveRouteTextHtmlWidget: props.captions is required");
    }
    if (!p.units || typeof p.units !== "object") {
      throw new Error("ActiveRouteTextHtmlWidget: props.units is required");
    }
    if (!Object.prototype.hasOwnProperty.call(p, "default")) {
      throw new Error("ActiveRouteTextHtmlWidget: props.default is required");
    }
    return /** @type {DyniActiveRouteDisplayProps} */ (p);
  }

  /**
   * @param {unknown} props
   * @param {DyniHtmlShellRect | null | undefined} shellRect
   * @param {DyniHtmlWidgetUtilsApi} htmlUtils
   * @returns {DyniActiveRouteLayoutMode}
   */
  function resolveDisplayMode(props, shellRect, htmlUtils) {
    const p = /** @type {Record<string, unknown>} */ (props || {});
    return /** @type {DyniActiveRouteLayoutMode} */ (
      htmlUtils.resolveRatioModeForRect({
        ratioThresholdNormal: p.ratioThresholdNormal,
        ratioThresholdFlat: p.ratioThresholdFlat,
        defaultRatioThresholdNormal: 1.2,
        defaultRatioThresholdFlat: 3.8,
        defaultMode: "normal",
        shellRect: shellRect
      })
    );
  }

  /**
   * @param {string} rawText
   * @param {boolean} stableDigitsEnabled
   * @param {DyniStableDigitsApi} stableDigits
   * @param {number} minWidth
   * @returns {DyniStableDigitsTextPair}
   */
  function normalizeStableValue(rawText, stableDigitsEnabled, stableDigits, minWidth) {
    if (!stableDigitsEnabled) {
      return { padded: rawText, plain: rawText };
    }
    return stableDigits.normalize(rawText, {
      integerWidth: stableDigits.resolveIntegerWidth(rawText, minWidth),
      reserveSignSlot: true
    });
  }

  /** @param {DyniActiveRouteLayoutMode} mode @returns {number} */
  function resolveRouteNameMaxPxRatio(mode) {
    if (mode === "flat") {
      return ROUTE_NAME_MAX_PX_RATIO_FLAT;
    }
    if (mode === "high") {
      return ROUTE_NAME_MAX_PX_RATIO_HIGH;
    }
    return ROUTE_NAME_MAX_PX_RATIO_NORMAL;
  }

  /**
   * @param {DyniActiveRouteRenderModel} model
   * @returns {DyniActiveRouteMetricSpec[]}
   */
  function buildMetricSpecs(model) {
    const specs = [
      {
        id: "remain",
        caption: model.remainCaption,
        value: model.remainText,
        plainValue: model.remainPlainText,
        unit: model.remainUnit
      },
      {
        id: "rteEta",
        caption: model.etaCaption,
        value: model.etaText,
        plainValue: model.etaPlainText,
        unit: model.etaUnit
      }
    ];
    if (model.isApproaching) {
      specs.push({
        id: "next",
        caption: model.nextCourseCaption,
        value: model.nextCourseText,
        plainValue: model.nextCoursePlainText,
        unit: model.nextCourseUnit
      });
    }
    return specs;
  }

  /**
   * @param {DyniActiveRouteFitSignatureArgs | undefined} args
   * @returns {string}
   */
  function buildFitSignature(args) {
    const cfg = /** @type {DyniActiveRouteFitSignatureArgs} */ (args || {});
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
      model.mode,
      model.isApproaching ? 1 : 0,
      model.disconnect ? 1 : 0,
      model.stableDigitsEnabled ? 1 : 0,
      model.routeNameText,
      model.remainCaption,
      model.remainText,
      model.remainPlainText,
      model.remainUnit,
      model.etaCaption,
      model.etaText,
      model.etaPlainText,
      model.etaUnit,
      model.nextCourseCaption,
      model.nextCourseText,
      model.nextCoursePlainText,
      model.nextCourseUnit
    ]);
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniActiveRouteHtmlFitApi}
   */
  function create(def, componentContext) {
    const theme = /** @type {DyniActiveRouteThemeResolver} */ (
      /** @type {unknown} */ (componentContext.theme && componentContext.theme.tokens)
    );
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const htmlMeasureUtils = componentContext.components.require("HtmlMeasureUtils");
    const unitFormatter = componentContext.components.require("UnitAwareFormatter");
    const radialText = componentContext.components.require("CanvasTextLayout");
    const tileLayout = componentContext.components.require("TextTileLayout");
    const layoutApi = componentContext.components.require("ActiveRouteLayout");
    const valueMath = componentContext.components.require("ValueMath");

    /**
     * @param {unknown} rawValue
     * @param {unknown} formatter
     * @param {unknown} formatterParameters
     * @param {unknown} defaultText
     * @param {DyniPlaceholderNormalizeApi} placeholderNormalize
     * @returns {string}
     */
    function formatActiveRouteMetric(rawValue, formatter, formatterParameters, defaultText, placeholderNormalize) {
      return unitFormatter.formatWithToken(
        rawValue,
        formatter,
        Array.isArray(formatterParameters) && formatterParameters.length > 0 ? formatterParameters[0] : undefined,
        defaultText
      );
    }

    /**
     * @param {DyniActiveRouteHtmlFitArgs | undefined} args
     * @returns {DyniActiveRouteMarkupFit | null}
     */
    function compute(args) {
      const cfg = /** @type {DyniActiveRouteHtmlFitArgs} */ (args || {});
      const model = cfg.model || null;
      const shellRect = cfg.shellRect || null;
      const hostContext = cfg.hostContext || null;
      const targetEl = cfg.targetEl || null;
      if (!model || !shellRect || !targetEl) {
        return null;
      }

      const rootEl = componentContext.dom.requirePluginRoot(targetEl);
      const tokens = theme.resolveForRoot(rootEl);
      const valueWeight = tokens.font.weight;
      const labelWeight = tokens.font.labelWeight;
      const family = tokens.font.family;
      const valueFamily = /** @type {string} */ (htmlUtils.resolveMetricValueFamily(model, tokens, family));
      const valueTextOptions =
        model.stableDigitsEnabled === true
          ? {
              useMono: true,
              monoFamily: tokens.font.familyMono || family
            }
          : null;
      const ownerDocument = htmlMeasureUtils.resolveOwnerDocument(targetEl);
      const measureCtx = htmlMeasureUtils.resolveMeasureContext(hostContext, ownerDocument);
      if (!measureCtx || typeof measureCtx.measureText !== "function") {
        return null;
      }

      const W = Math.max(1, Math.round(shellRect.width));
      const H = Math.max(1, Math.round(shellRect.height));
      const fitCache = /** @type {DyniActiveRouteFitCache | null} */ (
        htmlMeasureUtils.resolveFitCache(hostContext, FIT_CACHE_KEY)
      );
      const fitSignature = buildFitSignature({
        width: W,
        height: H,
        family: family,
        valueFamily: valueFamily,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        model: model
      });
      if (fitCache && fitCache.signature === fitSignature && fitCache.result) {
        return fitCache.result;
      }
      const insets = layoutApi.computeInsets(W, H);
      const contentRect = layoutApi.createContentRect(W, H, insets);
      const layout = layoutApi.computeLayout({
        contentRect: contentRect,
        gap: insets.gap,
        namePadX: insets.namePadX,
        mode: model.mode,
        isApproaching: model.isApproaching,
        responsive: insets.responsive
      });

      const nameWeight = model.mode === "normal" ? valueWeight : labelWeight;
      const nameFit = /** @type {DyniFittedLineMeasurement} */ (
        tileLayout.measureFittedLine({
          textApi: radialText,
          ctx: measureCtx,
          text: model.routeNameText,
          maxW: Math.max(1, layout.nameRect.w - layout.namePadX * 2),
          maxH: layout.nameRect.h,
          maxPx: Math.max(1, Math.floor(layout.nameRect.h * resolveRouteNameMaxPxRatio(model.mode))),
          textFillScale: layout.responsive.textFillScale,
          family: family,
          weight: nameWeight
        })
      );

      /** @type {Record<string, DyniActiveRouteMetricStyle>} */
      const metricStyles = Object.create(null);
      /** @type {Record<string, string>} */
      const metricValues = Object.create(null);
      const metricSpecs = buildMetricSpecs(model);
      for (let i = 0; i < metricSpecs.length; i += 1) {
        const metric = metricSpecs[i];
        const metricRect = layout.metricRects[metric.id];
        if (!metricRect) {
          continue;
        }
        const spacing = layoutApi.computeMetricTileSpacing(metricRect, layout.responsive);
        const primaryMeasurement = /** @type {DyniMetricTileMeasurement} */ (
          tileLayout.measureMetricTile({
            textApi: radialText,
            ctx: measureCtx,
            metric: metric,
            rect: metricRect,
            textFillScale: layout.responsive.textFillScale,
            family: family,
            valueWeight: valueWeight,
            labelWeight: labelWeight,
            secScale: METRIC_SEC_SCALE,
            padX: spacing.padX,
            captionHeightPx: spacing.captionHeightPx,
            valueTextOptions: valueTextOptions
          })
        );
        const primaryFit = primaryMeasurement.fit;
        const primaryClipped = primaryFit.total > primaryMeasurement.textW + 0.01;
        const usePlain =
          model.stableDigitsEnabled === true &&
          primaryClipped &&
          typeof metric.plainValue === "string" &&
          metric.plainValue !== metric.value;
        const metricForFit = usePlain
          ? {
              id: metric.id,
              caption: metric.caption,
              value: metric.plainValue,
              plainValue: metric.plainValue,
              unit: metric.unit
            }
          : metric;
        const measurement = usePlain
          ? /** @type {DyniMetricTileMeasurement} */ (
              tileLayout.measureMetricTile({
                textApi: radialText,
                ctx: measureCtx,
                metric: metricForFit,
                rect: metricRect,
                textFillScale: layout.responsive.textFillScale,
                family: family,
                valueWeight: valueWeight,
                labelWeight: labelWeight,
                secScale: METRIC_SEC_SCALE,
                padX: spacing.padX,
                captionHeightPx: spacing.captionHeightPx,
                valueTextOptions: valueTextOptions
              })
            )
          : primaryMeasurement;
        const fit = measurement.fit;
        const captionText = htmlUtils.trimText(metric.caption);
        const captionFit = captionText
          ? /** @type {DyniFittedLineMeasurement} */ (
              tileLayout.measureFittedLine({
                textApi: radialText,
                ctx: measureCtx,
                text: captionText,
                maxW: measurement.textW,
                maxH: measurement.capH,
                maxPx: measurement.capMaxPx,
                textFillScale: layout.responsive.textFillScale,
                family: family,
                weight: labelWeight
              })
            )
          : null;
        metricValues[metric.id] = metricForFit.value;
        metricStyles[metric.id] = {
          captionStyle: htmlUtils.toFontStyle(captionFit && captionFit.px),
          valueStyle: htmlUtils.toFontStyle(fit.vPx),
          unitStyle: htmlUtils.toFontStyle(fit.uPx),
          gapStyle: fit.gap > 0 ? "gap:" + Math.max(1, Math.floor(fit.gap)) + "px;" : ""
        };
      }

      const out = {
        routeNameStyle: htmlUtils.toFontStyle(nameFit && nameFit.px),
        metrics: metricStyles,
        metricValues: metricValues
      };
      if (fitCache) {
        fitCache.signature = fitSignature;
        fitCache.result = out;
      }
      return out;
    }

    return {
      id: "ActiveRouteHtmlFit",
      compute: compute,
      ensureDisplayProps: ensureDisplayProps,
      resolveDisplayMode: resolveDisplayMode,
      formatActiveRouteMetric: formatActiveRouteMetric,
      textLength: valueMath.textLength,
      normalizeStableValue: normalizeStableValue
    };
  }

  /** @type {DyniActiveRouteHtmlFitModule} */
  return {
    id: "ActiveRouteHtmlFit",
    create: create
  };
});
