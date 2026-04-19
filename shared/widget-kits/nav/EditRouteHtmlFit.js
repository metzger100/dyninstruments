/**
 * Module: EditRouteHtmlFit - Per-box text-fit owner for edit-route HTML renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ThemeResolver, RadialTextLayout, TextTileLayout, EditRouteLayout, HtmlWidgetUtils, TextFitMath, EditRouteHtmlFitSupport
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteHtmlFit = factory(); }
}(this, function () {
  "use strict";

  const SOURCE_BADGE_MAX_PX_RATIO = 0.7;
  const METRIC_VALUE_MAX_PX_RATIO = 0.9;
  const METRIC_SECONDARY_TO_VALUE_RATIO = 0.8;
  const METRIC_IDS = ["pts", "dst", "rte", "eta"];

  function create(def, Helpers) {
    const theme = Helpers.getModule("ThemeResolver");
    const textApi = Helpers.getModule("RadialTextLayout").create(def, Helpers);
    const tileLayout = Helpers.getModule("TextTileLayout").create(def, Helpers);
    const layoutApi = Helpers.getModule("EditRouteLayout").create(def, Helpers);
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);
    const fitMath = Helpers.getModule("TextFitMath").create(def, Helpers);
    const fitSupport = Helpers.getModule("EditRouteHtmlFitSupport").create(def, Helpers);

    function compute(args) {
      const cfg = args || {};
      const model = cfg.model || null;
      const shellRect = cfg.shellRect || null;
      const targetEl = cfg.targetEl || null;
      if (!model || !shellRect || !targetEl) {
        return null;
      }

      const rootEl = Helpers.requirePluginRoot(targetEl);
      const tokens = theme.resolveForRoot(rootEl);
      const family = tokens.font.family;
      const valueFamily = fitSupport.resolveMetricValueFamily(model, tokens);
      const measureCtx = fitSupport.resolveMeasureContext(cfg.hostContext, targetEl);
      if (!measureCtx || typeof measureCtx.measureText !== "function") {
        return null;
      }

      const shellWidth = Math.max(1, Math.round(shellRect.width));
      const shellHeight = Math.max(1, Math.round(shellRect.height));
      const explicitLayoutHeight = htmlUtils.toFiniteNumber(model.layoutShellHeight);
      const verticalHeight = htmlUtils.toFiniteNumber(model.effectiveLayoutHeight);
      const layoutHeight = explicitLayoutHeight > 0
        ? explicitLayoutHeight
        : (verticalHeight > 0 ? verticalHeight : shellHeight);

      const layout = layoutApi.computeLayout({
        W: shellWidth,
        H: layoutHeight,
        mode: model.mode,
        hasRoute: model.hasRoute === true,
        isLocalRoute: model.isLocalRoute === true,
        ratioThresholdNormal: model.ratioThresholdNormal,
        ratioThresholdFlat: model.ratioThresholdFlat,
        isVerticalCommitted: model.isVerticalCommitted === true,
        effectiveLayoutHeight: verticalHeight
      });

      const valueWeight = tokens.font.weight;
      const labelWeight = tokens.font.labelWeight;
      const textFillScale = layout.responsive && layout.responsive.textFillScale;
      const valueTextOptions = model.stableDigitsEnabled === true
        ? {
          useMono: true,
          monoFamily: tokens.font.familyMono || family
        }
        : null;
      const fitOut = {
        nameTextStyle: fitSupport.measureStyle({
          rect: layout.nameTextRect,
          text: fitSupport.toText(model.nameText != null ? model.nameText : model.routeNameText),
          maxPxRatio: fitSupport.resolveNamePxRatio(layout.mode),
          textApi: textApi,
          tileLayout: tileLayout,
          ctx: measureCtx,
          family: family,
          weight: valueWeight,
          textFillScale: textFillScale,
          htmlUtils: htmlUtils
        }),
        sourceBadgeStyle: "",
        metrics: Object.create(null),
        metricValues: Object.create(null)
      };

      if (layout.sourceBadgeRect) {
        fitOut.sourceBadgeStyle = fitSupport.measureStyle({
          rect: layout.sourceBadgeRect,
          text: fitSupport.toText(model.sourceBadgeText),
          maxPxRatio: SOURCE_BADGE_MAX_PX_RATIO,
          textApi: textApi,
          tileLayout: tileLayout,
          ctx: measureCtx,
          family: family,
          weight: labelWeight,
          textFillScale: textFillScale,
          htmlUtils: htmlUtils
        });
      }

      for (let i = 0; i < METRIC_IDS.length; i += 1) {
        const id = METRIC_IDS[i];
        if (!layout.metricVisibility[id]) {
          continue;
        }
        const box = layout.metricBoxes[id];
        if (!box) {
          continue;
        }
        const metricRect = box.tileRect || box.valueRect || box.labelRect;
        const spacing = layoutApi.computeMetricTileSpacing(metricRect, layout.responsive);
        const labelText = fitSupport.resolveMetricLabel(model, id);
        const valueText = fitSupport.resolveMetricValue(model, id);
        const fallbackValueText = fitSupport.resolveMetricFallbackValue(model, id);
        const unitText = fitSupport.resolveMetricUnit(model, id);

        if (layout.mode === "high") {
          const valueRect = box.valueTextRect || box.valueRect;
          const selectedValue = fitSupport.selectMetricValue({
            stableDigitsEnabled: model.stableDigitsEnabled === true,
            primaryText: valueText,
            fallbackText: fallbackValueText,
            rect: valueRect,
            maxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
            textApi: textApi,
            tileLayout: tileLayout,
            ctx: measureCtx,
            valueFamily: valueFamily || family,
            valueWeight: valueWeight,
            textFillScale: textFillScale,
            htmlUtils: htmlUtils
          });
          const valuePx = fitSupport.resolveMetricPx(selectedValue.fit, htmlUtils);
          const secondaryMaxPx = fitMath.resolveSecondaryMaxPx({
            valuePx: valuePx,
            valueRect: valueRect,
            valueMaxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
            secondaryToValueRatio: METRIC_SECONDARY_TO_VALUE_RATIO
          });

          fitOut.metrics[id] = {
            labelStyle: fitSupport.measureStyle({
              rect: box.labelRect,
              text: labelText,
              maxPx: secondaryMaxPx,
              maxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
              textApi: textApi,
              tileLayout: tileLayout,
              ctx: measureCtx,
              family: family,
              weight: labelWeight,
              textFillScale: 1,
              htmlUtils: htmlUtils
            }),
            valueRowStyle: "",
            valueStyle: fitSupport.toStyle(valuePx, htmlUtils),
            unitStyle: box.unitRect ? fitSupport.measureStyle({
              rect: box.unitRect,
              text: unitText,
              maxPx: secondaryMaxPx,
              maxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
              textApi: textApi,
              tileLayout: tileLayout,
              ctx: measureCtx,
              family: family,
              weight: labelWeight,
              textFillScale: 1,
              htmlUtils: htmlUtils
            }) : ""
          };
          fitOut.metricValues[id] = selectedValue.text;
          continue;
        }

        const primaryMeasurement = tileLayout.measureMetricTile({
          textApi: textApi,
          ctx: measureCtx,
          metric: {
            id: id,
            caption: labelText,
            value: valueText,
            fallbackValue: fallbackValueText,
            unit: unitText
          },
          rect: metricRect,
          textFillScale: layout.responsive.textFillScale,
          family: family,
          valueWeight: valueWeight,
          labelWeight: labelWeight,
          secScale: METRIC_SECONDARY_TO_VALUE_RATIO,
          padX: spacing.padX,
          captionHeightPx: spacing.captionHeightPx,
          valueTextOptions: valueTextOptions
        });
        const primaryClipped = !!(primaryMeasurement && primaryMeasurement.fit && primaryMeasurement.fit.total > primaryMeasurement.textW + 0.01);
        const useFallback = model.stableDigitsEnabled === true &&
          primaryClipped &&
          typeof fallbackValueText === "string" &&
          fallbackValueText !== valueText;
        const activeMetric = useFallback
          ? {
            id: id,
            caption: labelText,
            value: fallbackValueText,
            fallbackValue: fallbackValueText,
            unit: unitText
          }
          : {
            id: id,
            caption: labelText,
            value: valueText,
            fallbackValue: fallbackValueText,
            unit: unitText
          };
        const measurement = useFallback
          ? tileLayout.measureMetricTile({
            textApi: textApi,
            ctx: measureCtx,
            metric: activeMetric,
            rect: metricRect,
            textFillScale: layout.responsive.textFillScale,
            family: family,
            valueWeight: valueWeight,
            labelWeight: labelWeight,
            secScale: METRIC_SECONDARY_TO_VALUE_RATIO,
            padX: spacing.padX,
            captionHeightPx: spacing.captionHeightPx,
            valueTextOptions: valueTextOptions
          })
          : primaryMeasurement;
        const captionText = labelText;
        const captionFit = captionText
          ? tileLayout.measureFittedLine({
            textApi: textApi,
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

        fitOut.metrics[id] = {
          labelStyle: fitSupport.toStyle(captionFit && captionFit.px, htmlUtils),
          valueRowStyle: "",
          valueStyle: fitSupport.toStyle(measurement && measurement.fit ? measurement.fit.vPx : 0, htmlUtils),
          unitStyle: unitText ? fitSupport.toStyle(measurement && measurement.fit ? measurement.fit.uPx : 0, htmlUtils) : ""
        };
        fitOut.metricValues[id] = useFallback ? fallbackValueText : valueText;
      }

      return fitOut;
    }

    return {
      id: "EditRouteHtmlFit",
      compute: compute
    };
  }

  return { id: "EditRouteHtmlFit", create: create };
}));
