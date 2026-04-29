/**
 * Module: EditRouteHtmlFitSupport - Shared fit helpers for edit-route HTML metrics and labels
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteHtmlFitSupport = factory(); }
}(this, function () {
  "use strict";

  const MEASURE_CTX_KEY = "__dyniEditRouteTextMeasureCtx";
  const NAME_MAX_PX_RATIO = {
    flat: 0.5,
    normal: 0.66,
    high: 0.56
  };

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

  function resolveMetricPlainValue(model, id) {
    const entry = toMetricEntry(model, id);
    if (entry.plainValueText != null) {
      return toText(entry.plainValueText);
    }
    if (entry.plainValue != null) {
      return toText(entry.plainValue);
    }
    if (model && model[id + "PlainValueText"] != null) {
      return toText(model[id + "PlainValueText"]);
    }
    if (model && model[id + "PlainValue"] != null) {
      return toText(model[id + "PlainValue"]);
    }
    return resolveMetricValue(model, id);
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

  function measureLineFit(args) {
    const cfg = args || {};
    const rect = cfg.rect;
    if (!cfg.text) {
      return null;
    }
    if (!rect || !(rect.w > 0) || !(rect.h > 0)) {
      return null;
    }
    const explicitMaxPx = cfg.htmlUtils.toFiniteNumber(cfg.maxPx);
    const ratio = cfg.htmlUtils.toFiniteNumber(cfg.maxPxRatio);
    const ratioMaxPx = Math.max(1, Math.floor(rect.h * (ratio > 0 ? ratio : 1)));
    const requestedMaxPx = explicitMaxPx > 0 ? explicitMaxPx : ratioMaxPx;
    return cfg.tileLayout.measureFittedLine({
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
  }

  function measurePx(args) {
    const cfg = args || {};
    const fit = measureLineFit(cfg);
    return cfg.htmlUtils.toFiniteNumber(fit && fit.px) || 0;
  }

  function isLineTrimmed(lineFit, sourceText) {
    if (!lineFit || typeof lineFit !== "object") {
      return false;
    }
    if (!Object.prototype.hasOwnProperty.call(lineFit, "text")) {
      return false;
    }
    return String(lineFit.text) !== toText(sourceText);
  }

  function resolveMetricValueFamily(model, tokens) {
    const font = tokens && tokens.font ? tokens.font : {};
    if (model && model.stableDigitsEnabled === true) {
      return font.familyMono || font.family || "";
    }
    return font.family || "";
  }

  function selectMetricValue(args) {
    const cfg = args || {};
    const primaryText = toText(cfg.primaryText);
    const plainText = toText(cfg.plainText);
    const primaryFit = measureLineFit({
      rect: cfg.rect,
      text: primaryText,
      maxPxRatio: cfg.maxPxRatio,
      textApi: cfg.textApi,
      tileLayout: cfg.tileLayout,
      ctx: cfg.ctx,
      family: cfg.valueFamily,
      weight: cfg.valueWeight,
      textFillScale: cfg.textFillScale,
      htmlUtils: cfg.htmlUtils
    });
    const usePlain = cfg.stableDigitsEnabled === true &&
      plainText &&
      plainText !== primaryText &&
      isLineTrimmed(primaryFit, primaryText);
    if (!usePlain) {
      return {
        text: primaryText,
        fit: primaryFit
      };
    }
    return {
      text: plainText,
      fit: measureLineFit({
        rect: cfg.rect,
        text: plainText,
        maxPxRatio: cfg.maxPxRatio,
        textApi: cfg.textApi,
        tileLayout: cfg.tileLayout,
        ctx: cfg.ctx,
        family: cfg.valueFamily,
        weight: cfg.valueWeight,
        textFillScale: cfg.textFillScale,
        htmlUtils: cfg.htmlUtils
      })
    };
  }

  function resolveMetricPx(lineFit, htmlUtils) {
    return htmlUtils.toFiniteNumber(lineFit && lineFit.px) || 0;
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

  function create() {
    return {
      id: "EditRouteHtmlFitSupport",
      resolveMeasureContext: resolveMeasureContext,
      toStyle: toStyle,
      toText: toText,
      resolveMetricLabel: resolveMetricLabel,
      resolveMetricValue: resolveMetricValue,
      resolveMetricPlainValue: resolveMetricPlainValue,
      resolveMetricUnit: resolveMetricUnit,
      measureLineFit: measureLineFit,
      measurePx: measurePx,
      isLineTrimmed: isLineTrimmed,
      resolveMetricValueFamily: resolveMetricValueFamily,
      selectMetricValue: selectMetricValue,
      resolveMetricPx: resolveMetricPx,
      measureStyle: measureStyle,
      resolveNamePxRatio: resolveNamePxRatio
    };
  }

  return {
    id: "EditRouteHtmlFitSupport",
    create: create
  };
}));
