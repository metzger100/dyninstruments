/**
 * Module: EditRouteHtmlFitSupport - Shared fit helpers for edit-route HTML metrics and labels
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: HtmlMeasureUtils, HtmlWidgetUtils, ValueMath, NavModeRatio
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteHtmlFitSupport = factory(); }
}(this, function () {
  "use strict";

  const NAME_MAX_PX_RATIO = {
    flat: 0.5,
    normal: 0.66,
    high: 0.56
  };
  let toText;

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

  function isLineTrimmed(lineFit, sourceText) {
    if (!lineFit || typeof lineFit !== "object") {
      return false;
    }
    if (!Object.prototype.hasOwnProperty.call(lineFit, "text")) {
      return false;
    }
    return String(lineFit.text) !== toText(sourceText);
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

  function measureEditRouteStyle(args, htmlMeasureUtils, htmlUtils, tileLayout) {
    return htmlMeasureUtils.measureStyle(args, htmlUtils, tileLayout);
  }

  function create(def, componentContext) {
    const htmlMeasureUtils = componentContext.components.require("HtmlMeasureUtils");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const modeRatio = componentContext.components.require("NavModeRatio");
    toText = componentContext.components.require("ValueMath").toText;

    function measureEditRoutePx(args) {
      return htmlUtils.toFiniteNumber((measureLineFit(args) || {}).px) || 0;
    }

    function measureEditRouteStyleForArgs(args) {
      return measureEditRouteStyle(args, htmlMeasureUtils, htmlUtils, args && args.tileLayout);
    }

    return {
      id: "EditRouteHtmlFitSupport",
      resolveMetricLabel: resolveMetricLabel,
      resolveMetricValue: resolveMetricValue,
      resolveMetricPlainValue: resolveMetricPlainValue,
      resolveMetricUnit: resolveMetricUnit,
      measureLineFit: measureLineFit,
      measureEditRoutePx: measureEditRoutePx,
      isLineTrimmed: isLineTrimmed,
      selectMetricValue: selectMetricValue,
      resolveMetricPx: resolveMetricPx,
      measureEditRouteStyle: measureEditRouteStyleForArgs,
      resolveNamePxRatio: function resolveNamePxRatio(mode) {
        return modeRatio.resolve(mode, NAME_MAX_PX_RATIO);
      }
    };
  }

  return {
    id: "EditRouteHtmlFitSupport",
    create: create
  };
}));
