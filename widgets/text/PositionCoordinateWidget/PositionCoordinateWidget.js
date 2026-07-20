/**
 * @file PositionCoordinateWidget - Stacked latitude/longitude renderer for nav position kinds
 * Documentation: documentation/widgets/position-coordinates.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniPositionCoordinateWidget = factory();
  }
})(this, function () {
  "use strict";
  /** @typedef {{ resolveForRoot(rootEl: unknown): { font: { family: string, familyMono?: string, weight: unknown, labelWeight: unknown }, surface: { fg: string }, opacity?: { caption?: unknown, unit?: unknown } } }} DyniPositionCoordinateThemeResolver */
  /** @typedef {DyniComponentContext & { theme: { tokens: DyniPositionCoordinateThemeResolver }, canvas: DyniCanvasHostApi }} DyniPositionCoordinateWidgetContext */

  /** @param {unknown} def @param {DyniPositionCoordinateWidgetContext} componentContext */
  function create(def, componentContext) {
    const theme = componentContext.theme.tokens;
    const text = componentContext.components.require("TextLayoutEngine");
    const valueMath = componentContext.components.require("ValueMath");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenCanvasOverlay = componentContext.components.require("StateScreenCanvasOverlay");
    const coordFormatting = componentContext.components.require("PositionCoordinateFormatting");
    const toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;
    const formatServices = { componentContext, placeholderNormalize, toOptionalFiniteNumber };
    const fitCache = text.createFitCache(["flat", "stacked"]);
    /** @param {HTMLCanvasElement} canvas @param {DyniWidgetValues} props */
    function renderCanvas(canvas, props) {
      const p = coordFormatting.resolveVariantProps(props);
      const setup = componentContext.canvas.setupCanvas(canvas);
      const ctx = setup && setup.ctx;
      const W = setup && setup.W;
      const H = setup && setup.H;
      if (!ctx || !W || !H) {
        return;
      }
      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = "middle";
      const rootEl = componentContext.dom.requirePluginRoot(canvas);
      const tokens = theme.resolveForRoot(rootEl);
      const displayVariant = coordFormatting.normalizeDisplayVariant(p.displayVariant);
      const isCoordinateVariant = displayVariant === coordFormatting.DISPLAY_VARIANT_POSITION;
      const coordinatesTabular = p.coordinatesTabular !== false;
      const effectiveCoordinatesTabular = isCoordinateVariant ? coordinatesTabular : false;
      const stableDigitsEnabled = isCoordinateVariant ? p.stableDigits === true : p.stableDigits !== false;
      const family =
        effectiveCoordinatesTabular || stableDigitsEnabled
          ? tokens.font.familyMono || tokens.font.family
          : tokens.font.family;
      const color = tokens.surface.fg;
      const valueWeight = tokens.font.weight;
      const labelWeight = tokens.font.labelWeight;
      const captionOpacity = tokens.opacity && typeof tokens.opacity === "object" ? tokens.opacity.caption : undefined;
      const unitOpacity = tokens.opacity && typeof tokens.opacity === "object" ? tokens.opacity.unit : undefined;
      const coordinateAlign = effectiveCoordinatesTabular ? "right" : "center";
      ctx.fillStyle = color;
      const stateKind = stateScreenPrecedence.pickFirst([
        { kind: "disconnected", when: p.disconnect === true },
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
      const modeData = text.computeModeLayout({
        W: W,
        H: H,
        ratioThresholdNormal: p.ratioThresholdNormal,
        ratioThresholdFlat: p.ratioThresholdFlat,
        captionUnitScale: p.captionUnitScale,
        captionText: p.caption,
        unitText: p.unit
      });
      const insets = text.computeResponsiveInsets(W, H);
      const textFillScale = insets.responsive.textFillScale;
      const defaultText = /** @type {string} */ (p.default);
      if (modeData.mode === "flat") {
        const pairRaw = coordFormatting.readCoordinatePair(p.value, true, toOptionalFiniteNumber);
        const useAxisFlat = !!p.coordinateFlatFromAxes;
        const topText = useAxisFlat
          ? coordFormatting.formatAxisValue(pairRaw ? pairRaw.lat : null, "lat", defaultText, p, formatServices)
          : "";
        const bottomText = useAxisFlat
          ? coordFormatting.formatAxisValue(pairRaw ? pairRaw.lon : null, "lon", defaultText, p, formatServices)
          : "";
        const valueText = useAxisFlat
          ? (topText + " " + bottomText).trim() || defaultText
          : placeholderNormalize.normalize(String(componentContext.format.applyFormatter(p.value, p)), defaultText);
        const statusEmoji = useAxisFlat && coordFormatting.isTimeStatusMarker(topText);
        const key = text.makeFitCacheKey({
          mode: "flat",
          W: W,
          H: H,
          caption: modeData.caption,
          unit: modeData.unit,
          value: valueText,
          secScale: modeData.secScale,
          family: family,
          valueWeight: valueWeight,
          labelWeight: labelWeight,
          statusEmoji: statusEmoji
        });
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
            labelWeight: labelWeight,
            extraValueCheck: /** @param {{ maxH: number, valueMetrics: unknown, valuePx: number }} meta */ function (
              meta
            ) {
              if (!statusEmoji) {
                return true;
              }
              const safeHeight = meta.maxH * coordFormatting.TIME_STATUS_SCALE_LIMIT;
              const h = coordFormatting.readActualTextHeight(meta.valueMetrics);
              return h == null ? meta.valuePx <= safeHeight : h <= safeHeight;
            }
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
          labelWeight: labelWeight,
          captionOpacity: captionOpacity,
          unitOpacity: unitOpacity
        });
      } else {
        const parsed = coordFormatting.readCoordinatePair(
          p.value,
          p.coordinateRawValues === true,
          toOptionalFiniteNumber
        );
        const latText = parsed
          ? coordFormatting.formatAxisValue(parsed.lat, "lat", defaultText, p, formatServices)
          : defaultText;
        const lonText = parsed
          ? coordFormatting.formatAxisValue(parsed.lon, "lon", defaultText, p, formatServices)
          : defaultText;
        const topStatusEmoji = coordFormatting.isTimeStatusMarker(latText);
        const key = text.makeFitCacheKey({
          mode: modeData.mode,
          W: W,
          H: H,
          caption: modeData.caption,
          unit: modeData.unit,
          latText: latText,
          lonText: lonText,
          secScale: modeData.secScale,
          align: coordinateAlign,
          family: family,
          valueWeight: valueWeight,
          labelWeight: labelWeight
        });
        const fit = text.resolveFitCache(fitCache, "stacked", key, function () {
          return text.fitTwoRowsWithHeader({
            ctx: ctx,
            mode: modeData.mode,
            W: W,
            H: H,
            padX: insets.padX,
            innerY: insets.innerY,
            textFillScale: textFillScale,
            secScale: modeData.secScale,
            captionText: modeData.caption,
            unitText: modeData.unit,
            topText: latText,
            bottomText: lonText,
            align: coordinateAlign,
            family: family,
            valueWeight: valueWeight,
            labelWeight: labelWeight,
            topRowExtraCheck: /** @param {{ maxH: number, metrics: unknown, px: number }} meta */ function (meta) {
              if (!topStatusEmoji) {
                return true;
              }
              const safeHeight = meta.maxH * coordFormatting.TIME_STATUS_SCALE_LIMIT;
              const h = coordFormatting.readActualTextHeight(meta.metrics);
              return h == null ? meta.px <= safeHeight : h <= safeHeight;
            }
          });
        });
        text.drawTwoRowsWithHeader({
          ctx: ctx,
          fit: fit,
          W: W,
          padX: insets.padX,
          captionText: modeData.caption,
          unitText: modeData.unit,
          topText: latText,
          bottomText: lonText,
          family: family,
          valueWeight: valueWeight,
          labelWeight: labelWeight,
          captionOpacity: captionOpacity,
          unitOpacity: unitOpacity
        });
      }
    }
    function translateFunction() {
      return {};
    }
    return {
      id: "PositionCoordinateWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }
  return { id: "PositionCoordinateWidget", create: create };
});
