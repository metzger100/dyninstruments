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
      deps: ["RadialToolkit", "CanvasLayerCache", "FullCircleRadialLayout"]
    },
    FullCircleRadialLayout: {
      js: BASE + "shared/widget-kits/radial/FullCircleRadialLayout.js",
      css: undefined,
      globalKey: "DyniFullCircleRadialLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
    },
    FullCircleRadialTextLayout: {
      js: BASE + "shared/widget-kits/radial/FullCircleRadialTextLayout.js",
      css: undefined,
      globalKey: "DyniFullCircleRadialTextLayout"
    },
    LinearGaugeEngine: {
      js: BASE + "shared/widget-kits/linear/LinearGaugeEngine.js",
      css: undefined,
      globalKey: "DyniLinearGaugeEngine",
      deps: ["RadialToolkit", "CanvasLayerCache", "LinearCanvasPrimitives", "LinearGaugeMath", "LinearGaugeLayout", "LinearGaugeTextLayout"]
    },
    RadialToolkit: {
      js: BASE + "shared/widget-kits/radial/RadialToolkit.js",
      css: undefined,
      globalKey: "DyniRadialToolkit",
      deps: ["ThemeResolver", "RadialTextLayout", "RadialValueMath", "RadialAngleMath", "RadialTickMath", "RadialCanvasPrimitives", "RadialFrameRenderer"]
    },
    SemicircleRadialEngine: {
      js: BASE + "shared/widget-kits/radial/SemicircleRadialEngine.js",
      css: undefined,
      globalKey: "DyniSemicircleRadialEngine",
      deps: ["RadialToolkit", "SemicircleRadialLayout", "SemicircleRadialTextLayout"]
    },
    SemicircleRadialLayout: {
      js: BASE + "shared/widget-kits/radial/SemicircleRadialLayout.js",
      css: undefined,
      globalKey: "DyniSemicircleRadialLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
    },
    SemicircleRadialTextLayout: {
      js: BASE + "shared/widget-kits/radial/SemicircleRadialTextLayout.js",
      css: undefined,
      globalKey: "DyniSemicircleRadialTextLayout"
    }
  };
}(this));
