/**
 * Module: ActiveRouteHtmlFit - Shared text-fit model for ActiveRoute interactive HTML renderer
 * Documentation: documentation/widgets/active-route.md
 * Depends: componentContext.theme.tokens, CanvasTextLayout, TextTileLayout, ActiveRouteLayout, HtmlWidgetUtils, HtmlMeasureUtils, UnitAwareFormatter, ValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniActiveRouteHtmlFit = factory(); }
}(this, function () {
  "use strict";

  const METRIC_SEC_SCALE = 0.72;
  const ROUTE_NAME_MAX_PX_RATIO_FLAT = 0.46;
  const ROUTE_NAME_MAX_PX_RATIO_HIGH = 0.54;
  const ROUTE_NAME_MAX_PX_RATIO_NORMAL = 0.66;
  const FIT_CACHE_KEY = "__dyniActiveRouteHtmlFitCache";

  function ensureDisplayProps(props) {
    const p = props || {};
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
    return p;
  }

  function resolveDisplayMode(props, shellRect, htmlUtils) {
    const p = props || {};
    return htmlUtils.resolveRatioModeForRect({
      ratioThresholdNormal: p.ratioThresholdNormal,
      ratioThresholdFlat: p.ratioThresholdFlat,
      defaultRatioThresholdNormal: 1.2,
      defaultRatioThresholdFlat: 3.8,
      defaultMode: "normal",
      shellRect: shellRect
    });
  }

  function normalizeStableValue(rawText, stableDigitsEnabled, stableDigits, minWidth) {
    if (!stableDigitsEnabled) {
      return { padded: rawText, plain: rawText };
    }
    return stableDigits.normalize(rawText, {
      integerWidth: stableDigits.resolveIntegerWidth(rawText, minWidth),
      reserveSignSlot: true
    });
  }

  function resolveRouteNameMaxPxRatio(mode) {
    if (mode === "flat") {
      return ROUTE_NAME_MAX_PX_RATIO_FLAT;
    }
    if (mode === "high") {
      return ROUTE_NAME_MAX_PX_RATIO_HIGH;
    }
    return ROUTE_NAME_MAX_PX_RATIO_NORMAL;
  }

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

  function create(def, componentContext) {
    const theme = componentContext.theme.tokens;
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const htmlMeasureUtils = componentContext.components.require("HtmlMeasureUtils");
    const unitFormatter = componentContext.components.require("UnitAwareFormatter");
    const radialText = componentContext.components.require("CanvasTextLayout");
    const tileLayout = componentContext.components.require("TextTileLayout");
    const layoutApi = componentContext.components.require("ActiveRouteLayout");
    const valueMath = componentContext.components.require("ValueMath");

    function formatActiveRouteMetric(rawValue, formatter, formatterParameters, defaultText, placeholderNormalize) {
      return unitFormatter.formatWithToken(
        rawValue,
        formatter,
        Array.isArray(formatterParameters) && formatterParameters.length > 0
          ? formatterParameters[0]
          : undefined,
        defaultText
      );
    }

    function compute(args) {
      const cfg = args || {};
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
      const valueFamily = htmlUtils.resolveMetricValueFamily(model, tokens, family);
      const valueTextOptions = model.stableDigitsEnabled === true
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
      const fitCache = htmlMeasureUtils.resolveFitCache(hostContext, FIT_CACHE_KEY);
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
      const nameFit = tileLayout.measureFittedLine({
        textApi: radialText,
        ctx: measureCtx,
        text: model.routeNameText,
        maxW: Math.max(1, layout.nameRect.w - layout.namePadX * 2),
        maxH: layout.nameRect.h,
        maxPx: Math.max(1, Math.floor(layout.nameRect.h * resolveRouteNameMaxPxRatio(model.mode))),
        textFillScale: layout.responsive.textFillScale,
        family: family,
        weight: nameWeight
      });

      const metricStyles = Object.create(null);
      const metricValues = Object.create(null);
      const metricSpecs = buildMetricSpecs(model);
      for (let i = 0; i < metricSpecs.length; i += 1) {
        const metric = metricSpecs[i];
        const metricRect = layout.metricRects[metric.id];
        if (!metricRect) {
          continue;
        }
        const spacing = layoutApi.computeMetricTileSpacing(metricRect, layout.responsive);
        const primaryMeasurement = tileLayout.measureMetricTile({
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
        });
        const primaryFit = primaryMeasurement && primaryMeasurement.fit ? primaryMeasurement.fit : null;
        const primaryClipped = !!(primaryMeasurement && primaryFit && primaryFit.total > primaryMeasurement.textW + 0.01);
        const usePlain = model.stableDigitsEnabled === true &&
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
          ? tileLayout.measureMetricTile({
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
          : primaryMeasurement;
        const fit = measurement && measurement.fit ? measurement.fit : null;
        const captionText = htmlUtils.trimText(metric.caption);
        const captionFit = captionText
          ? tileLayout.measureFittedLine({
            textApi: radialText,
            ctx: measureCtx,
            text: captionText,
            maxW: measurement ? measurement.textW : 1,
            maxH: measurement ? measurement.capH : 1,
            maxPx: measurement ? measurement.capMaxPx : 1,
            textFillScale: layout.responsive.textFillScale,
            family: family,
            weight: labelWeight
          })
          : null;
        metricValues[metric.id] = metricForFit.value;
        metricStyles[metric.id] = {
          captionStyle: htmlUtils.toFontStyle(captionFit && captionFit.px),
          valueStyle: htmlUtils.toFontStyle(fit && fit.vPx),
          unitStyle: htmlUtils.toFontStyle(fit && fit.uPx),
          gapStyle: fit && fit.gap > 0
            ? "gap:" + Math.max(1, Math.floor(fit.gap)) + "px;"
            : ""
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

  return {
    id: "ActiveRouteHtmlFit",
    create: create
  };
}));
