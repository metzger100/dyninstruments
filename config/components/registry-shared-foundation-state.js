/**
 * @file DyniPlugin Shared Foundation Registry State - Shared state, DOM, caching, and animation component definitions
 * Documentation: documentation/architecture/component-system.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = (config.shared = config.shared || {});
  const BASE = ns.baseUrl;

  if (typeof BASE !== "string" || !BASE) {
    throw new Error(
      "dyninstruments: baseUrl missing before config/components/registry-shared-foundation-state.js load"
    );
  }

  const groups = (shared.componentRegistryGroups = shared.componentRegistryGroups || {});
  var sf = (groups.sharedFoundation = groups.sharedFoundation || {});

  sf.StateScreenLabels = {
    js: BASE + "shared/widget-kits/state/StateScreenLabels.js",
    css: undefined,
    globalKey: "DyniStateScreenLabels"
  };

  sf.StateScreenPrecedence = {
    js: BASE + "shared/widget-kits/state/StateScreenPrecedence.js",
    css: undefined,
    globalKey: "DyniStateScreenPrecedence"
  };

  sf.StateScreenInteraction = {
    js: BASE + "shared/widget-kits/state/StateScreenInteraction.js",
    css: undefined,
    globalKey: "DyniStateScreenInteraction"
  };

  sf.StateScreenTextFit = {
    js: BASE + "shared/widget-kits/state/StateScreenTextFit.js",
    css: undefined,
    globalKey: "DyniStateScreenTextFit",
    deps: ["ValueMath", "HtmlWidgetUtils", "HtmlMeasureUtils", "CanvasTextFitting"]
  };

  sf.StateScreenMarkup = {
    js: BASE + "shared/widget-kits/state/StateScreenMarkup.js",
    css: undefined,
    globalKey: "DyniStateScreenMarkup",
    deps: ["HtmlWidgetUtils", "StateScreenLabels", "StateScreenTextFit"]
  };

  sf.StateScreenCanvasOverlay = {
    js: BASE + "shared/widget-kits/state/StateScreenCanvasOverlay.js",
    css: undefined,
    globalKey: "DyniStateScreenCanvasOverlay",
    deps: ["StateScreenLabels", "CanvasTextFitting"]
  };

  sf.HtmlDomPatchUtils = {
    js: BASE + "shared/widget-kits/html/HtmlDomPatchUtils.js",
    css: undefined,
    globalKey: "DyniHtmlDomPatchUtils",
    deps: []
  };

  sf.HtmlWidgetUtils = {
    js: BASE + "shared/widget-kits/html/HtmlWidgetUtils.js",
    css: undefined,
    globalKey: "DyniHtmlWidgetUtils",
    deps: ["ValueMath", "HtmlDomPatchUtils"]
  };

  sf.PreparedPayloadModelCache = {
    js: BASE + "shared/widget-kits/html/PreparedPayloadModelCache.js",
    css: undefined,
    globalKey: "DyniPreparedPayloadModelCache"
  };

  sf.CanvasLayerCache = {
    js: BASE + "shared/widget-kits/canvas/CanvasLayerCache.js",
    css: undefined,
    globalKey: "DyniCanvasLayerCache",
    deps: ["ValueMath"]
  };

  sf.SpringEasing = {
    js: BASE + "shared/widget-kits/anim/SpringEasing.js",
    css: undefined,
    globalKey: "DyniSpringEasing",
    deps: ["ValueMath"]
  };

  sf.HtmlWidgetLifecycle = {
    js: BASE + "shared/widget-kits/html/HtmlWidgetLifecycle.js",
    css: undefined,
    globalKey: "DyniHtmlWidgetLifecycle"
  };

  sf.CenterDisplayStateAdapter = {
    js: BASE + "shared/widget-kits/text/CenterDisplayStateAdapter.js",
    css: undefined,
    globalKey: "DyniCenterDisplayStateAdapter",
    deps: ["StateScreenLabels", "StateScreenPrecedence", "StateScreenCanvasOverlay"]
  };
})(this);
