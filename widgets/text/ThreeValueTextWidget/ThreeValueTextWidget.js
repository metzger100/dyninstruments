/**
 * Module: ThreeValueTextWidget - Responsive caption/value/unit numeric canvas renderer
 * Documentation: documentation/widgets/three-elements.md
 * Depends: Helpers.applyFormatter, ThemeResolver, TextLayoutEngine
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniThreeValueTextWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const theme = Helpers.getModule("ThemeResolver").create(def, Helpers);
    const text = Helpers.getModule("TextLayoutEngine").create(def, Helpers);
    const fitCache = text.createFitCache(["high", "normal", "flat"]);

    function renderCanvas(canvas, props) {
      const setup = Helpers.setupCanvas(canvas);
      const ctx = setup.ctx;
      const W = setup.W;
      const H = setup.H;
      if (!W || !H) {
        return;
      }

      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = "middle";
      const tokens = theme.resolve(canvas);
      const family = Helpers.resolveFontFamily(canvas);
      const color = Helpers.resolveTextColor(canvas);
      const valueWeight = tokens.font.weight;
      const labelWeight = tokens.font.labelWeight;
      ctx.fillStyle = color;

      const valueText = String(Helpers.applyFormatter(props.value, props));
      const modeData = text.computeModeLayout({
        W: W,
        H: H,
        ratioThresholdNormal: props.ratioThresholdNormal,
        ratioThresholdFlat: props.ratioThresholdFlat,
        captionUnitScale: props.captionUnitScale,
        captionText: props.caption,
        unitText: props.unit,
        collapseNoCaptionToFlat: true,
        collapseHighWithoutUnitToNormal: true
      });
      const insets = text.computeInsets(W, H);
      const keyBase = {
        W: W,
        H: H,
        caption: modeData.caption,
        unit: modeData.unit,
        value: valueText,
        secScale: modeData.secScale,
        family: family,
        valueWeight: valueWeight,
        labelWeight: labelWeight
      };

      if (modeData.mode === "high") {
        const key = text.makeFitCacheKey({ mode: "high", base: keyBase });
        const fit = text.resolveFitCache(fitCache, "high", key, function () {
          return text.fitThreeRowBlock({
            ctx: ctx,
            W: W,
            H: H,
            padX: insets.padX,
            innerY: insets.innerY,
            secScale: modeData.secScale,
            captionText: modeData.caption,
            valueText: valueText,
            unitText: modeData.unit,
            family: family,
            valueWeight: valueWeight,
            labelWeight: labelWeight
          });
        });
        text.drawThreeRowBlock({
          ctx: ctx,
          fit: fit,
          W: W,
          padX: insets.padX,
          captionText: modeData.caption,
          valueText: valueText,
          unitText: modeData.unit,
          family: family,
          valueWeight: valueWeight,
          labelWeight: labelWeight
        });
      } else if (modeData.mode === "normal") {
        const key = text.makeFitCacheKey({ mode: "normal", base: keyBase });
        const fit = text.resolveFitCache(fitCache, "normal", key, function () {
          return text.fitValueUnitCaptionRows({
            ctx: ctx,
            W: W,
            H: H,
            padX: insets.padX,
            innerY: insets.innerY,
            gapBase: insets.gapBase,
            secScale: modeData.secScale,
            captionText: modeData.caption,
            valueText: valueText,
            unitText: modeData.unit,
            family: family,
            valueWeight: valueWeight,
            labelWeight: labelWeight
          });
        });
        text.drawValueUnitCaptionRows({
          ctx: ctx,
          fit: fit,
          W: W,
          padX: insets.padX,
          captionText: modeData.caption,
          valueText: valueText,
          unitText: modeData.unit,
          family: family,
          valueWeight: valueWeight,
          labelWeight: labelWeight
        });
      } else {
        const key = text.makeFitCacheKey({ mode: "flat", base: keyBase });
        const fit = text.resolveFitCache(fitCache, "flat", key, function () {
          return text.fitInlineTriplet({
            ctx: ctx,
            captionText: modeData.caption,
            valueText: valueText,
            unitText: modeData.unit,
            secScale: modeData.secScale,
            gap: insets.gapBase,
            maxW: W - insets.padX * 2,
            maxH: Math.max(10, H - insets.innerY * 2),
            family: family,
            valueWeight: valueWeight,
            labelWeight: labelWeight
          });
        });
        text.drawInlineTriplet({
          ctx: ctx,
          fit: fit,
          captionText: modeData.caption,
          valueText: valueText,
          unitText: modeData.unit,
          x: 0,
          y: 0,
          W: W,
          H: H,
          family: family,
          valueWeight: valueWeight,
          labelWeight: labelWeight
        });
      }

      if (props.disconnect) {
        text.drawDisconnectOverlay({
          ctx: ctx,
          W: W,
          H: H,
          family: family,
          color: color,
          labelWeight: labelWeight
        });
      }
    }

    function translateFunction() { return {}; }

    return {
      id: "ThreeValueTextWidget",
      version: "4.3.0",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "ThreeValueTextWidget", create: create };
}));
