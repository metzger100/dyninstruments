/**
 * Module: ActiveRouteHtmlFit - Shared text-fit model for ActiveRoute interactive HTML renderer
 * Documentation: documentation/widgets/active-route.md
 * Depends: ThemeResolver, RadialTextLayout, TextTileLayout, ActiveRouteLayout, HtmlWidgetUtils
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
  const MEASURE_CTX_KEY = "__dyniActiveRouteTextMeasureCtx";

  function parseFontPx(font) {
    const source = String(font || "");
    const match = source.match(/(\d+(?:\.\d+)?)px/);
    return match ? Number(match[1]) : 0;
  }

  function createApproximateMeasureContext() {
    return {
      font: "700 12px sans-serif",
      measureText: function (text) {
        const px = Math.max(1, parseFontPx(this.font) || 12);
        return { width: String(text).length * px * 0.56 };
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

  function tryCreateCanvasMeasureContext(ownerDocument) {
    if (!ownerDocument || typeof ownerDocument.createElement !== "function") {
      return null;
    }
    const canvas = ownerDocument.createElement("canvas");
    if (!canvas || typeof canvas.getContext !== "function") {
      return null;
    }
    try {
      return canvas.getContext("2d");
    }
    // dyni-lint-disable-next-line catch-fallback-without-suppression -- Canvas measurement context is a browser/jsdom boundary and may be unavailable.
    catch (error) {
      return null;
    }
  }

  function resolveMeasureContext(hostContext, ownerDocument) {
    const ctx = hostContext && typeof hostContext === "object" ? hostContext : null;
    if (ctx && ctx[MEASURE_CTX_KEY]) {
      return ctx[MEASURE_CTX_KEY];
    }
    const canvasMeasureCtx = tryCreateCanvasMeasureContext(ownerDocument);
    const measureCtx = canvasMeasureCtx || createApproximateMeasureContext();
    if (ctx) {
      ctx[MEASURE_CTX_KEY] = measureCtx;
    }
    return measureCtx;
  }

  function toFontSizeStyle(px, htmlUtils) {
    const n = htmlUtils.toFiniteNumber(px);
    if (!(n > 0)) {
      return "";
    }
    return "font-size:" + Math.max(1, Math.floor(n)) + "px;";
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
      { id: "remain", caption: model.remainCaption, value: model.remainText, unit: model.remainUnit },
      { id: "eta", caption: model.etaCaption, value: model.etaText, unit: model.etaUnit }
    ];
    if (model.isApproaching) {
      specs.push({
        id: "next",
        caption: model.nextCourseCaption,
        value: model.nextCourseText,
        unit: model.nextCourseUnit
      });
    }
    return specs;
  }

  function create(def, Helpers) {
    const theme = Helpers.getModule("ThemeResolver");
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);
    const radialText = Helpers.getModule("RadialTextLayout").create(def, Helpers);
    const tileLayout = Helpers.getModule("TextTileLayout").create(def, Helpers);
    const layoutApi = Helpers.getModule("ActiveRouteLayout").create(def, Helpers);

    function compute(args) {
      const cfg = args || {};
      const model = cfg.model || null;
      const shellRect = cfg.shellRect || null;
      const hostContext = cfg.hostContext || null;
      const targetEl = cfg.targetEl || null;
      if (!model || !shellRect || !targetEl) {
        return null;
      }

      const rootEl = Helpers.requirePluginRoot(targetEl);
      const tokens = theme.resolveForRoot(rootEl);
      const valueWeight = tokens.font.weight;
      const labelWeight = tokens.font.labelWeight;
      const family = tokens.font.family;
      const ownerDocument = resolveOwnerDocument(targetEl);
      const measureCtx = resolveMeasureContext(hostContext, ownerDocument);
      if (!measureCtx || typeof measureCtx.measureText !== "function") {
        return null;
      }

      const W = Math.max(1, Math.round(shellRect.width));
      const H = Math.max(1, Math.round(shellRect.height));
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
      const metricSpecs = buildMetricSpecs(model);
      for (let i = 0; i < metricSpecs.length; i += 1) {
        const metric = metricSpecs[i];
        const metricRect = layout.metricRects[metric.id];
        if (!metricRect) {
          continue;
        }
        const spacing = layoutApi.computeMetricTileSpacing(metricRect, layout.responsive);
        const measurement = tileLayout.measureMetricTile({
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
          captionHeightPx: spacing.captionHeightPx
        });
        const fit = measurement && measurement.fit ? measurement.fit : null;
        metricStyles[metric.id] = {
          valueStyle: toFontSizeStyle(fit && fit.vPx, htmlUtils),
          unitStyle: toFontSizeStyle(fit && fit.uPx, htmlUtils)
        };
      }

      return {
        routeNameStyle: toFontSizeStyle(nameFit && nameFit.px, htmlUtils),
        metrics: metricStyles
      };
    }

    return {
      id: "ActiveRouteHtmlFit",
      compute: compute
    };
  }

  return { id: "ActiveRouteHtmlFit", create: create };
}));
