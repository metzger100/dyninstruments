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
  const NAME_MAX_PX_RATIO = { flat: 0.52, normal: 0.62, high: 0.52 };
  const FRONT_MAX_PX_RATIO = { flat: 0.52, normal: 0.56, high: 0.48 };
  const METRIC_VALUE_MAX_PX_RATIO = 0.9;
  const METRIC_SECONDARY_TO_VALUE_RATIO = 0.76;

  function toObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function toText(value) {
    return value == null ? "" : String(value);
  }

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

  function resolveRootElement(Helpers, targetEl) {
    const candidate = Helpers.resolveWidgetRoot(targetEl);
    return candidate || targetEl;
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

  function measureStyle(args, htmlUtils, tileLayout) {
    return toStyle(measurePx(args, htmlUtils, tileLayout), htmlUtils);
  }

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

  function resolveMetricRects(box, mode) {
    const tile = box && typeof box === "object" ? box : null;
    if (!tile) {
      return null;
    }

    if (mode === "high") {
      return {
        labelRect: tile.labelRect || tile.captionRect || tile,
        valueRect: tile.valueRect || tile.valueTextRect || tile,
        unitRect: tile.unitRect || tile.valueRect || tile,
        valueRowRect: tile.valueRect || tile.valueRowRect || tile
      };
    }

    return {
      labelRect: tile.captionRect || tile.labelRect || tile,
      valueRect: tile.valueTextRect || tile.valueRect || tile,
      unitRect: tile.unitRect || tile.valueTextRect || tile,
      valueRowRect: tile.valueRowRect || tile.valueRect || tile
    };
  }

  function create(def, Helpers) {
    const theme = Helpers.getModule("ThemeResolver").create(def, Helpers);
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

      const rootEl = resolveRootElement(Helpers, targetEl);
      const tokens = theme.resolveForRoot(rootEl);
      const family = Helpers.resolveFontFamily(targetEl);
      const measureCtx = resolveMeasureContext(cfg.hostContext, targetEl);
      if (!measureCtx || typeof measureCtx.measureText !== "function") {
        return null;
      }

      const shellWidth = Math.max(1, Math.round(shellRect.width));
      const shellHeight = Math.max(1, Math.round(shellRect.height));
      const layout = model.layout || layoutApi.computeLayout({
        W: shellWidth,
        H: shellHeight,
        mode: model.mode,
        renderState: model.renderState,
        showTcpaBranch: model.showTcpaBranch === true,
        isVerticalCommitted: model.isVerticalCommitted === true,
        effectiveLayoutHeight: model.effectiveLayoutHeight
      });
      const valueWeight = tokens.font.weight;
      const labelWeight = tokens.font.labelWeight;
      const textFillScale = layout.responsive && layout.responsive.textFillScale;

      const out = {
        frontInitialStyle: "",
        nameStyle: "",
        frontStyle: "",
        placeholderStyle: "",
        metrics: Object.create(null),
        accentStyle: resolveAccentStyle(model, tokens)
      };

      if (model.renderState === "placeholder") {
        out.placeholderStyle = measureStyle({
          rect: layout.placeholderRect,
          text: toText(model.placeholderText),
          maxPxRatio: 0.34,
          textApi: textApi,
          tileLayout: tileLayout,
          ctx: measureCtx,
          family: family,
          weight: valueWeight,
          textFillScale: textFillScale
        }, htmlUtils, tileLayout);
        return out;
      }

      if (model.renderState !== "data") {
        return out;
      }

      out.nameStyle = measureStyle({
        rect: layout.nameRect,
        text: toText(model.nameText),
        maxPxRatio: resolveNameRatio(model.mode),
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
        maxPxRatio: resolveFrontRatio(model.mode),
        textApi: textApi,
        tileLayout: tileLayout,
        ctx: measureCtx,
        family: family,
        weight: labelWeight,
        textFillScale: textFillScale
      }, htmlUtils, tileLayout);

      const metricIds = model.visibleMetricIds;
      const metrics = toObject(model.metrics);
      for (let i = 0; i < metricIds.length; i += 1) {
        const id = metricIds[i];
        const rects = resolveMetricRects(layout.metricBoxes[id], model.mode);
        const metric = toObject(metrics[id]);
        if (!rects) {
          continue;
        }

        const valuePx = measurePx({
          rect: rects.valueRect,
          text: toText(metric.valueText),
          maxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
          textApi: textApi,
          tileLayout: tileLayout,
          ctx: measureCtx,
          family: family,
          weight: valueWeight,
          textFillScale: textFillScale
        }, htmlUtils, tileLayout);
        const secondaryMaxPx = fitMath.resolveSecondaryMaxPx({
          valuePx: valuePx,
          valueRect: rects.valueRect,
          valueMaxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
          secondaryToValueRatio: METRIC_SECONDARY_TO_VALUE_RATIO
        });

        out.metrics[id] = {
          captionStyle: measureStyle({
            rect: rects.labelRect,
            text: toText(metric.captionText),
            maxPx: secondaryMaxPx,
            maxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
            textApi: textApi,
            tileLayout: tileLayout,
            ctx: measureCtx,
            family: family,
            weight: labelWeight,
            textFillScale: 1
          }, htmlUtils, tileLayout),
          valueRowStyle: "",
          valueTextStyle: toStyle(valuePx, htmlUtils),
          valueStyle: toStyle(valuePx, htmlUtils),
          unitStyle: measureStyle({
            rect: rects.unitRect,
            text: toText(metric.unitText),
            maxPx: secondaryMaxPx,
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
