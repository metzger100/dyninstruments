/**
 * @file DyniPlugin Shared Engines Registry - Shared rendering engine and layout component definitions
 * Documentation: documentation/architecture/component-system.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = (config.shared = config.shared || {});
  const BASE = ns.baseUrl;

  if (typeof BASE !== "string" || !BASE) {
    throw new Error("dyninstruments: baseUrl missing before config/components/registry-shared-engines.js load");
  }

  const groups = (shared.componentRegistryGroups = shared.componentRegistryGroups || {});

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
      deps: ["FullCircleRadialDrawing"]
    },
    FullCircleRadialDrawing: {
      js: BASE + "shared/widget-kits/radial/FullCircleRadialDrawing.js",
      css: undefined,
      globalKey: "DyniFullCircleRadialDrawing",
      deps: ["HtmlWidgetUtils", "FullCircleRadialMeasure"]
    },
    FullCircleRadialMeasure: {
      js: BASE + "shared/widget-kits/radial/FullCircleRadialMeasure.js",
      css: undefined,
      globalKey: "DyniFullCircleRadialMeasure",
      deps: ["ValueMath", "TextLayoutScaleHelpers"]
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
        "LinearGaugeEngineFrame",
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
    LinearGaugeEngineFrame: {
      js: BASE + "shared/widget-kits/linear/LinearGaugeEngineFrame.js",
      css: undefined,
      globalKey: "DyniLinearGaugeEngineFrame",
      deps: []
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
    RadialMajorValueLabels: {
      js: BASE + "shared/widget-kits/radial/RadialMajorValueLabels.js",
      css: undefined,
      globalKey: "DyniRadialMajorValueLabels",
      deps: ["RadialToolkit"]
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
        "StateScreenCanvasOverlay",
        "RadialMajorValueLabels"
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
})(this);
