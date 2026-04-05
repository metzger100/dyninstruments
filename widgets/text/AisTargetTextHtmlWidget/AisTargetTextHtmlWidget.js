/**
 * Module: AisTargetTextHtmlWidget - Native HTML AIS target summary renderer shell
 * Documentation: documentation/guides/add-new-html-kind.md
 * Depends: HtmlWidgetUtils
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetTextHtmlWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);

    const renderHtml = function () {
      return '<div class="dyni-ais-target-html dyni-ais-target-hidden"></div>';
    };

    const namedHandlers = function () {
      return {};
    };

    const resizeSignature = function (props) {
      const p = props || {};
      return [
        "ais-target-phase1",
        htmlUtils.isEditingMode(p) ? "editing" : "runtime"
      ].join("|");
    };

    return {
      id: "AisTargetTextHtmlWidget",
      wantsHideNativeHead: true,
      renderHtml: renderHtml,
      namedHandlers: namedHandlers,
      resizeSignature: resizeSignature
    };
  }

  return { id: "AisTargetTextHtmlWidget", create: create };
}));
