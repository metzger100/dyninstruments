/**
 * @file EditRouteHtmlFitSupport - Shared fit helpers for edit-route HTML metrics and labels
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteHtmlFitSupport = factory();
  }
})(this, function () {
  "use strict";

  const NAME_MAX_PX_RATIO = {
    flat: 0.5,
    normal: 0.66,
    high: 0.56
  };
  /** @type {DyniValueMathApi["toText"]} */
  let toText;
  /** @type {DyniValueMathApi["isNullish"]} */
  let isNullish;

  /**
   * @param {DyniEditRouteMetricModel | null | undefined} model
   * @param {string} id
   * @returns {DyniEditRouteMetricEntry}
   */
  function toMetricEntry(model, id) {
    const m = model && typeof model === "object" ? model : /** @type {DyniEditRouteMetricModel} */ ({});
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

  /**
   * @param {DyniEditRouteMetricModel | null | undefined} model
   * @param {string} id
   * @returns {string}
   */
  function resolveMetricLabel(model, id) {
    const entry = toMetricEntry(model, id);
    if (!isNullish(entry.labelText)) {
      return toText(entry.labelText);
    }
    if (!isNullish(entry.label)) {
      return toText(entry.label);
    }
    if (model && !isNullish(model[id + "LabelText"])) {
      return toText(model[id + "LabelText"]);
    }
    if (model && !isNullish(model[id + "Label"])) {
      return toText(model[id + "Label"]);
    }
    return "";
  }

  /**
   * @param {DyniEditRouteMetricModel | null | undefined} model
   * @param {string} id
   * @returns {string}
   */
  function resolveMetricValue(model, id) {
    const entry = toMetricEntry(model, id);
    if (!isNullish(entry.valueText)) {
      return toText(entry.valueText);
    }
    if (!isNullish(entry.value)) {
      return toText(entry.value);
    }
    if (model && !isNullish(model[id + "ValueText"])) {
      return toText(model[id + "ValueText"]);
    }
    if (model && !isNullish(model[id + "Value"])) {
      return toText(model[id + "Value"]);
    }
    return "";
  }

  /**
   * @param {DyniEditRouteMetricModel | null | undefined} model
   * @param {string} id
   * @returns {string}
   */
  function resolveMetricPlainValue(model, id) {
    const entry = toMetricEntry(model, id);
    if (!isNullish(entry.plainValueText)) {
      return toText(entry.plainValueText);
    }
    if (!isNullish(entry.plainValue)) {
      return toText(entry.plainValue);
    }
    if (model && !isNullish(model[id + "PlainValueText"])) {
      return toText(model[id + "PlainValueText"]);
    }
    if (model && !isNullish(model[id + "PlainValue"])) {
      return toText(model[id + "PlainValue"]);
    }
    return resolveMetricValue(model, id);
  }

  /**
   * @param {DyniEditRouteMetricModel | null | undefined} model
   * @param {string} id
   * @returns {string}
   */
  function resolveMetricUnit(model, id) {
    const entry = toMetricEntry(model, id);
    if (!isNullish(entry.unitText)) {
      return toText(entry.unitText);
    }
    if (!isNullish(entry.unit)) {
      return toText(entry.unit);
    }
    if (model && !isNullish(model[id + "UnitText"])) {
      return toText(model[id + "UnitText"]);
    }
    if (model && !isNullish(model[id + "Unit"])) {
      return toText(model[id + "Unit"]);
    }
    return "";
  }

  /**
   * @param {DyniEditRouteMeasureLineArgs | null | undefined} args
   * @returns {DyniEditRouteLineFit | null}
   */
  function measureLineFit(args) {
    const cfg = /** @type {DyniEditRouteMeasureLineArgs} */ (args || {});
    const rect = cfg.rect;
    if (!cfg.text) {
      return null;
    }
    if (!rect || !(rect.w > 0) || !(rect.h > 0)) {
      return null;
    }
    const explicitMaxPx = /** @type {number} */ (cfg.htmlUtils.toFiniteNumber(cfg.maxPx));
    const ratio = /** @type {number} */ (cfg.htmlUtils.toFiniteNumber(cfg.maxPxRatio));
    const ratioMaxPx = Math.max(1, Math.floor(rect.h * (ratio > 0 ? ratio : 1)));
    const requestedMaxPx = explicitMaxPx > 0 ? explicitMaxPx : ratioMaxPx;
    return /** @type {DyniEditRouteLineFit | null} */ (
      cfg.tileLayout.measureFittedLine({
        textApi: cfg.textApi,
        ctx: cfg.ctx,
        text: cfg.text,
        maxW: Math.max(1, Math.floor(rect.w)),
        maxH: Math.max(1, Math.floor(rect.h)),
        maxPx: Math.max(1, Math.floor(requestedMaxPx)),
        textFillScale: cfg.textFillScale,
        family: cfg.family,
        weight: cfg.weight
      })
    );
  }

  /**
   * @param {DyniEditRouteLineFit | null | undefined} lineFit
   * @param {unknown} sourceText
   * @returns {boolean}
   */
  function isLineTrimmed(lineFit, sourceText) {
    if (!lineFit || typeof lineFit !== "object") {
      return false;
    }
    if (!Object.prototype.hasOwnProperty.call(lineFit, "text")) {
      return false;
    }
    return String(lineFit.text) !== toText(sourceText);
  }

  /**
   * @param {DyniEditRouteMetricValueSelectArgs | null | undefined} args
   * @returns {DyniEditRouteMetricValueSelection}
   */
  function selectMetricValue(args) {
    const cfg = /** @type {DyniEditRouteMetricValueSelectArgs} */ (args || {});
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
    const usePlain =
      cfg.stableDigitsEnabled === true &&
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

  /**
   * @param {DyniEditRouteLineFit | null | undefined} lineFit
   * @param {DyniHtmlWidgetUtilsApi} htmlUtils
   * @returns {number}
   */
  function resolveMetricPx(lineFit, htmlUtils) {
    return htmlUtils.toFiniteNumber(lineFit && lineFit.px) || 0;
  }

  /**
   * @param {DyniEditRouteMeasureLineArgs | null | undefined} args
   * @param {DyniHtmlMeasureUtilsApi} htmlMeasureUtils
   * @param {DyniHtmlWidgetUtilsApi} htmlUtils
   * @param {DyniTextTileLayoutApi} tileLayout
   * @returns {string}
   */
  function measureEditRouteStyle(args, htmlMeasureUtils, htmlUtils, tileLayout) {
    return htmlMeasureUtils.measureStyle(args, htmlUtils, tileLayout);
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniEditRouteHtmlFitSupportApi}
   */
  function create(def, componentContext) {
    const htmlMeasureUtils = componentContext.components.require("HtmlMeasureUtils");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const modeRatio = componentContext.components.require("NavModeRatio");
    const valueMath = componentContext.components.require("ValueMath");
    toText = valueMath.toText;
    isNullish = valueMath.isNullish;

    /** @param {DyniEditRouteMeasureLineArgs | null | undefined} args @returns {number} */
    function measureEditRoutePx(args) {
      return htmlUtils.toFiniteNumber((measureLineFit(args) || {}).px) || 0;
    }

    /** @param {DyniEditRouteMeasureLineArgs | null | undefined} args @returns {string} */
    function measureEditRouteStyleForArgs(args) {
      return measureEditRouteStyle(
        args,
        htmlMeasureUtils,
        htmlUtils,
        /** @type {DyniTextTileLayoutApi} */ (args && args.tileLayout)
      );
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
});
