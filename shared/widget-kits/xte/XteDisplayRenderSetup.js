/**
 * @file XteDisplayRenderSetup - Shared canvas setup, theme resolution, and state-screen
 * early-return preamble for the XTE highway and linear widgets
 * Documentation: documentation/widgets/xte-display.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniXteDisplayRenderSetup = factory();
  }
})(this, function () {
  "use strict";

  /**
   * @param {DyniXteRenderSetupArgs} args
   * @returns {DyniXteRenderSetupResult | null}
   */
  function resolveRenderSetup(args) {
    const setup = args.componentContext.canvas.setupCanvas(args.canvas);
    if (!setup) {
      return null;
    }
    const ctx = setup.ctx;
    const W = setup.W;
    const H = setup.H;
    if (!W || !H) {
      return null;
    }

    ctx.clearRect(0, 0, W, H);
    const rootEl = args.componentContext.dom.requirePluginRoot(args.canvas);
    const theme = args.toolkit.theme.resolveForRoot(rootEl);
    const stableDigitsEnabled = args.props.stableDigits === true;
    const themeView = args.resolveThemeView(theme, stableDigitsEnabled);
    const stateKind = args.resolveStateKind(args.props);
    if (stateKind !== args.stateScreenLabels.KINDS.DATA) {
      args.stateScreenCanvasOverlay.drawStateScreen({
        ctx: ctx,
        W: W,
        H: H,
        family: themeView.family,
        color: args.stateScreenColor(theme, themeView),
        labelWeight: themeView.labelWeight,
        kind: stateKind
      });
      return null;
    }

    return { ctx: ctx, W: W, H: H, theme: theme, themeView: themeView };
  }

  /** @returns {DyniXteDisplayRenderSetupApi} */
  function create() {
    return {
      resolveRenderSetup: resolveRenderSetup
    };
  }

  return { id: "XteDisplayRenderSetup", create: create };
});
