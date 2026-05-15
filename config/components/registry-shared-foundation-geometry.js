/**
 * Module: DyniPlugin Shared Foundation Registry Geometry - Shared geometry, layout, and rendering component definitions
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
    throw new Error("dyninstruments: baseUrl missing before config/components/registry-shared-foundation-geometry.js load");
  }

  const groups = shared.componentRegistryGroups = shared.componentRegistryGroups || {};
  var sf = groups.sharedFoundation = groups.sharedFoundation || {};

  sf.RadialAngleMath = {
      js: BASE + "shared/widget-kits/radial/RadialAngleMath.js",
      css: undefined,
      globalKey: "DyniRadialAngleMath"
  };

  sf.RadialCanvasPrimitives = {
      js: BASE + "shared/widget-kits/radial/RadialCanvasPrimitives.js",
      css: undefined,
      globalKey: "DyniRadialCanvasPrimitives",
      deps: ["RadialAngleMath"]
  };

  sf.RadialFrameRenderer = {
      js: BASE + "shared/widget-kits/radial/RadialFrameRenderer.js",
      css: undefined,
      globalKey: "DyniRadialFrameRenderer",
      deps: ["RadialAngleMath", "RadialTickMath", "RadialCanvasPrimitives"]
  };

  sf.ValueMath = {
      js: BASE + "shared/widget-kits/value/ValueMath.js",
      css: undefined,
      globalKey: "DyniValueMath"
  };

  sf.CanvasTextFitting = {
      js: BASE + "shared/widget-kits/text/CanvasTextFitting.js",
      css: undefined,
      globalKey: "DyniCanvasTextFitting",
      deps: ["ValueMath"]
  };

  sf.CanvasTextLayout = {
      js: BASE + "shared/widget-kits/text/CanvasTextLayout.js",
      css: undefined,
      globalKey: "DyniCanvasTextLayout",
      deps: ["CanvasTextFitting"]
  };

  sf.RadialTextFitting = {
      js: BASE + "shared/widget-kits/radial/RadialTextFitting.js",
      css: undefined,
      globalKey: "DyniRadialTextFitting",
      deps: ["CanvasTextFitting"]
  };

  sf.RadialTextLayout = {
      js: BASE + "shared/widget-kits/radial/RadialTextLayout.js",
      css: undefined,
      globalKey: "DyniRadialTextLayout",
      deps: ["CanvasTextLayout"]
  };

  sf.RadialTickMath = {
      js: BASE + "shared/widget-kits/radial/RadialTickMath.js",
      css: undefined,
      globalKey: "DyniRadialTickMath",
      deps: ["RadialAngleMath"]
  };

  sf.RadialSectorMath = {
      js: BASE + "shared/widget-kits/radial/RadialSectorMath.js",
      css: undefined,
      globalKey: "DyniRadialSectorMath",
      deps: ["RadialAngleMath", "ValueMath"]
  };

  sf.RadialValueMath = {
      js: BASE + "shared/widget-kits/radial/RadialValueMath.js",
      css: undefined,
      globalKey: "DyniRadialValueMath",
      deps: ["RadialAngleMath", "ValueMath", "RadialSectorMath"]
  };

  sf.LinearCanvasPrimitives = {
      js: BASE + "shared/widget-kits/linear/LinearCanvasPrimitives.js",
      css: undefined,
      globalKey: "DyniLinearCanvasPrimitives"
  };

  sf.LinearGaugeEngineDrawing = {
      js: BASE + "shared/widget-kits/linear/LinearGaugeEngineDrawing.js",
      css: undefined,
      globalKey: "DyniLinearGaugeEngineDrawing",
      deps: ["LinearCanvasPrimitives"]
  };

  sf.LinearGaugeLayout = {
      js: BASE + "shared/widget-kits/linear/LinearGaugeLayout.js",
      css: undefined,
      globalKey: "DyniLinearGaugeLayout",
      deps: ["ResponsiveScaleProfile", "LayoutRectMath", "GeometryScale"]
  };

  sf.LinearGaugeMath = {
      js: BASE + "shared/widget-kits/linear/LinearGaugeMath.js",
      css: undefined,
      globalKey: "DyniLinearGaugeMath",
      deps: ["ValueMath"]
  };

  sf.LinearGaugeEngineSupport = {
      js: BASE + "shared/widget-kits/linear/LinearGaugeEngineSupport.js",
      css: undefined,
      globalKey: "DyniLinearGaugeEngineSupport"
  };

  sf.LinearGaugeLabelFit = {
      js: BASE + "shared/widget-kits/linear/LinearGaugeLabelFit.js",
      css: undefined,
      globalKey: "DyniLinearGaugeLabelFit"
  };

  sf.LinearGaugeTextLayout = {
      js: BASE + "shared/widget-kits/linear/LinearGaugeTextLayout.js",
      css: undefined,
      globalKey: "DyniLinearGaugeTextLayout",
      deps: ["LinearGaugeLabelFit"]
  };

  sf.TextLayoutPrimitives = {
      js: BASE + "shared/widget-kits/text/TextLayoutPrimitives.js",
      css: undefined,
      globalKey: "DyniTextLayoutPrimitives",
      deps: ["CanvasTextLayout"]
  };

  sf.TextTileLayout = {
      js: BASE + "shared/widget-kits/text/TextTileLayout.js",
      css: undefined,
      globalKey: "DyniTextTileLayout"
  };

  sf.TextFitMath = {
      js: BASE + "shared/widget-kits/text/TextFitMath.js",
      css: undefined,
      globalKey: "DyniTextFitMath",
      deps: ["ValueMath"]
  };

  sf.TextLayoutEngine = {
      js: BASE + "shared/widget-kits/text/TextLayoutEngine.js",
      css: undefined,
      globalKey: "DyniTextLayoutEngine",
      deps: ["ValueMath", "TextLayoutPrimitives", "TextLayoutComposite", "ResponsiveScaleProfile"]
  };

  sf.TextLayoutComposite = {
      js: BASE + "shared/widget-kits/text/TextLayoutComposite.js",
      css: undefined,
      globalKey: "DyniTextLayoutComposite",
      deps: ["TextLayoutPrimitives"]
  };

  sf.GeometryScale = {
      js: BASE + "shared/widget-kits/layout/GeometryScale.js",
      css: undefined,
      globalKey: "DyniGeometryScale",
      deps: ["ValueMath"]
  };

  sf.LayoutRectMath = {
      js: BASE + "shared/widget-kits/layout/LayoutRectMath.js",
      css: undefined,
      globalKey: "DyniLayoutRectMath"
  };

  sf.ResponsiveScaleProfile = {
      js: BASE + "shared/widget-kits/layout/ResponsiveScaleProfile.js",
      css: undefined,
      globalKey: "DyniResponsiveScaleProfile"
  };

}(this));
