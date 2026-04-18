/**
 * Module: CenterDisplayStateAdapter - Canvas state-screen gateway for CenterDisplayTextWidget
 * Documentation: documentation/widgets/center-display.md
 * Depends: StateScreenLabels, StateScreenPrecedence, StateScreenCanvasOverlay
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniCenterDisplayStateAdapter = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const stateScreenLabels = Helpers.getModule("StateScreenLabels").create(def, Helpers);
    const stateScreenPrecedence = Helpers.getModule("StateScreenPrecedence").create(def, Helpers);
    const stateScreenCanvasOverlay = Helpers.getModule("StateScreenCanvasOverlay").create(def, Helpers);

    function renderStateScreenIfNeeded(args) {
      const cfg = args && typeof args === "object" ? args : {};
      const props = cfg.props && typeof cfg.props === "object" ? cfg.props : null;
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
