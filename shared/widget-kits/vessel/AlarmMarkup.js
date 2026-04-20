/**
 * Module: AlarmMarkup - Pure HTML assembly owner for vessel alarm renderer output
 * Documentation: documentation/guides/add-new-html-kind.md
 * Depends: HtmlWidgetUtils
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAlarmMarkup = factory(); }
}(this, function () {
  "use strict";

  function toObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function renderTextCell(className, text, style, htmlUtils) {
    return ""
      + '<span class="' + className + '"'
      + htmlUtils.toStyleAttr(style)
      + ">"
      + htmlUtils.escapeHtml(text)
      + "</span>";
  }

  function renderFlatBody(model, fit, htmlUtils) {
    return ""
      + '<div class="dyni-alarm-inline-row">'
      + renderTextCell("dyni-alarm-caption", model.captionText, fit.captionStyle, htmlUtils)
      + renderTextCell("dyni-alarm-value", model.valueText, fit.valueStyle, htmlUtils)
      + "</div>";
  }

  function renderHighBody(model, fit, htmlUtils) {
    return ""
      + '<div class="dyni-alarm-caption-row">'
      + renderTextCell("dyni-alarm-caption", model.captionText, fit.captionStyle, htmlUtils)
      + "</div>"
      + '<div class="dyni-alarm-value-row">'
      + renderTextCell("dyni-alarm-value", model.valueText, fit.valueStyle, htmlUtils)
      + "</div>";
  }

  function renderNormalBody(model, fit, htmlUtils) {
    return ""
      + '<div class="dyni-alarm-value-row">'
      + renderTextCell("dyni-alarm-value", model.valueText, fit.valueStyle, htmlUtils)
      + "</div>"
      + '<div class="dyni-alarm-caption-row">'
      + renderTextCell("dyni-alarm-caption", model.captionText, fit.captionStyle, htmlUtils)
      + "</div>";
  }

  function create(def, Helpers) {
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);

    function render(args) {
      const cfg = args || {};
      const model = toObject(cfg.model);
      const fit = toObject(cfg.fit);
      const mode = fit.mode;
      const classes = [
        "dyni-alarm-html",
        "dyni-alarm-mode-" + mode,
        "dyni-alarm-state-" + (model.state === "active" ? "active" : "idle"),
        "dyni-alarm-interaction-" + (model.interactionState === "dispatch" ? "dispatch" : "passive")
      ];
      if (model.showStrip === true) {
        classes.push("dyni-alarm-show-strip");
      }
      if (model.showActiveBackground === true) {
        classes.push("dyni-alarm-show-active-background");
      }

      let rootStyle = "";
      if (fit.activeBackgroundStyle != null) {
        rootStyle += String(fit.activeBackgroundStyle);
      }
      if (fit.activeForegroundStyle != null) {
        rootStyle += String(fit.activeForegroundStyle);
      }
      const stripHtml = model.showStrip === true
        ? '<div class="dyni-alarm-strip"' + htmlUtils.toStyleAttr(fit.idleStripStyle) + "></div>"
        : "";
      const hotspotHtml = model.interactionState === "dispatch"
        ? '<div class="dyni-alarm-hotspot" data-dyni-action="alarm-stop-all"></div>'
        : "";
      const bodyHtml = mode === "flat"
        ? renderFlatBody(model, fit, htmlUtils)
        : (mode === "high"
          ? renderHighBody(model, fit, htmlUtils)
          : renderNormalBody(model, fit, htmlUtils));

      return ""
        + '<div class="' + classes.join(" ") + '"'
        + htmlUtils.toStyleAttr(rootStyle)
        + ">"
        + stripHtml
        + hotspotHtml
        + '<div class="dyni-alarm-body">'
        + bodyHtml
        + "</div>"
        + "</div>";
    }

    return {
      id: "AlarmMarkup",
      render: render
    };
  }

  return { id: "AlarmMarkup", create: create };
}));
