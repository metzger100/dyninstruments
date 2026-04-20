/**
 * Module: AlarmMarkup - Pure HTML assembly owner for vessel alarm renderer output
 * Documentation: documentation/widgets/alarm.md
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

  function joinStyles() {
    let text = "";
    for (let i = 0; i < arguments.length; i += 1) {
      const value = arguments[i];
      if (typeof value !== "string") {
        continue;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        continue;
      }
      text += trimmed;
    }
    return text;
  }

  function renderTextCell(className, text, style, htmlUtils) {
    return ""
      + '<span class="' + className + '"'
      + htmlUtils.toStyleAttr(style)
      + ">"
      + htmlUtils.escapeHtml(text)
      + "</span>";
  }

  function renderRow(className, text, style, htmlUtils) {
    return ""
      + '<div class="' + className + '"'
      + htmlUtils.toStyleAttr(style)
      + ">"
      + text
      + "</div>";
  }

  function renderFlatMain(model, fit, htmlUtils) {
    return ""
      + '<div class="dyni-alarm-main dyni-alarm-main-flat">'
      + '<div class="dyni-alarm-inline-row">'
      + renderTextCell("dyni-alarm-caption", model.captionText, fit.captionStyle, htmlUtils)
      + renderTextCell("dyni-alarm-value", model.valueText, fit.valueStyle, htmlUtils)
      + "</div>"
      + "</div>";
  }

  function renderNormalMain(model, fit, htmlUtils) {
    return ""
      + '<div class="dyni-alarm-main dyni-alarm-main-normal">'
      + renderRow(
        "dyni-alarm-value-row",
        renderTextCell("dyni-alarm-value", model.valueText, fit.valueStyle, htmlUtils),
        "",
        htmlUtils
      )
      + renderRow(
        "dyni-alarm-caption-row",
        renderTextCell("dyni-alarm-caption", model.captionText, fit.captionStyle, htmlUtils),
        "",
        htmlUtils
      )
      + "</div>";
  }

  function renderHighMain(model, fit, htmlUtils) {
    return ""
      + '<div class="dyni-alarm-main dyni-alarm-main-high">'
      + renderRow(
        "dyni-alarm-caption-row",
        renderTextCell("dyni-alarm-caption", model.captionText, fit.captionStyle, htmlUtils),
        "",
        htmlUtils
      )
      + renderRow(
        "dyni-alarm-value-row",
        renderTextCell("dyni-alarm-value", model.valueText, fit.valueStyle, htmlUtils),
        "",
        htmlUtils
      )
      + "</div>";
  }

  function renderMain(model, fit, htmlUtils) {
    if (fit.mode === "flat") {
      return renderFlatMain(model, fit, htmlUtils);
    }
    if (fit.mode === "high") {
      return renderHighMain(model, fit, htmlUtils);
    }
    return renderNormalMain(model, fit, htmlUtils);
  }

  function renderStateAccent(model, fit, htmlUtils) {
    return model.showStrip === true
      ? '<div class="dyni-alarm-state-accent"' + htmlUtils.toStyleAttr(fit.accentStyle) + "></div>"
      : "";
  }

  function renderHotspot(model) {
    return model.interactionState === "dispatch"
      ? '<div class="dyni-alarm-open-hotspot"></div>'
      : "";
  }

  function create(def, Helpers) {
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);

    function render(args) {
      const cfg = args || {};
      const model = toObject(cfg.model);
      const fit = toObject(cfg.fit);
      const classes = [
        "dyni-alarm-html",
        "dyni-alarm-mode-" + fit.mode,
        "dyni-alarm-state-" + (model.state === "active" ? "active" : "idle"),
        model.interactionState === "dispatch"
          ? "dyni-alarm-open-dispatch"
        : "dyni-alarm-open-passive"
      ];

      const rootStyle = joinStyles(
        fit.shellStyle,
        fit.activeBackgroundStyle,
        fit.activeForegroundStyle
      );

      return ""
        + '<div class="' + classes.join(" ") + '"'
        + htmlUtils.toStyleAttr(rootStyle)
        + ">"
        + renderStateAccent(model, fit, htmlUtils)
        + renderHotspot(model)
        + renderMain(model, fit, htmlUtils)
        + "</div>";
    }

    return {
      id: "AlarmMarkup",
      render: render
    };
  }

  return { id: "AlarmMarkup", create: create };
}));
