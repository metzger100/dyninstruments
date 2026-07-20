/**
 * @file MapZoomMarkup - HTML assembly owner for the map zoom renderer
 * Documentation: documentation/widgets/map-zoom.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniMapZoomMarkup = factory();
  }
})(this, function () {
  "use strict";

  /** @param {string} baseClass @param {boolean} stableDigitsEnabled */
  function buildTextClasses(baseClass, stableDigitsEnabled) {
    const classes = [baseClass];
    if (stableDigitsEnabled === true) {
      classes.push("dyni-tabular");
    }
    return classes.join(" ");
  }

  /** @param {DyniMapZoomRenderModel} model @param {DyniHtmlWidgetUtilsApi} htmlUtils */
  function renderMainRows(model, htmlUtils) {
    if (model.mode === "flat") {
      return (
        "" +
        '<div class="dyni-map-zoom-main dyni-map-zoom-main-flat">' +
        '<div class="dyni-map-zoom-inline-row">' +
        '<span class="dyni-map-zoom-caption"' +
        htmlUtils.toStyleAttr(model.captionStyle) +
        ">" +
        htmlUtils.escapeHtml(model.caption) +
        "</span>" +
        '<span class="' +
        buildTextClasses("dyni-map-zoom-value", model.stableDigitsEnabled) +
        '"' +
        htmlUtils.toStyleAttr(model.valueStyle) +
        ">" +
        htmlUtils.escapeHtml(model.zoomText) +
        "</span>" +
        '<span class="dyni-map-zoom-unit"' +
        htmlUtils.toStyleAttr(model.unitStyle) +
        ">" +
        htmlUtils.escapeHtml(model.unit) +
        "</span>" +
        "</div>" +
        "</div>"
      );
    }
    if (model.mode === "high") {
      return (
        "" +
        '<div class="dyni-map-zoom-main dyni-map-zoom-main-high">' +
        '<div class="dyni-map-zoom-caption-row">' +
        '<span class="dyni-map-zoom-caption"' +
        htmlUtils.toStyleAttr(model.captionStyle) +
        ">" +
        htmlUtils.escapeHtml(model.caption) +
        "</span>" +
        "</div>" +
        '<div class="dyni-map-zoom-value-row">' +
        '<span class="' +
        buildTextClasses("dyni-map-zoom-value", model.stableDigitsEnabled) +
        '"' +
        htmlUtils.toStyleAttr(model.valueStyle) +
        ">" +
        htmlUtils.escapeHtml(model.zoomText) +
        "</span>" +
        "</div>" +
        '<div class="dyni-map-zoom-unit-row">' +
        '<span class="dyni-map-zoom-unit"' +
        htmlUtils.toStyleAttr(model.unitStyle) +
        ">" +
        htmlUtils.escapeHtml(model.unit) +
        "</span>" +
        "</div>" +
        "</div>"
      );
    }
    return (
      "" +
      '<div class="dyni-map-zoom-main dyni-map-zoom-main-normal">' +
      '<div class="dyni-map-zoom-value-row">' +
      '<span class="' +
      buildTextClasses("dyni-map-zoom-value", model.stableDigitsEnabled) +
      '"' +
      htmlUtils.toStyleAttr(model.valueStyle) +
      ">" +
      htmlUtils.escapeHtml(model.zoomText) +
      "</span>" +
      '<span class="dyni-map-zoom-unit"' +
      htmlUtils.toStyleAttr(model.unitStyle) +
      ">" +
      htmlUtils.escapeHtml(model.unit) +
      "</span>" +
      "</div>" +
      '<div class="dyni-map-zoom-caption-row">' +
      '<span class="dyni-map-zoom-caption"' +
      htmlUtils.toStyleAttr(model.captionStyle) +
      ">" +
      htmlUtils.escapeHtml(model.caption) +
      "</span>" +
      "</div>" +
      "</div>"
    );
  }

  /** @param {DyniMapZoomMarkupRenderArgs} args @param {DyniStateScreenLabelsApi} stateScreenLabels @param {DyniStateScreenMarkupApi} stateScreenMarkup */
  function render(args, stateScreenLabels, stateScreenMarkup) {
    const model = args.model;
    const htmlUtils = args.htmlUtils;
    const classes = [
      "dyni-map-zoom-html",
      "dyni-map-zoom-mode-" + model.mode,
      model.interactionState === "dispatch" ? "dyni-map-zoom-open-dispatch" : "dyni-map-zoom-open-passive"
    ];
    if (model.showRequired) {
      classes.push("dyni-map-zoom-has-required");
    }
    const scaleStyle = "--dyni-map-zoom-sec-scale:" + model.captionUnitScale + ";";
    if (model.kind !== stateScreenLabels.KINDS.DATA) {
      return stateScreenMarkup.renderStateScreen({
        kind: model.kind,
        label: model.stateLabel,
        wrapperClasses: classes,
        extraAttrs: 'data-dyni-action="map-zoom-check-auto" style="' + scaleStyle + '"',
        htmlUtils: htmlUtils,
        shellRect: args.shellRect,
        fontFamily: args.theme.font.family,
        fontWeight: args.theme.font.labelWeight
      });
    }

    const requiredHtml = model.showRequired
      ? '<div class="' +
        buildTextClasses("dyni-map-zoom-required", model.stableDigitsEnabled) +
        '"' +
        htmlUtils.toStyleAttr(model.requiredStyle) +
        ">" +
        htmlUtils.escapeHtml(model.requiredText) +
        "</div>"
      : "";
    const styleAttr = ' style="' + scaleStyle + '"';

    return (
      "" +
      '<div class="' +
      classes.join(" ") +
      '"' +
      styleAttr +
      ' data-dyni-action="map-zoom-check-auto">' +
      '<div class="dyni-map-zoom-open-hotspot"></div>' +
      renderMainRows(model, htmlUtils) +
      requiredHtml +
      "</div>"
    );
  }

  /** @param {unknown} def @param {DyniComponentContext} componentContext */
  function create(def, componentContext) {
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenMarkup = componentContext.components.require("StateScreenMarkup");
    return {
      id: "MapZoomMarkup",
      /** @param {DyniMapZoomMarkupRenderArgs} args */
      render: function (args) {
        return render(args, stateScreenLabels, stateScreenMarkup);
      }
    };
  }

  return { id: "MapZoomMarkup", create: create };
});
