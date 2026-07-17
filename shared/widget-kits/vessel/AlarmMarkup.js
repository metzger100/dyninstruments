/**
 * @file AlarmMarkup - Pure HTML assembly owner for vessel alarm renderer output
 * Documentation: documentation/widgets/alarm.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniAlarmMarkup = factory();
  }
}(this, function () {
  "use strict";

  /** @type {DyniValueMathApi["toObject"]} */
  let toObject;

  /** @param {string} className @param {unknown} text @param {unknown} style @param {DyniHtmlWidgetUtilsApi} htmlUtils @returns {string} */
  function renderTextCell(className, text, style, htmlUtils) {
    return ""
      + '<span class="' + className + '"'
      + htmlUtils.toStyleAttr(style)
      + ">"
      + htmlUtils.escapeHtml(text)
      + "</span>";
  }

  /** @param {string} className @param {string} text @param {unknown} style @param {DyniHtmlWidgetUtilsApi} htmlUtils @returns {string} */
  function renderRow(className, text, style, htmlUtils) {
    return ""
      + '<div class="' + className + '"'
      + htmlUtils.toStyleAttr(style)
      + ">"
      + text
      + "</div>";
  }

  /** @param {DyniAlarmMarkupModel} model @param {DyniAlarmMarkupFit} fit @param {DyniHtmlWidgetUtilsApi} htmlUtils @returns {string} */
  function renderFlatMain(model, fit, htmlUtils) {
    return ""
      + '<div class="dyni-alarm-main dyni-alarm-main-flat">'
      + '<div class="dyni-alarm-inline-row">'
      + renderTextCell("dyni-alarm-caption", model.captionText, fit.captionStyle, htmlUtils)
      + renderTextCell("dyni-alarm-value", model.valueText, fit.valueStyle, htmlUtils)
      + "</div>"
      + "</div>";
  }

  /** @param {DyniAlarmMarkupModel} model @param {DyniAlarmMarkupFit} fit @param {DyniHtmlWidgetUtilsApi} htmlUtils @returns {string} */
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

  /** @param {DyniAlarmMarkupModel} model @param {DyniAlarmMarkupFit} fit @param {DyniHtmlWidgetUtilsApi} htmlUtils @returns {string} */
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

  /** @param {DyniAlarmMarkupModel} model @param {DyniAlarmMarkupFit} fit @param {DyniHtmlWidgetUtilsApi} htmlUtils @returns {string} */
  function renderMain(model, fit, htmlUtils) {
    if (fit.mode === "flat") {
      return renderFlatMain(model, fit, htmlUtils);
    }
    if (fit.mode === "high") {
      return renderHighMain(model, fit, htmlUtils);
    }
    return renderNormalMain(model, fit, htmlUtils);
  }

  /** @param {DyniAlarmMarkupModel} model @param {DyniAlarmMarkupFit} fit @param {DyniHtmlWidgetUtilsApi} htmlUtils @returns {string} */
  function renderStateAccent(model, fit, htmlUtils) {
    return model.showStrip === true
      ? '<div class="dyni-alarm-state-accent"' + htmlUtils.toStyleAttr(fit.accentStyle) + "></div>"
      : "";
  }

  /** @param {DyniAlarmMarkupModel} model @returns {string} */
  function renderHotspot(model) {
    return model.interactionState === "dispatch"
      ? '<div class="dyni-alarm-open-hotspot"></div>'
      : "";
  }

  /** @param {unknown} def @param {DyniComponentContext} componentContext @returns {DyniAlarmMarkupApi} */
  function create(def, componentContext) {
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    toObject = componentContext.components.require("ValueMath").toObject;

    /** @param {unknown} args @returns {string} */
    function render(args) {
      const cfg = /** @type {DyniAlarmMarkupArgs} */ (args || {});
      const model = /** @type {DyniAlarmMarkupModel} */ (toObject(cfg.model));
      const fit = /** @type {DyniAlarmMarkupFit} */ (toObject(cfg.fit));
      const classes = [
        "dyni-alarm-html",
        "dyni-alarm-mode-" + fit.mode,
        "dyni-alarm-state-" + (model.state === "active" ? "active" : "idle"),
        model.interactionState === "dispatch"
          ? "dyni-alarm-open-dispatch"
        : "dyni-alarm-open-passive"
      ];

      const rootStyle = htmlUtils.joinStyles(
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
