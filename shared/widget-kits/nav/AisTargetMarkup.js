/**
 * Module: AisTargetMarkup - Pure HTML assembly owner for AIS target renderer output
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: StateScreenMarkup
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetMarkup = factory(); }
}(this, function () {
  "use strict";

  function toObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function toText(value) {
    return value == null ? "" : String(value);
  }

  function joinStyles() {
    const parts = [];
    for (let i = 0; i < arguments.length; i += 1) {
      const value = arguments[i];
      if (value == null) {
        continue;
      }
      const text = String(value).trim();
      if (!text) {
        continue;
      }
      parts.push(text);
    }
    return parts.join("");
  }

  function renderMetric(args) {
    const cfg = args || {};
    const metricId = cfg.metricId;
    const mode = cfg.mode;
    const metric = toObject(cfg.metric);
    const metricFit = toObject(cfg.metricFit);
    const metricGeometry = toObject(cfg.metricGeometry);
    const htmlUtils = cfg.htmlUtils;

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
        + '<div class="dyni-ais-target-metric-value"'
        + htmlUtils.toStyleAttr(metricFit.valueStyle)
        + ">"
        + htmlUtils.escapeHtml(toText(metric.valueText))
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
      + htmlUtils.toStyleAttr(joinStyles(metricGeometry.valueRowStyle, metricFit.valueRowStyle))
      + ">"
      + '<span class="dyni-ais-target-metric-value-text"'
      + htmlUtils.toStyleAttr(metricFit.valueStyle)
      + ">"
      + htmlUtils.escapeHtml(toText(metric.valueText))
      + "</span>"
      + '<span class="dyni-ais-target-metric-unit"'
      + htmlUtils.toStyleAttr(metricFit.unitStyle)
      + ">"
      + htmlUtils.escapeHtml(toText(metric.unitText))
      + "</span>"
      + "</div>"
      + "</div>";
  }

  function renderDataBody(model, fit, htmlUtils) {
    const metricIds = model.visibleMetricIds;
    const metrics = toObject(model.metrics);
    const metricFits = toObject(fit.metrics);
    const geometry = toObject(model.inlineGeometry);
    const metricGeometry = toObject(geometry.metricStyles);

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

  function create(def, Helpers) {
    const stateScreenMarkup = Helpers.getModule("StateScreenMarkup").create(def, Helpers);

    function render(args) {
      const cfg = args || {};
      const model = toObject(cfg.model);
      const fit = toObject(cfg.fit);
      const htmlUtils = cfg.htmlUtils;
      const wrapperClasses = model.wrapperClasses;
      const geometry = toObject(model.inlineGeometry);
      if (model.kind && model.kind !== "data") {
        return stateScreenMarkup.renderStateScreen({
          kind: model.kind,
          label: toText(model.stateLabel),
          wrapperClasses: wrapperClasses,
          extraAttrs: 'data-dyni-action="ais-target-open"' + htmlUtils.toStyleAttr(joinStyles(model.wrapperStyle, geometry.wrapperStyle)),
          htmlUtils: htmlUtils
        });
      }

      const hotspotHtml = model.showHotspot === true
        ? '<div class="dyni-ais-target-open-hotspot"></div>'
        : "";
      const accentHtml = model.hasAccent === true
        ? ('<div class="dyni-ais-target-state-accent"'
          + htmlUtils.toStyleAttr(joinStyles(geometry.accentStyle, fit.accentStyle))
          + "></div>")
        : "";

      const bodyHtml = renderDataBody(model, fit, htmlUtils);

      return ""
        + '<div class="' + wrapperClasses.join(" ") + '"'
        + ' data-dyni-action="ais-target-open"'
        + htmlUtils.toStyleAttr(joinStyles(model.wrapperStyle, geometry.wrapperStyle))
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
