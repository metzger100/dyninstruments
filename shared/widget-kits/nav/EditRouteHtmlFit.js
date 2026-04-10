/**
 * Module: EditRouteHtmlFit - Per-box text-fit owner for edit-route HTML renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ThemeResolver, RadialTextLayout, TextTileLayout, EditRouteLayout, HtmlWidgetUtils, TextFitMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteHtmlFit = factory(); }
}(this, function () {
  "use strict";

  const MEASURE_CTX_KEY = "__dyniEditRouteTextMeasureCtx";
  const NAME_MAX_PX_RATIO = {
    flat: 0.5,
    normal: 0.66,
    high: 0.56
  };
  const SOURCE_BADGE_MAX_PX_RATIO = 0.7;
  const METRIC_VALUE_MAX_PX_RATIO = 0.9;
  const METRIC_SECONDARY_TO_VALUE_RATIO = 0.8;
  const METRIC_IDS = ["pts", "dst", "rte", "eta"];

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
    const ctxStore = hostContext && typeof hostContext === "object" ? hostContext : null;
    if (ctxStore && ctxStore[MEASURE_CTX_KEY]) {
      return ctxStore[MEASURE_CTX_KEY];
    }

    const ownerDocument = targetEl && targetEl.ownerDocument
      ? targetEl.ownerDocument
      : (typeof document !== "undefined" ? document : null);
    let measureCtx = null;
    if (ownerDocument && typeof ownerDocument.createElement === "function") {
      const canvas = ownerDocument.createElement("canvas");
      if (canvas && typeof canvas.getContext === "function") {
        measureCtx = canvas.getContext("2d");
      }
    }

    const resolved = measureCtx || createApproximateMeasureContext();
    if (ctxStore) {
      ctxStore[MEASURE_CTX_KEY] = resolved;
    }
    return resolved;
  }

  function toStyle(px, htmlUtils) {
    const n = htmlUtils.toFiniteNumber(px);
    if (!(n > 0)) {
      return "";
    }
    return "font-size:" + Math.max(1, Math.floor(n)) + "px;";
  }

  function toText(value) {
    return value == null ? "" : String(value);
  }

  function toMetricEntry(model, id) {
    const m = model && typeof model === "object" ? model : {};
    const groups = [m.metrics, m.metricTexts];
    for (let i = 0; i < groups.length; i += 1) {
      const group = groups[i];
      if (!group || typeof group !== "object" || !(id in group)) {
        continue;
      }
      const entry = group[id];
      if (entry && typeof entry === "object") {
        return entry;
      }
    }
    return {};
  }

  function resolveMetricLabel(model, id) {
    const entry = toMetricEntry(model, id);
    if (entry.labelText != null) {
      return toText(entry.labelText);
    }
    if (entry.label != null) {
      return toText(entry.label);
    }
    if (model && model[id + "LabelText"] != null) {
      return toText(model[id + "LabelText"]);
    }
    if (model && model[id + "Label"] != null) {
      return toText(model[id + "Label"]);
    }
    return "";
  }

  function resolveMetricValue(model, id) {
    const entry = toMetricEntry(model, id);
    if (entry.valueText != null) {
      return toText(entry.valueText);
    }
    if (entry.value != null) {
      return toText(entry.value);
    }
    if (model && model[id + "ValueText"] != null) {
      return toText(model[id + "ValueText"]);
    }
    if (model && model[id + "Value"] != null) {
      return toText(model[id + "Value"]);
    }
    return "";
  }

  function resolveMetricUnit(model, id) {
    const entry = toMetricEntry(model, id);
    if (entry.unitText != null) {
      return toText(entry.unitText);
    }
    if (entry.unit != null) {
      return toText(entry.unit);
    }
    if (model && model[id + "UnitText"] != null) {
      return toText(model[id + "UnitText"]);
    }
    if (model && model[id + "Unit"] != null) {
      return toText(model[id + "Unit"]);
    }
    return "";
  }

  function measurePx(args) {
    const cfg = args || {};
    const rect = cfg.rect;
    if (!cfg.text) {
      return 0;
    }
    if (!rect || !(rect.w > 0) || !(rect.h > 0)) {
      return 0;
    }
    const explicitMaxPx = cfg.htmlUtils.toFiniteNumber(cfg.maxPx);
    const ratio = cfg.htmlUtils.toFiniteNumber(cfg.maxPxRatio);
    const ratioMaxPx = Math.max(1, Math.floor(rect.h * (ratio > 0 ? ratio : 1)));
    const requestedMaxPx = explicitMaxPx > 0 ? explicitMaxPx : ratioMaxPx;
    const fit = cfg.tileLayout.measureFittedLine({
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
    return cfg.htmlUtils.toFiniteNumber(fit && fit.px) || 0;
  }

  function measureStyle(args) {
    const px = measurePx(args);
    return toStyle(px, args && args.htmlUtils);
  }

  function resolveNamePxRatio(mode) {
    if (mode === "flat") {
      return NAME_MAX_PX_RATIO.flat;
    }
    if (mode === "high") {
      return NAME_MAX_PX_RATIO.high;
    }
    return NAME_MAX_PX_RATIO.normal;
  }

  function create(def, Helpers) {
    const theme = Helpers.getModule("ThemeResolver");
    const textApi = Helpers.getModule("RadialTextLayout").create(def, Helpers);
    const tileLayout = Helpers.getModule("TextTileLayout").create(def, Helpers);
    const layoutApi = Helpers.getModule("EditRouteLayout").create(def, Helpers);
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

      const rootEl = Helpers.resolveWidgetRoot(targetEl) || targetEl;
      const tokens = theme.resolveForRoot(rootEl);
      const family = Helpers.resolveFontFamily(targetEl);
      const measureCtx = resolveMeasureContext(cfg.hostContext, targetEl);
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
      const fitOut = {
        nameTextStyle: measureStyle({
          rect: layout.nameTextRect,
          text: toText(model.nameText != null ? model.nameText : model.routeNameText),
          maxPxRatio: resolveNamePxRatio(layout.mode),
          textApi: textApi,
          tileLayout: tileLayout,
          ctx: measureCtx,
          family: family,
          weight: valueWeight,
          textFillScale: textFillScale,
          htmlUtils: htmlUtils
        }),
        sourceBadgeStyle: "",
        metrics: Object.create(null)
      };

      if (layout.sourceBadgeRect) {
        fitOut.sourceBadgeStyle = measureStyle({
          rect: layout.sourceBadgeRect,
          text: toText(model.sourceBadgeText),
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
        const valueRect = box.valueTextRect || box.valueRect;
        const labelText = resolveMetricLabel(model, id);
        const valueText = resolveMetricValue(model, id);
        const unitText = resolveMetricUnit(model, id);
        const valuePx = measurePx({
          rect: valueRect,
          text: valueText,
          maxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
          textApi: textApi,
          tileLayout: tileLayout,
          ctx: measureCtx,
          family: family,
          weight: valueWeight,
          textFillScale: textFillScale,
          htmlUtils: htmlUtils
        });
        const secondaryMaxPx = fitMath.resolveSecondaryMaxPx({
          valuePx: valuePx,
          valueRect: valueRect,
          valueMaxPxRatio: METRIC_VALUE_MAX_PX_RATIO,
          secondaryToValueRatio: METRIC_SECONDARY_TO_VALUE_RATIO
        });

        fitOut.metrics[id] = {
          labelStyle: measureStyle({
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
          valueStyle: toStyle(valuePx, htmlUtils),
          unitStyle: box.unitRect ? measureStyle({
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
