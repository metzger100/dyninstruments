/**
 * Module: ThreeValueTextWidget - Responsive caption/value/unit numeric canvas renderer
 * Documentation: documentation/widgets/three-elements.md
 * Depends: componentContext.format.applyFormatter, componentContext.theme.tokens, TextLayoutEngine, PlaceholderNormalize, StableDigits, StateScreenLabels, StateScreenPrecedence, StateScreenCanvasOverlay
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniThreeValueTextWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    const theme = componentContext.theme.tokens;
    const text = componentContext.components.require("TextLayoutEngine");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const stableDigits = componentContext.components.require("StableDigits");
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenCanvasOverlay = componentContext.components.require("StateScreenCanvasOverlay");
    const fitCache = text.createFitCache(["high", "normal", "flat"]);

    function renderCanvas(canvas, props) {
      const setup = componentContext.canvas.setupCanvas(canvas);
      const ctx = setup.ctx;
      const W = setup.W;
      const H = setup.H;
      if (!W || !H) {
        return;
      }

      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = "middle";
      const rootEl = componentContext.dom.requirePluginRoot(canvas);
      const tokens = theme.resolveForRoot(rootEl);
      const stableDigitsEnabled = props.stableDigits === true;
      const family = stableDigitsEnabled
        ? (tokens.font.familyMono || tokens.font.family)
        : tokens.font.family;
      const color = tokens.surface.fg;
      const valueWeight = tokens.font.weight;
      const labelWeight = tokens.font.labelWeight;
      ctx.fillStyle = color;
      const stateKind = stateScreenPrecedence.pickFirst([
        { kind: "disconnected", when: props.disconnect === true },
        { kind: "data", when: true }
      ]);
      if (stateKind !== stateScreenLabels.KINDS.DATA) {
        stateScreenCanvasOverlay.drawStateScreen({
          ctx: ctx,
          W: W,
          H: H,
          family: family,
          color: color,
          labelWeight: labelWeight,
          kind: stateKind
        });
        return;
      }

      const defaultText = Object.prototype.hasOwnProperty.call(props || {}, "default")
        ? String(props.default)
        : undefined;
      const normalizedValueText = placeholderNormalize.normalize(
        String(componentContext.format.applyFormatter(props.value, props)),
        defaultText
      );
      const stableValue = stableDigitsEnabled
        ? stableDigits.normalize(normalizedValueText, {
          integerWidth: stableDigits.resolveIntegerWidth(normalizedValueText, 2),
          reserveSignSlot: true
        })
        : { padded: normalizedValueText, plain: normalizedValueText };
      const valueText = stableValue.padded;
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
      const insets = text.computeResponsiveInsets(W, H);
      const textFillScale = insets.responsive.textFillScale;
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
            textFillScale: textFillScale,
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
            textFillScale: textFillScale,
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
            maxH: Math.max(1, H - insets.innerY * 2),
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

    }

    function translateFunction() { return {}; }

    return {
      id: "ThreeValueTextWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "ThreeValueTextWidget", create: create };
}));
