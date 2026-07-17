/**
 * @file EditRouteMarkup - Pure HTML assembly owner for edit-route renderer output
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteMarkup = factory();
  }
}(this, function () {
  "use strict";

  const METRIC_IDS = ["pts", "dst", "rte", "rteEta"];
  /** @type {DyniValueMathApi["toObject"]} */
  let toObject;
  /** @type {DyniValueMathApi["toText"]} */
  let toText;

  /**
   * @param {DyniEditRouteMetricText} metric
   * @param {unknown} unitText
   * @returns {boolean}
   */
  function hasMetricUnit(metric, unitText) {
    if (metric && metric.hasUnit === true) {
      return true;
    }
    return String(unitText || "").trim().length > 0;
  }

  /**
   * @param {unknown} mode
   * @param {string} metricId
   * @param {DyniEditRouteMetricText} metric
   * @param {unknown} unitText
   * @returns {boolean}
   */
  function shouldRenderUnitNode(mode, metricId, metric, unitText) {
    if (!hasMetricUnit(metric, unitText)) {
      return false;
    }
    if (mode === "flat") {
      return metricId === "dst" || metricId === "rte";
    }
    return true;
  }

  /**
   * @param {DyniEditRouteMarkupModel} model
   * @param {DyniEditRouteMarkupFit} fit
   * @param {string} metricId
   * @param {DyniHtmlWidgetUtilsApi} htmlUtils
   * @returns {string}
   */
  function renderMetric(model, fit, metricId, htmlUtils) {
    const metrics = /** @type {Record<string, DyniEditRouteMetricText>} */ (toObject(model.metrics));
    const metric = /** @type {DyniEditRouteMetricText} */ (toObject(metrics[metricId]));
    const fitMetrics = /** @type {Record<string, DyniEditRouteMetricFit>} */ (toObject(fit.metrics));
    const metricFit = /** @type {DyniEditRouteMetricFit} */ (toObject(fitMetrics[metricId]));
    const metricValues = toObject(fit.metricValues);
    const mode = model.mode || "normal";
    const metricClass = "dyni-edit-route-metric-" + metricId;
    const labelText = toText(metric.labelText);
    const valueText = Object.prototype.hasOwnProperty.call(metricValues, metricId)
      ? toText(metricValues[metricId])
      : toText(metric.valueText);
    const unitText = toText(metric.unitText);
    const valueRowStyle = metricFit.valueRowStyle;
    const unitNode = shouldRenderUnitNode(mode, metricId, metric, unitText)
      ? ('<span class="dyni-edit-route-metric-unit"'
        + htmlUtils.toStyleAttr(metricFit.unitStyle)
        + ">"
        + htmlUtils.escapeHtml(unitText)
        + "</span>")
      : "";
    const valueTextClasses = ["dyni-edit-route-metric-value-text"];
    if (model.stableDigitsEnabled === true) {
      valueTextClasses.push("dyni-tabular");
    }

    if (mode === "high") {
      return ""
        + '<div class="dyni-edit-route-metric-row ' + metricClass + '">'
        + '<div class="dyni-edit-route-metric-label"'
        + htmlUtils.toStyleAttr(metricFit.labelStyle)
        + ">"
        + htmlUtils.escapeHtml(labelText)
        + "</div>"
        + '<div class="dyni-edit-route-metric-value"'
        + htmlUtils.toStyleAttr(valueRowStyle)
        + ">"
        + '<span class="' + valueTextClasses.join(" ") + '"'
        + htmlUtils.toStyleAttr(metricFit.valueStyle)
        + ">"
        + htmlUtils.escapeHtml(valueText)
        + "</span>"
        + unitNode
        + "</div>"
        + "</div>";
    }

    return ""
      + '<div class="dyni-edit-route-metric ' + metricClass + '">'
      + '<div class="dyni-edit-route-metric-label"'
      + htmlUtils.toStyleAttr(metricFit.labelStyle)
      + ">"
      + htmlUtils.escapeHtml(labelText)
      + "</div>"
      + '<div class="dyni-edit-route-metric-value"'
      + htmlUtils.toStyleAttr(valueRowStyle)
      + ">"
      + '<span class="' + valueTextClasses.join(" ") + '"'
      + htmlUtils.toStyleAttr(metricFit.valueStyle)
      + ">"
      + htmlUtils.escapeHtml(valueText)
      + "</span>"
      + unitNode
      + "</div>"
      + "</div>";
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniEditRouteMarkupApi}
   */
  function create(def, componentContext) {
    const stateScreenMarkup = componentContext.components.require("StateScreenMarkup");
    const valueMath = componentContext.components.require("ValueMath");
    toObject = valueMath.toObject;
    toText = valueMath.toText;

    /**
     * @param {unknown} args
     * @returns {string}
     */
    function render(args) {
      const cfg = /** @type {DyniEditRouteMarkupRenderArgs} */ (/** @type {unknown} */ (toObject(args)));
      const model = /** @type {DyniEditRouteMarkupModel} */ (toObject(cfg.model));
      const fit = /** @type {DyniEditRouteMarkupFit} */ (toObject(cfg.fit));
      const htmlUtils = cfg.htmlUtils;
      const mode = model.mode || "normal";
      const hasRoute = model.hasRoute === true;
      const isLocalRoute = model.isLocalRoute === true;
      const interactionState = model.interactionState === "dispatch" ? "dispatch" : "passive";
      const canOpen = interactionState === "dispatch";

      const wrapperClasses = [
        "dyni-edit-route-html",
        "dyni-edit-route-mode-" + mode,
        "dyni-edit-route-open-" + interactionState
      ];
      if (mode === "flat") {
        wrapperClasses.push("dyni-edit-route-flat-rows-" + (model.flatMetricRows === 2 ? "2" : "1"));
      }
      if (model.isActiveRoute === true) {
        wrapperClasses.push("dyni-edit-route-active-route");
      }
      if (isLocalRoute) {
        wrapperClasses.push("dyni-edit-route-local-route");
      }
      if (model.kind && model.kind !== "data") {
        return stateScreenMarkup.renderStateScreen({
          kind: model.kind,
          label: toText(model.stateLabel),
          wrapperClasses: wrapperClasses,
          extraAttrs: 'data-dyni-action="edit-route-open"' + htmlUtils.toStyleAttr(model.wrapperStyle),
          htmlUtils: htmlUtils,
          shellRect: cfg.shellRect,
          fontFamily: cfg.fontFamily,
          fontWeight: cfg.fontWeight
        });
      }

      const openHotspot = canOpen
        ? '<div class="dyni-edit-route-open-hotspot"></div>'
        : "";
      const showSourceBadge = hasRoute && isLocalRoute;
      const nameTextStyle = fit.nameTextStyle;
      const sourceBadgeStyle = fit.sourceBadgeStyle;
      const metricsStyle = mode === "flat" ? toText(model.metricsStyle) : "";

      let metricsHtml = "";
      if (hasRoute) {
        const visibleMetricIds = Array.isArray(model.visibleMetricIds)
          ? model.visibleMetricIds.slice()
          : METRIC_IDS.filter(function (id) {
            return !!(model.metricVisibility && model.metricVisibility[id]);
          });

        for (let i = 0; i < visibleMetricIds.length; i += 1) {
          metricsHtml += renderMetric(model, fit, visibleMetricIds[i], htmlUtils);
        }
      }

      return ""
        + '<div class="' + wrapperClasses.join(" ") + '"'
        + ' data-dyni-action="edit-route-open"'
        + htmlUtils.toStyleAttr(model.wrapperStyle)
        + ">"
        + openHotspot
        + '<div class="dyni-edit-route-name-bar">'
        + '<div class="dyni-edit-route-name-text"'
        + htmlUtils.toStyleAttr(nameTextStyle)
        + ">"
        + htmlUtils.escapeHtml(toText(model.nameText))
        + "</div>"
        + (showSourceBadge
          ? (
            '<div class="dyni-edit-route-source-badge"'
            + htmlUtils.toStyleAttr(sourceBadgeStyle)
            + ">"
            + htmlUtils.escapeHtml(toText(model.sourceBadgeText))
            + "</div>"
          )
          : "")
        + "</div>"
        + (hasRoute
          ? ('<div class="dyni-edit-route-metrics"'
            + htmlUtils.toStyleAttr(metricsStyle)
            + ">"
            + metricsHtml
            + "</div>")
          : "")
        + "</div>";
    }

    return {
      id: "EditRouteMarkup",
      render: render
    };
  }

  return { id: "EditRouteMarkup", create: create };
}));
