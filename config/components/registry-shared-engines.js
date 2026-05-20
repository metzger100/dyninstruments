/**
 * Module: DyniPlugin Shared Engines Registry - Shared rendering engine and layout component definitions
 * Documentation: documentation/architecture/component-system.md
 * Depends: window.DyniPlugin.baseUrl, window.DyniPlugin.config.shared
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = config.shared = config.shared || {};
  const BASE = ns.baseUrl;

  if (typeof BASE !== "string" || !BASE) {
    throw new Error("dyninstruments: baseUrl missing before config/components/registry-shared-engines.js load");
  }

  const groups = shared.componentRegistryGroups = shared.componentRegistryGroups || {};

  groups.sharedEngines = {
    FullCircleRadialEngine: {
      js: BASE + "shared/widget-kits/radial/FullCircleRadialEngine.js",
      css: undefined,
      globalKey: "DyniFullCircleRadialEngine",
      deps: [
        "RadialToolkit",
        "CanvasLayerCache",
        "FullCircleRadialLayout",
        "StableDigits",
        "StateScreenLabels",
        "StateScreenPrecedence",
        "StateScreenCanvasOverlay"
      ]
    },
    FullCircleRadialLayout: {
      js: BASE + "shared/widget-kits/radial/FullCircleRadialLayout.js",
      css: undefined,
      globalKey: "DyniFullCircleRadialLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath", "GeometryScale", "TextLayoutScaleHelpers", "ValueMath"]
    },
    FullCircleRadialTextLayout: {
      js: BASE + "shared/widget-kits/radial/FullCircleRadialTextLayout.js",
      css: undefined,
      globalKey: "DyniFullCircleRadialTextLayout",
      deps: ["ValueMath", "TextLayoutScaleHelpers", "HtmlWidgetUtils"]
    },
    LinearGaugeEngine: {
      js: BASE + "shared/widget-kits/linear/LinearGaugeEngine.js",
      css: undefined,
      globalKey: "DyniLinearGaugeEngine",
      deps: [
        "GaugeToolkit",
        "CanvasLayerCache",
        "LinearCanvasPrimitives",
        "LinearGaugeEngineDrawing",
        "LinearGaugeMath",
        "LinearGaugeLayout",
        "LinearGaugeTextLayout",
        "LinearGaugeEngineSupport",
        "TextLayoutScaleHelpers",
        "SpringEasing",
        "StableDigits",
        "StateScreenLabels",
        "StateScreenPrecedence",
        "StateScreenCanvasOverlay"
      ]
    },
    GaugeToolkit: {
      js: BASE + "shared/widget-kits/gauge/GaugeToolkit.js",
      css: undefined,
      globalKey: "DyniGaugeToolkit",
      deps: ["CanvasTextLayout", "ValueMath"]
    },
    RadialToolkit: {
      js: BASE + "shared/widget-kits/radial/RadialToolkit.js",
      css: undefined,
      globalKey: "DyniRadialToolkit",
      deps: ["GaugeToolkit", "RadialAngleMath", "RadialTickMath", "RadialCanvasPrimitives", "RadialFrameRenderer"]
    },
    SemicircleRadialEngine: {
      js: BASE + "shared/widget-kits/radial/SemicircleRadialEngine.js",
      css: undefined,
      globalKey: "DyniSemicircleRadialEngine",
      deps: [
        "RadialToolkit",
        "CanvasLayerCache",
        "SemicircleRadialLayout",
        "SemicircleRadialTextLayout",
        "RadialSectorMath",
        "RadialValueMath",
        "SpringEasing",
        "StableDigits",
        "StateScreenLabels",
        "StateScreenPrecedence",
        "StateScreenCanvasOverlay"
      ]
    },
    SemicircleRadialLayout: {
      js: BASE + "shared/widget-kits/radial/SemicircleRadialLayout.js",
      css: undefined,
      globalKey: "DyniSemicircleRadialLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath", "GeometryScale", "TextLayoutScaleHelpers", "ValueMath"]
    },
    SemicircleRadialTextLayout: {
      js: BASE + "shared/widget-kits/radial/SemicircleRadialTextLayout.js",
      css: undefined,
      globalKey: "DyniSemicircleRadialTextLayout",
      deps: ["TextLayoutScaleHelpers", "TextLayoutEngine", "HtmlWidgetUtils"]
    }
  };
}(this));
