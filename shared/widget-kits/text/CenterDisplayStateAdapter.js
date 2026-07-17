/**
 * @file CenterDisplayStateAdapter - Canvas state-screen gateway for CenterDisplayTextWidget
 * Documentation: documentation/widgets/center-display.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniCenterDisplayStateAdapter = factory();
  }
}(this, function () {
  "use strict";

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniCenterDisplayStateAdapterApi}
   */
  function create(def, componentContext) {
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenCanvasOverlay = componentContext.components.require("StateScreenCanvasOverlay");

    /** @param {unknown} args @returns {boolean} */
    function renderStateScreenIfNeeded(args) {
      const cfg = /** @type {{ props?: unknown, ctx?: unknown, W?: unknown, H?: unknown, family?: unknown, color?: unknown, labelWeight?: unknown }} */ (
        args && typeof args === "object" ? args : {}
      );
      const props = cfg.props && typeof cfg.props === "object"
        ? /** @type {{ disconnect?: unknown }} */ (cfg.props)
        : null;
      const kind = stateScreenPrecedence.pickFirst([
        { kind: "disconnected", when: props && props.disconnect === true },
        { kind: "data", when: true }
      ]);

      if (kind === stateScreenLabels.KINDS.DATA) {
        return false;
      }

      stateScreenCanvasOverlay.drawStateScreen({
        ctx: cfg.ctx,
        W: cfg.W,
        H: cfg.H,
        family: cfg.family,
        color: cfg.color,
        labelWeight: cfg.labelWeight,
        kind: kind
      });
      return true;
    }

    return {
      id: "CenterDisplayStateAdapter",
      renderStateScreenIfNeeded: renderStateScreenIfNeeded
    };
  }

  return { id: "CenterDisplayStateAdapter", create: create };
}));
