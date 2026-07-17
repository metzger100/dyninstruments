/**
 * @file NavInteractionPolicy - Shared dispatch gating for nav HTML render models
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniNavInteractionPolicy = factory();
  }
}(this, function () {
  "use strict";

  /** @type {DyniValueMathApi["toObject"]} */
  let toObject;

  /** @param {unknown} def @param {DyniComponentContext} componentContext @returns {DyniNavInteractionPolicyApi} */
  function create(def, componentContext) {
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    toObject = componentContext.components.require("ValueMath").toObject;

    /** @param {unknown} props @returns {boolean} */
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
