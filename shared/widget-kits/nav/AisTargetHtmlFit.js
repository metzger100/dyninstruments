/**
 * Module: AisTargetHtmlFit - Text-fit and accent-style owner for AIS target HTML renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ThemeResolver, RadialTextLayout, TextTileLayout, AisTargetLayout, HtmlWidgetUtils, TextFitMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetHtmlFit = factory(); }
}(this, function () {
  "use strict";

  const MEASURE_CTX_KEY = "__dyniAisTargetTextMeasureCtx";
  const NAME_MAX_PX_RATIO = { flat: 0.52, normal: 0.78, high: 0.72 };
  const FRONT_MAX_PX_RATIO = { flat: 0.52, normal: 0.78, high: 0.75 };
  const METRIC_VALUE_MAX_PX_RATIO = 0.9;
  const METRIC_SECONDARY_TO_VALUE_RATIO = 0.8;
  function toObject(value) { return value && typeof value === "object" ? value : {}; }
  function toText(value) { return value == null ? "" : String(value); }
  function parseFontPx(font) {
    const source = String(font || "");
    const match = source.match(/(\d+(?:\.\d+)?)px/);
    return match ? Number(match[1]) : 12;
  }
  function createApproximateMeasureContext() {
    return {
      font: "700 12px sans-serif",
      measureText: function (text) {
        const px = Math.max(1, parseFontPx(this.font));
        return { width: String(text).length * px * 0.56 };
      }
    };
  }
  function resolveMeasureContext(hostContext, targetEl) {
    const ctxStore = hostContext && typeof hostContext === "object"
      ? hostContext
      : null;
    const cached = ctxStore ? ctxStore[MEASURE_CTX_KEY] : null;
    if (cached) {
      return cached;
    }

    let ownerDocument = null;
    if (targetEl && targetEl.ownerDocument) {
      ownerDocument = targetEl.ownerDocument;
    } else if (typeof document !== "undefined") {
      ownerDocument = document;
    }

    let canvasContext = null;
    if (ownerDocument && typeof ownerDocument.createElement === "function") {
      const probe = ownerDocument.createElement("canvas");
      if (probe && typeof probe.getContext === "function") {
        canvasContext = probe.getContext("2d");
      }
    }
    const resolved = canvasContext || createApproximateMeasureContext();
    if (ctxStore) {
      ctxStore[MEASURE_CTX_KEY] = resolved;
    }
    return resolved;
  }
  function resolveThemeTypography(Helpers, themeApi, targetEl) {
    const rootEl = Helpers.requirePluginRoot(targetEl);
    const tokens = themeApi.resolveForRoot(rootEl);
    return {
      tokens: tokens,
      family: tokens.font.family
    };
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
    if (!rect || !(rect.w > 0) || !(rect.h > 0)) {
      return 0;
    }
    if (!cfg.text) {
      return 0;
    }
    const explicitMaxPx = htmlUtils.toFiniteNumber(cfg.maxPx);
    const requestedMaxPx = explicitMaxPx > 0
      ? explicitMaxPx
      : Math.max(1, Math.floor(rect.h * cfg.maxPxRatio));
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
    return htmlUtils.toFiniteNumber(fit && fit.px) || 0;
  }
  function measureStyle(args, htmlUtils, tileLayout) { return toStyle(measurePx(args, htmlUtils, tileLayout), htmlUtils); }
  function resolveAccentStyle(model, tokens) {
    if (!model || model.hasAccent !== true) {
      return "";
    }
    const colorRole = model.colorRole;
    const aisTokens = tokens && tokens.colors && tokens.colors.ais ? tokens.colors.ais : null;
    const color = aisTokens && typeof aisTokens[colorRole] === "string"
      ? aisTokens[colorRole].trim()
      : "";
    if (!color) {
      return "";
    }
    return "background-color:" + color + ";";
  }
  function resolveNameRatio(mode) {
    if (mode === "flat") {
      return NAME_MAX_PX_RATIO.flat;
    }
    if (mode === "high") {
      return NAME_MAX_PX_RATIO.high;
    }
    return NAME_MAX_PX_RATIO.normal;
  }
  function resolveFrontRatio(mode) {
    if (mode === "flat") {
      return FRONT_MAX_PX_RATIO.flat;
    }
    if (mode === "high") {
      return FRONT_MAX_PX_RATIO.high;
    }
    return FRONT_MAX_PX_RATIO.normal;
  }
  function resolveStackedMetricBox(box) {
    const tile = box && typeof box === "object" ? box : null;
    if (!tile || !tile.captionRect || !tile.valueRect || !tile.unitRect) {
      return null;
    }
    return {
      captionRect: tile.captionRect,
      valueRect: tile.valueRect,
      unitRect: tile.unitRect
    };
  }
  function resolveInlineMetricBox(box) {
    const tile = box && typeof box === "object" ? box : null;
    if (!tile || !tile.labelRect || !tile.valueRect || !tile.unitRect) {
      return null;
    }
    return {
      labelRect: tile.labelRect,
      valueRect: tile.valueRect,
      valueTextRect: tile.valueTextRect || tile.valueRect,
      unitRect: tile.unitRect
    };
  }
  function create(def, Helpers) {
    const theme = Helpers.getModule("ThemeResolver");
    const textApi = Helpers.getModule("RadialTextLayout").create(def, Helpers);
    const tileLayout = Helpers.getModule("TextTileLayout").create(def, Helpers);
    const layoutApi = Helpers.getModule("AisTargetLayout").create(def, Helpers);
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);
    const fitMath = Helpers.getModule("TextFitMath").create(def, Helpers);
    function compute(args) {
      const cfg = args || {};
      const model = cfg.model || null;
      const shellRect = cfg.shellRect || null;
      const targetEl = cfg.targetEl || null;
      if (!model || !shellRect || !targetEl) {
        return null;
      }
      const typography = resolveThemeTypography(Helpers, theme, targetEl);
      const measureCtx = resolveMeasureContext(cfg.hostContext, targetEl);
      if (!measureCtx || typeof measureCtx.measureText !== "function") {
        return null;
      }
      const tokens = typography.tokens;
      const family = typography.family;
      const shellWidth = Math.max(1, Math.round(shellRect.width));
      const shellHeight = Math.max(1, Math.round(shellRect.height));
      const kind = typeof model.kind === "string" ? model.kind : "data";
      const layout = model.layout || layoutApi.computeLayout({
        W: shellWidth,
        H: shellHeight,
        mode: model.mode,
        renderState: kind === "data" ? "data" : "placeholder",
        showTcpaBranch: model.showTcpaBranch === true,
        isVerticalCommitted: model.isVerticalCommitted === true,
        effectiveLayoutHeight: model.effectiveLayoutHeight
      });
      const valueWeight = tokens.font.weight;
      const labelWeight = tokens.font.labelWeight;
      const textFillScale = layout.responsive && layout.responsive.textFillScale;
      const out = {
        nameStyle: "",
        frontStyle: "",
        placeholderStyle: "",
        metrics: Object.create(null),
        accentStyle: resolveAccentStyle(model, tokens)
      };
      if (kind !== "data") {
        return out;
      }
      out.nameStyle = measureStyle({
        rect: layout.nameRect,
        text: toText(model.nameText),
        maxPxRatio: resolveNameRatio(layout.mode),
        textApi: textApi,
        tileLayout: tileLayout,
        ctx: measureCtx,
        family: family,
        weight: valueWeight,
        textFillScale: textFillScale
      }, htmlUtils, tileLayout);
      out.frontStyle = measureStyle({
        rect: layout.frontRect,
        text: toText(model.frontText),
        maxPxRatio: resolveFrontRatio(layout.mode),
        textApi: textApi,
        tileLayout: tileLayout,
        ctx: measureCtx,
        family: family,
        weight: labelWeight,
        textFillScale: textFillScale
      }, htmlUtils, tileLayout);
      const metricIds = model.visibleMetricIds;
      const metrics = toObject(model.metrics);
      const isFlatMode = layout.mode === "flat";
      for (let i = 0; i < metricIds.length; i += 1) {
        const id = metricIds[i];
        const metric = toObject(metrics[id]);
        if (isFlatMode) {
          const flatRects = resolveStackedMetricBox(layout.metricBoxes[id]);
          if (!flatRects) {
            continue;
          }

          const flatValuePx = measurePx({
            rect: flatRects.valueRect,
            text: toText(metric.valueText),
            maxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
            textApi: textApi,
            tileLayout: tileLayout,
            ctx: measureCtx,
            family: family,
            weight: valueWeight,
            textFillScale: textFillScale
          }, htmlUtils, tileLayout);
          const flatSecondaryMaxPx = fitMath.resolveSecondaryMaxPx({
            valuePx: flatValuePx,
            valueRect: flatRects.valueRect,
            valueMaxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
            secondaryToValueRatio: METRIC_SECONDARY_TO_VALUE_RATIO
          });

          out.metrics[id] = {
            captionStyle: measureStyle({
              rect: flatRects.captionRect,
              text: toText(metric.captionText),
              maxPx: flatSecondaryMaxPx,
              maxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
              textApi: textApi,
              tileLayout: tileLayout,
              ctx: measureCtx,
              family: family,
              weight: labelWeight,
              textFillScale: 1
            }, htmlUtils, tileLayout),
            valueRowStyle: "",
            valueStyle: toStyle(flatValuePx, htmlUtils),
            unitStyle: measureStyle({
              rect: flatRects.unitRect,
              text: toText(metric.unitText),
              maxPx: flatSecondaryMaxPx,
              maxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
              textApi: textApi,
              tileLayout: tileLayout,
              ctx: measureCtx,
              family: family,
              weight: labelWeight,
              textFillScale: 1
            }, htmlUtils, tileLayout)
          };
          continue;
        }

        const inlineRects = resolveInlineMetricBox(layout.metricBoxes[id]);
        if (!inlineRects) {
          continue;
        }

        const inlineValueRect = inlineRects.valueTextRect || inlineRects.valueRect;
        const inlineValuePx = measurePx({
          rect: inlineValueRect,
          text: toText(metric.valueText),
          maxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
          textApi: textApi,
          tileLayout: tileLayout,
          ctx: measureCtx,
          family: family,
          weight: valueWeight,
          textFillScale: textFillScale
        }, htmlUtils, tileLayout);
        const inlineSecondaryMaxPx = fitMath.resolveSecondaryMaxPx({
          valuePx: inlineValuePx,
          valueRect: inlineValueRect,
          valueMaxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
          secondaryToValueRatio: METRIC_SECONDARY_TO_VALUE_RATIO
        });

        out.metrics[id] = {
          captionStyle: measureStyle({
            rect: inlineRects.labelRect,
            text: toText(metric.captionText),
            maxPx: inlineSecondaryMaxPx,
            maxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
            textApi: textApi,
            tileLayout: tileLayout,
            ctx: measureCtx,
            family: family,
            weight: labelWeight,
            textFillScale: 1
          }, htmlUtils, tileLayout),
          valueRowStyle: "",
          valueStyle: toStyle(inlineValuePx, htmlUtils),
          unitStyle: measureStyle({
            rect: inlineRects.unitRect,
            text: toText(metric.unitText),
            maxPx: inlineSecondaryMaxPx,
            maxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
            textApi: textApi,
            tileLayout: tileLayout,
            ctx: measureCtx,
            family: family,
            weight: labelWeight,
            textFillScale: 1
          }, htmlUtils, tileLayout)
        };
      }

      return out;
    }
    return {
      id: "AisTargetHtmlFit",
      compute: compute
    };
  }
  return { id: "AisTargetHtmlFit", create: create };
}));
