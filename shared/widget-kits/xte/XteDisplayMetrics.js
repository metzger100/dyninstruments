/**
 * @file XteDisplayMetrics - Shared dynamic XTE value resolution/drawing and metric-tile
 * text building for the XTE highway widget
 * Documentation: documentation/widgets/xte-display.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniXteDisplayMetrics = factory();
  }
})(this, function () {
  "use strict";
  /** @typedef {Record<string, unknown> & { disconnect?: unknown, wpName?: unknown, xte?: unknown, cog?: unknown, dtw?: unknown, btw?: unknown }} DyniXteDisplayMetricsData */
  /** @typedef {Record<string, unknown> & { leadingZero?: unknown }} DyniXteDisplayMetricsLayoutConfig */

  /** @param {unknown} def @param {DyniComponentContext} componentContext */
  function create(def, componentContext) {
    const toolkit = /** @type {DyniGaugeToolkitApi} */ (componentContext.components.require("GaugeToolkit"));
    const primitives = componentContext.components.require("XteHighwayPrimitives");
    const layoutApi = componentContext.components.require("XteHighwayLayout");
    const tileLayout = componentContext.components.require("TextTileLayout");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const stableDigits = componentContext.components.require("StableDigits");
    const unitFormatter = componentContext.components.require("UnitAwareFormatter");

    /** @param {number | undefined} xteNumber @param {boolean} distanceMissing */
    function resolveXteSide(xteNumber, distanceMissing) {
      if (distanceMissing || xteNumber === undefined || xteNumber === 0) return "";
      return xteNumber > 0 ? "R" : "L";
    }

    /** @param {DyniXteDynamicOptions} options @param {number | undefined} xteNumber @param {string} xteDistance */
    function drawDynamicXte(options, xteNumber, xteDistance) {
      if (xteNumber === undefined) return;
      const xteDisplayAbs = unitFormatter.extractNumericDisplay(xteDistance, Math.abs(xteNumber));
      const signedDisplayXte = xteNumber < 0 ? -xteDisplayAbs : xteDisplayAbs;
      const overflow = Math.abs(xteDisplayAbs) > options.xteScale;
      const xteTarget = signedDisplayXte / options.xteScale;
      const xteEased = options.springMotion.resolve(options.canvas, xteTarget, options.easingEnabled, Date.now());
      const xteNormalized = toolkit.value.isFiniteNumber(xteEased) ? xteEased : xteTarget;
      primitives.drawDynamicHighway(
        options.ctx,
        options.geom,
        options.colors,
        xteNormalized,
        overflow,
        options.primaryDim,
        options.theme.strokeWeight,
        options.theme.pointerDepthWeight
      );
    }

    /** Extracts/formats the raw xte value and draws the dynamic highway pointer. @param {DyniXteDynamicOptions} options @returns {DyniXteDynamicXteResult} */
    function resolveAndDrawDynamicXte(options) {
      const display = options.display;
      const formatUnits = options.formatUnits;
      const layoutConfig = options.layoutConfig;
      const xteNumber = /** @type {number | undefined} */ (display.xte);
      const xteAvailable = xteNumber !== undefined;
      const headingParams = /** @type {[boolean]} */ ([layoutConfig.leadingZero !== false]);
      const defaultText = placeholderNormalize.normalize(undefined, options.props.default);

      const xteDistance = unitFormatter.formatDistance(
        xteNumber === undefined ? undefined : Math.abs(xteNumber),
        formatUnits.xte,
        defaultText
      );
      const dtwDistance = unitFormatter.formatDistance(display.dtw, formatUnits.dtw, defaultText);

      const xteDistanceMissing = placeholderNormalize.isPlaceholder(xteDistance);
      const xteSide = resolveXteSide(xteNumber, xteDistanceMissing);
      drawDynamicXte(options, xteNumber, xteDistance);

      return {
        xteNumber,
        xteAvailable,
        xteDistance,
        xteDistanceMissing,
        xteSide,
        defaultText,
        dtwDistance,
        cogRaw: display.cog,
        btwRaw: display.btw,
        headingParams
      };
    }

    /** Applies stable-digits padding to the xte value text, probing whether it clips the metric tile before committing to it. @param {DyniXteStableDigitsOptions} options @returns {string} */
    function resolveStableDigitsXteText(options) {
      const { ctx, xteDistance, xteSide, family, valueWeight, labelWeight, layout, metricSpacing, metricRects } =
        options;
      const captions = options.captions;
      const units = options.units;
      const xteStable = stableDigits.normalize(xteDistance, {
        integerWidth: stableDigits.resolveIntegerWidth(xteDistance, 2),
        reserveSignSlot: false,
        sideSuffix: xteSide,
        reserveSideSuffixSlot: true
      });
      if (xteStable.padded === xteStable.plain) {
        return xteStable.padded;
      }
      const probe = /** @type {{ fit?: { total: number }, textW: number } | null} */ (
        tileLayout.measureMetricTile({
          textApi: toolkit.text,
          ctx: ctx,
          metric: { caption: captions.xte, value: xteStable.padded, unit: units.xte },
          rect: metricRects.xte,
          family: family,
          valueWeight: valueWeight,
          labelWeight: labelWeight,
          secScale: 0.7,
          textFillScale: layout.responsive.textFillScale,
          padX: metricSpacing.xte.padX,
          captionHeightPx: metricSpacing.xte.captionHeightPx
        })
      );
      const fit = probe && probe.fit ? probe.fit : null;
      const clipped = !!(probe && fit && fit.total > probe.textW + 0.01);
      return clipped ? xteStable.plain : xteStable.padded;
    }

    /** @param {DyniXteMetricsOptions} options @returns {DyniXteDisplayMetricsBuildResult} */
    function buildXteMetrics(options) {
      const { ctx, dyn, stableDigitsEnabled, themeView, layout, metricRects } = options;
      const captions = options.captions;
      const units = options.units;
      const trackValue = unitFormatter.formatWithToken(
        dyn.cogRaw,
        "formatDirection360",
        dyn.headingParams[0],
        dyn.defaultText
      );
      const bearingValue = unitFormatter.formatWithToken(
        dyn.btwRaw,
        "formatDirection360",
        dyn.headingParams[0],
        dyn.defaultText
      );
      const metricSpacing = {
        cog: layoutApi.computeMetricTileSpacing(metricRects.cog, layout.responsive),
        xte: layoutApi.computeMetricTileSpacing(metricRects.xte, layout.responsive),
        dtw: layoutApi.computeMetricTileSpacing(metricRects.dtw, layout.responsive),
        btw: layoutApi.computeMetricTileSpacing(metricRects.btw, layout.responsive)
      };
      let xteValueText = dyn.xteDistance + dyn.xteSide;
      if (stableDigitsEnabled) {
        xteValueText = resolveStableDigitsXteText({
          ctx: ctx,
          xteDistance: dyn.xteDistance,
          xteSide: dyn.xteSide,
          captions: captions,
          units: units,
          family: themeView.family,
          valueWeight: themeView.valueWeight,
          labelWeight: themeView.labelWeight,
          layout: layout,
          metricSpacing: metricSpacing,
          metricRects: metricRects
        });
      }
      const metrics = {
        cog: { caption: captions.track, value: trackValue, unit: units.track },
        xte: { caption: captions.xte, value: xteValueText, unit: units.xte },
        dtw: { caption: captions.dtw, value: dyn.dtwDistance, unit: units.dtw },
        btw: { caption: captions.brg, value: bearingValue, unit: units.brg }
      };
      return { metricSpacing, metrics };
    }

    return {
      resolveAndDrawDynamicXte: resolveAndDrawDynamicXte,
      buildXteMetrics: buildXteMetrics
    };
  }

  return { id: "XteDisplayMetrics", create: create };
});
