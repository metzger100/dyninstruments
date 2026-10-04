/**
 * @file DyniPlugin Shared Foundation Registry Geometry - Shared geometry, layout, and rendering component definitions
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
      "dyninstruments: baseUrl missing before config/components/registry-shared-foundation-geometry.js load"
    );
  }

  const groups = (shared.componentRegistryGroups = shared.componentRegistryGroups || {});
  var sf = (groups.sharedFoundation = groups.sharedFoundation || {});

  sf.RadialAngleMath = {
    js: BASE + "shared/widget-kits/radial/RadialAngleMath.js",
    globalKey: "DyniRadialAngleMath"
  };

  sf.RadialCanvasPrimitives = {
    js: BASE + "shared/widget-kits/radial/RadialCanvasPrimitives.js",
    globalKey: "DyniRadialCanvasPrimitives",
    deps: ["RadialAngleMath", "ValueMath"]
  };

  sf.RadialFrameRenderer = {
    js: BASE + "shared/widget-kits/radial/RadialFrameRenderer.js",
    globalKey: "DyniRadialFrameRenderer",
    deps: ["RadialAngleMath", "RadialTickMath", "RadialCanvasPrimitives", "ValueMath"]
  };

  sf.ValueMath = {
    js: BASE + "shared/widget-kits/value/ValueMath.js",
    globalKey: "DyniValueMath"
  };

  sf.HtmlMeasureUtils = {
    js: BASE + "shared/widget-kits/html/HtmlMeasureUtils.js",
    globalKey: "DyniHtmlMeasureUtils",
    deps: ["ValueMath"]
  };

  sf.CanvasTextFitting = {
    js: BASE + "shared/widget-kits/text/CanvasTextFitting.js",
    globalKey: "DyniCanvasTextFitting",
    deps: ["ValueMath"]
  };

  sf.CanvasTextLayout = {
    js: BASE + "shared/widget-kits/text/CanvasTextLayout.js",
    globalKey: "DyniCanvasTextLayout",
    deps: ["CanvasTextFitting"]
  };

  sf.RadialTextFitting = {
    js: BASE + "shared/widget-kits/radial/RadialTextFitting.js",
    globalKey: "DyniRadialTextFitting",
    deps: ["CanvasTextFitting"]
  };

  sf.RadialTextLayout = {
    js: BASE + "shared/widget-kits/radial/RadialTextLayout.js",
    globalKey: "DyniRadialTextLayout",
    deps: ["CanvasTextLayout"]
  };

  sf.RadialTickMath = {
    js: BASE + "shared/widget-kits/radial/RadialTickMath.js",
    globalKey: "DyniRadialTickMath",
    deps: ["RadialAngleMath"]
  };

  sf.RadialSectorMath = {
    js: BASE + "shared/widget-kits/radial/RadialSectorMath.js",
    globalKey: "DyniRadialSectorMath",
    deps: ["RadialAngleMath", "ValueMath"]
  };

  sf.RadialValueMath = {
    js: BASE + "shared/widget-kits/radial/RadialValueMath.js",
    globalKey: "DyniRadialValueMath",
    deps: ["RadialAngleMath", "ValueMath", "RadialSectorMath"]
  };

  sf.LinearCanvasPrimitives = {
    js: BASE + "shared/widget-kits/linear/LinearCanvasPrimitives.js",
    globalKey: "DyniLinearCanvasPrimitives"
  };

  sf.LinearGaugeEngineDrawing = {
    js: BASE + "shared/widget-kits/linear/LinearGaugeEngineDrawing.js",
    globalKey: "DyniLinearGaugeEngineDrawing",
    deps: ["LinearCanvasPrimitives"]
  };

  sf.LinearGaugeLayout = {
    js: BASE + "shared/widget-kits/linear/LinearGaugeLayout.js",
    globalKey: "DyniLinearGaugeLayout",
    deps: ["ResponsiveScaleProfile", "LayoutRectMath", "GeometryScale", "ValueMath", "LinearGaugeLayoutVariants"]
  };

  sf.LinearGaugeLayoutVariants = {
    js: BASE + "shared/widget-kits/linear/LinearGaugeLayoutVariants.js",
    globalKey: "DyniLinearGaugeLayoutVariants",
    deps: ["LayoutRectMath"]
  };

  sf.LinearGaugeMath = {
    js: BASE + "shared/widget-kits/linear/LinearGaugeMath.js",
    globalKey: "DyniLinearGaugeMath",
    deps: ["ValueMath"]
  };

  sf.LinearGaugeEngineSupport = {
    js: BASE + "shared/widget-kits/linear/LinearGaugeEngineSupport.js",
    globalKey: "DyniLinearGaugeEngineSupport",
    deps: ["HtmlWidgetUtils"]
  };

  sf.LinearGaugeLabelFit = {
    js: BASE + "shared/widget-kits/linear/LinearGaugeLabelFit.js",
    globalKey: "DyniLinearGaugeLabelFit",
    deps: ["CanvasTextFitting", "HtmlWidgetUtils", "ValueMath"]
  };

  sf.LinearGaugeTextLayout = {
    js: BASE + "shared/widget-kits/linear/LinearGaugeTextLayout.js",
    globalKey: "DyniLinearGaugeTextLayout",
    deps: ["LinearGaugeLabelFit", "TextLayoutScaleHelpers", "CanvasTextFitting", "HtmlWidgetUtils"]
  };

  sf.TextLayoutPrimitives = {
    js: BASE + "shared/widget-kits/text/TextLayoutPrimitives.js",
    globalKey: "DyniTextLayoutPrimitives",
    deps: ["CanvasTextLayout"]
  };

  sf.TextTileLayout = {
    js: BASE + "shared/widget-kits/text/TextTileLayout.js",
    globalKey: "DyniTextTileLayout",
    deps: ["ValueMath", "TextLayoutScaleHelpers"]
  };

  sf.TextFitMath = {
    js: BASE + "shared/widget-kits/text/TextFitMath.js",
    globalKey: "DyniTextFitMath",
    deps: ["ValueMath"]
  };

  sf.TextLayoutEngine = {
    js: BASE + "shared/widget-kits/text/TextLayoutEngine.js",
    globalKey: "DyniTextLayoutEngine",
    deps: ["ValueMath", "TextLayoutPrimitives", "TextLayoutComposite", "ResponsiveScaleProfile"]
  };

  sf.TextLayoutComposite = {
    js: BASE + "shared/widget-kits/text/TextLayoutComposite.js",
    globalKey: "DyniTextLayoutComposite",
    deps: ["TextLayoutPrimitives", "TextLayoutScaleHelpers"]
  };

  sf.TextLayoutScaleHelpers = {
    js: BASE + "shared/widget-kits/text/TextLayoutScaleHelpers.js",
    globalKey: "DyniTextLayoutScaleHelpers",
    deps: ["ValueMath"]
  };

  sf.PositionCoordinateFormatting = {
    js: BASE + "shared/widget-kits/text/PositionCoordinateFormatting.js",
    globalKey: "DyniPositionCoordinateFormatting"
  };

  sf.GeometryScale = {
    js: BASE + "shared/widget-kits/layout/GeometryScale.js",
    globalKey: "DyniGeometryScale",
    deps: ["ValueMath"]
  };

  sf.LayoutRectMath = {
    js: BASE + "shared/widget-kits/layout/LayoutRectMath.js",
    globalKey: "DyniLayoutRectMath"
  };

  sf.LayoutSizingHelpers = {
    js: BASE + "shared/widget-kits/layout/LayoutSizingHelpers.js",
    globalKey: "DyniLayoutSizingHelpers"
  };

  sf.ResponsiveScaleProfile = {
    js: BASE + "shared/widget-kits/layout/ResponsiveScaleProfile.js",
    globalKey: "DyniResponsiveScaleProfile",
    deps: ["ValueMath"]
  };
})(this);
