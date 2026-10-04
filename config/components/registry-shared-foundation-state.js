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
    globalKey: "DyniStateScreenLabels"
  };

  sf.StateScreenPrecedence = {
    js: BASE + "shared/widget-kits/state/StateScreenPrecedence.js",
    globalKey: "DyniStateScreenPrecedence"
  };

  sf.StateScreenInteraction = {
    js: BASE + "shared/widget-kits/state/StateScreenInteraction.js",
    globalKey: "DyniStateScreenInteraction"
  };

  sf.StateScreenTextFit = {
    js: BASE + "shared/widget-kits/state/StateScreenTextFit.js",
    globalKey: "DyniStateScreenTextFit",
    deps: ["ValueMath", "HtmlWidgetUtils", "HtmlMeasureUtils", "CanvasTextFitting"]
  };

  sf.StateScreenMarkup = {
    js: BASE + "shared/widget-kits/state/StateScreenMarkup.js",
    globalKey: "DyniStateScreenMarkup",
    deps: ["HtmlWidgetUtils", "StateScreenLabels", "StateScreenTextFit", "ValueMath"]
  };

  sf.StateScreenCanvasOverlay = {
    js: BASE + "shared/widget-kits/state/StateScreenCanvasOverlay.js",
    globalKey: "DyniStateScreenCanvasOverlay",
    deps: ["StateScreenLabels", "CanvasTextFitting"]
  };

  sf.HtmlDomPatchUtils = {
    js: BASE + "shared/widget-kits/html/HtmlDomPatchUtils.js",
    globalKey: "DyniHtmlDomPatchUtils",
    deps: ["ValueMath"]
  };

  sf.HtmlWidgetUtils = {
    js: BASE + "shared/widget-kits/html/HtmlWidgetUtils.js",
    globalKey: "DyniHtmlWidgetUtils",
    deps: ["ValueMath", "HtmlDomPatchUtils"]
  };

  sf.PreparedPayloadModelCache = {
    js: BASE + "shared/widget-kits/html/PreparedPayloadModelCache.js",
    globalKey: "DyniPreparedPayloadModelCache"
  };

  sf.CanvasLayerCache = {
    js: BASE + "shared/widget-kits/canvas/CanvasLayerCache.js",
    globalKey: "DyniCanvasLayerCache",
    deps: ["ValueMath"]
  };

  sf.SpringEasing = {
    js: BASE + "shared/widget-kits/anim/SpringEasing.js",
    globalKey: "DyniSpringEasing",
    deps: ["ValueMath"]
  };

  sf.HtmlWidgetLifecycle = {
    js: BASE + "shared/widget-kits/html/HtmlWidgetLifecycle.js",
    globalKey: "DyniHtmlWidgetLifecycle"
  };

  sf.CenterDisplayStateAdapter = {
    js: BASE + "shared/widget-kits/text/CenterDisplayStateAdapter.js",
    globalKey: "DyniCenterDisplayStateAdapter",
    deps: ["StateScreenLabels", "StateScreenPrecedence", "StateScreenCanvasOverlay"]
  };
})(this);
