/**
 * Module: NavInteractionPolicy - Shared dispatch gating for nav HTML render models
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: HtmlWidgetUtils
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniNavInteractionPolicy = factory(); }
}(this, function () {
  "use strict";

  function toObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function create(def, Helpers) {
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);

    function canDispatchWhenNotEditing(props) {
      const safeProps = toObject(props);
      if (htmlUtils.isEditingMode(safeProps)) {
        return false;
      }
      return htmlUtils.canDispatchSurfaceInteraction(safeProps);
    }

    return {
      id: "NavInteractionPolicy",
      canDispatchWhenNotEditing: canDispatchWhenNotEditing
    };
  }

  return { id: "NavInteractionPolicy", create: create };
}));
