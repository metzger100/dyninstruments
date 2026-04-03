/**
 * Module: EditRouteMarkup - Pure HTML assembly owner for edit-route renderer output
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteMarkup = factory(); }
}(this, function () {
  "use strict";

  const METRIC_IDS = ["pts", "dst", "rte", "eta"];

  function toObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function toText(value) {
    return value == null ? "" : String(value);
  }

  function isFlatDistanceMetric(mode, metricId) {
    return mode === "flat" && (metricId === "dst" || metricId === "rte");
  }

  function shouldRenderUnitNode(mode, metricId) {
    if (mode === "flat") {
      return metricId === "dst" || metricId === "rte";
    }
    return true;
  }

  function renderMetric(model, fit, metricId, htmlUtils) {
    const metrics = toObject(model.metrics);
    const metric = toObject(metrics[metricId]);
    const metricFit = toObject(toObject(fit.metrics)[metricId]);
    const mode = model.mode || "normal";
    const metricClass = "dyni-edit-route-metric-" + metricId;
    const labelText = toText(metric.labelText);
    const valueText = toText(metric.valueText);
    const unitText = toText(metric.unitText);
    const valueClasses = ["dyni-edit-route-metric-value"];
    if (isFlatDistanceMetric(mode, metricId)) {
      valueClasses.push("dyni-edit-route-metric-value-stack");
    }
    const unitNode = shouldRenderUnitNode(mode, metricId)
      ? ('<span class="dyni-edit-route-metric-unit"'
        + htmlUtils.toStyleAttr(metricFit.unitStyle)
        + ">"
        + htmlUtils.escapeHtml(unitText)
        + "</span>")
      : "";

    if (mode === "high") {
      return ""
        + '<div class="dyni-edit-route-metric-row ' + metricClass + '">'
        + '<div class="dyni-edit-route-metric-label"'
        + htmlUtils.toStyleAttr(metricFit.labelStyle)
        + ">"
        + htmlUtils.escapeHtml(labelText)
        + "</div>"
        + '<div class="' + valueClasses.join(" ") + '"'
        + htmlUtils.toStyleAttr(metricFit.valueRowStyle)
        + ">"
        + '<span class="dyni-edit-route-metric-value-text"'
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
      + '<div class="' + valueClasses.join(" ") + '"'
      + htmlUtils.toStyleAttr(metricFit.valueRowStyle)
      + ">"
      + '<span class="dyni-edit-route-metric-value-text"'
      + htmlUtils.toStyleAttr(metricFit.valueStyle)
      + ">"
      + htmlUtils.escapeHtml(valueText)
      + "</span>"
      + unitNode
      + "</div>"
      + "</div>";
  }

  function create() {
    function render(args) {
      const cfg = args || {};
      const model = toObject(cfg.model);
      const fit = toObject(cfg.fit);
      const htmlUtils = cfg.htmlUtils;
      const mode = model.mode || "normal";
      const hasRoute = model.hasRoute === true;
      const isLocalRoute = model.isLocalRoute === true;
      const canOpen = model.canOpenEditRoute === true;

      const wrapperClasses = [
        "dyni-edit-route-html",
        "dyni-edit-route-mode-" + mode,
        canOpen ? "dyni-edit-route-open-dispatch" : "dyni-edit-route-open-passive"
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
      if (!hasRoute) {
        wrapperClasses.push("dyni-edit-route-no-route");
      }

      const wrapperOnClick = model.captureClicks === true ? ' onclick="catchAll"' : "";
      const openHotspot = canOpen
        ? '<div class="dyni-edit-route-open-hotspot" onclick="editRouteOpen"></div>'
        : "";
      const showSourceBadge = hasRoute && isLocalRoute;
      const nameTextStyle = fit.nameTextStyle;
      const sourceBadgeStyle = fit.sourceBadgeStyle;

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
        + wrapperOnClick
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
          ? ('<div class="dyni-edit-route-metrics">' + metricsHtml + "</div>")
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
