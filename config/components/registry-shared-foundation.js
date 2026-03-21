/**
 * Module: DyniPlugin Shared Foundation Registry - Shared primitives/layout/theme component definitions
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
    throw new Error("dyninstruments: baseUrl missing before config/components/registry-shared-foundation.js load");
  }

  const groups = shared.componentRegistryGroups = shared.componentRegistryGroups || {};

  groups.sharedFoundation = {
    ActiveRouteHtmlFit: {
      js: BASE + "shared/widget-kits/nav/ActiveRouteHtmlFit.js",
      css: undefined,
      globalKey: "DyniActiveRouteHtmlFit",
      deps: ["ThemeResolver", "RadialTextLayout", "TextTileLayout", "ActiveRouteLayout"]
    },
    ActiveRouteLayout: {
      js: BASE + "shared/widget-kits/nav/ActiveRouteLayout.js",
      css: undefined,
      globalKey: "DyniActiveRouteLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
    },
    MapZoomHtmlFit: {
      js: BASE + "shared/widget-kits/nav/MapZoomHtmlFit.js",
      css: undefined,
      globalKey: "DyniMapZoomHtmlFit"
    },
    CanvasLayerCache: {
      js: BASE + "shared/widget-kits/canvas/CanvasLayerCache.js",
      css: undefined,
      globalKey: "DyniCanvasLayerCache"
    },
    CenterDisplayLayout: {
      js: BASE + "shared/widget-kits/nav/CenterDisplayLayout.js",
      css: undefined,
      globalKey: "DyniCenterDisplayLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
    },
    CenterDisplayMath: {
      js: BASE + "shared/widget-kits/nav/CenterDisplayMath.js",
      css: undefined,
      globalKey: "DyniCenterDisplayMath"
    },
    LayoutRectMath: {
      js: BASE + "shared/widget-kits/layout/LayoutRectMath.js",
      css: undefined,
      globalKey: "DyniLayoutRectMath"
    },
    LinearCanvasPrimitives: {
      js: BASE + "shared/widget-kits/linear/LinearCanvasPrimitives.js",
      css: undefined,
      globalKey: "DyniLinearCanvasPrimitives"
    },
    LinearGaugeLayout: {
      js: BASE + "shared/widget-kits/linear/LinearGaugeLayout.js",
      css: undefined,
      globalKey: "DyniLinearGaugeLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
    },
    LinearGaugeMath: {
      js: BASE + "shared/widget-kits/linear/LinearGaugeMath.js",
      css: undefined,
      globalKey: "DyniLinearGaugeMath"
    },
    LinearGaugeTextLayout: {
      js: BASE + "shared/widget-kits/linear/LinearGaugeTextLayout.js",
      css: undefined,
      globalKey: "DyniLinearGaugeTextLayout"
    },
    RadialAngleMath: {
      js: BASE + "shared/widget-kits/radial/RadialAngleMath.js",
      css: undefined,
      globalKey: "DyniRadialAngleMath"
    },
    RadialCanvasPrimitives: {
      js: BASE + "shared/widget-kits/radial/RadialCanvasPrimitives.js",
      css: undefined,
      globalKey: "DyniRadialCanvasPrimitives",
      deps: ["RadialAngleMath"]
    },
    RadialFrameRenderer: {
      js: BASE + "shared/widget-kits/radial/RadialFrameRenderer.js",
      css: undefined,
      globalKey: "DyniRadialFrameRenderer",
      deps: ["RadialAngleMath", "RadialTickMath", "RadialCanvasPrimitives"]
    },
    RadialTextFitting: {
      js: BASE + "shared/widget-kits/radial/RadialTextFitting.js",
      css: undefined,
      globalKey: "DyniRadialTextFitting"
    },
    RadialTextLayout: {
      js: BASE + "shared/widget-kits/radial/RadialTextLayout.js",
      css: undefined,
      globalKey: "DyniRadialTextLayout",
      deps: ["RadialTextFitting"]
    },
    RadialTickMath: {
      js: BASE + "shared/widget-kits/radial/RadialTickMath.js",
      css: undefined,
      globalKey: "DyniRadialTickMath",
      deps: ["RadialAngleMath"]
    },
    RadialValueMath: {
      js: BASE + "shared/widget-kits/radial/RadialValueMath.js",
      css: undefined,
      globalKey: "DyniRadialValueMath",
      deps: ["RadialAngleMath"]
    },
    ResponsiveScaleProfile: {
      js: BASE + "shared/widget-kits/layout/ResponsiveScaleProfile.js",
      css: undefined,
      globalKey: "DyniResponsiveScaleProfile"
    },
    TextLayoutComposite: {
      js: BASE + "shared/widget-kits/text/TextLayoutComposite.js",
      css: undefined,
      globalKey: "DyniTextLayoutComposite",
      deps: ["TextLayoutPrimitives"]
    },
    TextLayoutEngine: {
      js: BASE + "shared/widget-kits/text/TextLayoutEngine.js",
      css: undefined,
      globalKey: "DyniTextLayoutEngine",
      deps: ["RadialValueMath", "TextLayoutPrimitives", "TextLayoutComposite", "ResponsiveScaleProfile"]
    },
    TextLayoutPrimitives: {
      js: BASE + "shared/widget-kits/text/TextLayoutPrimitives.js",
      css: undefined,
      globalKey: "DyniTextLayoutPrimitives",
      deps: ["RadialTextLayout"]
    },
    TextTileLayout: {
      js: BASE + "shared/widget-kits/text/TextTileLayout.js",
      css: undefined,
      globalKey: "DyniTextTileLayout"
    },
    ThemePresets: {
      js: BASE + "shared/theme/ThemePresets.js",
      css: undefined,
      globalKey: "DyniThemePresets"
    },
    ThemeResolver: {
      js: BASE + "shared/theme/ThemeResolver.js",
      css: undefined,
      globalKey: "DyniThemeResolver"
    },
    XteHighwayLayout: {
      js: BASE + "shared/widget-kits/xte/XteHighwayLayout.js",
      css: undefined,
      globalKey: "DyniXteHighwayLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
    },
    XteHighwayPrimitives: {
      js: BASE + "shared/widget-kits/xte/XteHighwayPrimitives.js",
      css: undefined,
      globalKey: "DyniXteHighwayPrimitives"
    }
  };
}(this));
