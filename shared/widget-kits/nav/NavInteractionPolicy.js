/**
 * Module: NavInteractionPolicy - Shared dispatch gating for nav HTML render models
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: HtmlWidgetUtils, ValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniNavInteractionPolicy = factory(); }
}(this, function () {
  "use strict";

  let toObject;

  function create(def, componentContext) {
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    toObject = componentContext.components.require("ValueMath").toObject;

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
