/**
 * @file AisTargetMarkup - Pure HTML assembly owner for AIS target renderer output
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetMarkup = factory();
  }
}(this, function () {
  "use strict";

  /** @type {DyniValueMathApi["toObject"]} */
  let toObject;
  /** @type {DyniValueMathApi["toText"]} */
  let toText;

  /**
   * @param {DyniAisTargetMetricRenderArgs} args
   * @returns {string}
   */
  function renderMetric(args) {
    const cfg = args;
    const metricId = cfg.metricId;
    const mode = cfg.mode;
    const metric = /** @type {DyniAisTargetMetricText} */ (toObject(cfg.metric));
    const metricFit = /** @type {DyniAisTargetMetricFit} */ (toObject(cfg.metricFit));
    const metricGeometry = /** @type {DyniAisTargetMetricGeometry} */ (toObject(cfg.metricGeometry));
    const htmlUtils = cfg.htmlUtils;
    const stableDigitsEnabled = cfg.stableDigitsEnabled === true;
    const valueClass = stableDigitsEnabled ? " dyni-tabular" : "";
    const valueText = toText(metricFit.valueText != null ? metricFit.valueText : metric.valueText);

    if (mode === "flat") {
      return ""
        + '<div class="dyni-ais-target-metric dyni-ais-target-metric-' + metricId + '"'
        + htmlUtils.toStyleAttr(metricGeometry.metricStyle)
        + ">"
        + '<div class="dyni-ais-target-metric-caption"'
        + htmlUtils.toStyleAttr(metricFit.captionStyle)
        + ">"
        + htmlUtils.escapeHtml(toText(metric.captionText))
        + "</div>"
        + '<div class="dyni-ais-target-metric-value' + valueClass + '"'
        + htmlUtils.toStyleAttr(metricFit.valueStyle)
        + ">"
        + htmlUtils.escapeHtml(valueText)
        + "</div>"
        + '<div class="dyni-ais-target-metric-unit"'
        + htmlUtils.toStyleAttr(metricFit.unitStyle)
        + ">"
        + htmlUtils.escapeHtml(toText(metric.unitText))
        + "</div>"
        + "</div>";
    }

    return ""
      + '<div class="dyni-ais-target-metric dyni-ais-target-metric-' + metricId + '"'
      + htmlUtils.toStyleAttr(metricGeometry.metricStyle)
      + ">"
      + '<div class="dyni-ais-target-metric-caption"'
      + htmlUtils.toStyleAttr(metricFit.captionStyle)
      + ">"
      + htmlUtils.escapeHtml(toText(metric.captionText))
      + "</div>"
      + '<div class="dyni-ais-target-metric-value-row"'
      + htmlUtils.toStyleAttr(htmlUtils.joinStyles(metricGeometry.valueRowStyle, metricFit.valueRowStyle))
      + ">"
      + '<span class="dyni-ais-target-metric-value-text' + valueClass + '"'
      + htmlUtils.toStyleAttr(metricFit.valueStyle)
      + ">"
      + htmlUtils.escapeHtml(valueText)
      + "</span>"
      + '<span class="dyni-ais-target-metric-unit"'
      + htmlUtils.toStyleAttr(metricFit.unitStyle)
      + ">"
      + htmlUtils.escapeHtml(toText(metric.unitText))
      + "</span>"
      + "</div>"
      + "</div>";
  }

  /**
   * @param {DyniAisTargetMarkupModel} model
   * @param {DyniAisTargetMarkupFit} fit
   * @param {DyniHtmlWidgetUtilsApi} htmlUtils
   * @returns {string}
   */
  function renderDataBody(model, fit, htmlUtils) {
    const metricIds = model.visibleMetricIds;
    const metrics = model.metrics;
    const metricFits = fit.metrics;
    const geometry = model.inlineGeometry;
    const metricGeometry = geometry.metricStyles;

    const identityHtml = ""
      + '<div class="dyni-ais-target-identity"'
      + htmlUtils.toStyleAttr(geometry.identityStyle)
      + ">"
      + '<div class="dyni-ais-target-name"'
      + htmlUtils.toStyleAttr(fit.nameStyle)
      + ">"
      + htmlUtils.escapeHtml(toText(model.nameText))
      + "</div>"
      + '<div class="dyni-ais-target-front"'
      + htmlUtils.toStyleAttr(fit.frontStyle)
      + ">"
      + htmlUtils.escapeHtml(toText(model.frontText))
      + "</div>"
      + "</div>";

    let metricsHtml = "";
    for (let i = 0; i < metricIds.length; i += 1) {
      const id = metricIds[i];
      metricsHtml += renderMetric({
        metricId: id,
        mode: model.mode,
        metric: metrics[id],
        metricFit: metricFits[id],
        metricGeometry: metricGeometry[id],
        stableDigitsEnabled: model.stableDigitsEnabled,
        htmlUtils: htmlUtils
      });
    }

    return ""
      + identityHtml
      + '<div class="dyni-ais-target-metrics"'
      + htmlUtils.toStyleAttr(geometry.metricsStyle)
      + ">"
      + metricsHtml
      + "</div>";
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniAisTargetMarkupApi}
   */
  function create(def, componentContext) {
    const stateScreenMarkup = componentContext.components.require("StateScreenMarkup");
    const valueMath = componentContext.components.require("ValueMath");
    toObject = valueMath.toObject;
    toText = valueMath.toText;

    /**
     * @param {DyniAisTargetMarkupRenderArgs} args
     * @returns {string}
     */
    function render(args) {
      const cfg = args;
      const model = cfg.model;
      const fit = cfg.fit;
      const htmlUtils = cfg.htmlUtils;
      const wrapperClasses = model.wrapperClasses;
      const geometry = model.inlineGeometry;
      if (model.kind && model.kind !== "data") {
        return stateScreenMarkup.renderStateScreen({
          kind: model.kind,
          label: toText(model.stateLabel),
          wrapperClasses: wrapperClasses,
          extraAttrs: 'data-dyni-action="ais-target-open"' + htmlUtils.toStyleAttr(htmlUtils.joinStyles(model.wrapperStyle, geometry.wrapperStyle)),
          htmlUtils: htmlUtils,
          shellRect: cfg.shellRect,
          fontFamily: cfg.fontFamily,
          fontWeight: cfg.fontWeight
        });
      }

      const hotspotHtml = model.showHotspot === true
        ? '<div class="dyni-ais-target-open-hotspot"></div>'
        : "";
      const accentHtml = model.hasAccent === true
        ? ('<div class="dyni-ais-target-state-accent"'
          + htmlUtils.toStyleAttr(htmlUtils.joinStyles(geometry.accentStyle, fit.accentStyle))
          + "></div>")
        : "";

      const bodyHtml = renderDataBody(model, fit, htmlUtils);

      return ""
        + '<div class="' + wrapperClasses.join(" ") + '"'
        + ' data-dyni-action="ais-target-open"'
        + htmlUtils.toStyleAttr(htmlUtils.joinStyles(model.wrapperStyle, geometry.wrapperStyle))
        + ">"
        + accentHtml
        + hotspotHtml
        + bodyHtml
        + "</div>";
    }

    return {
      id: "AisTargetMarkup",
      render: render
    };
  }

  return { id: "AisTargetMarkup", create: create };
}));
