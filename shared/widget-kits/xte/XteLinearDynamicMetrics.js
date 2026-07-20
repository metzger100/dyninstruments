/**
 * @file XteLinearDynamicMetrics - Dynamic XTE value/pointer resolution and metric-text formatting for the linear bar
 * Documentation: documentation/widgets/xte-display.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniXteLinearDynamicMetrics = factory();
  }
})(this, function () {
  "use strict";

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniXteLinearDynamicMetricsApi}
   */
  function create(def, componentContext) {
    const toolkit = /** @type {DyniGaugeToolkitApi} */ (componentContext.components.require("GaugeToolkit"));
    const gaugeMath = componentContext.components.require("LinearGaugeMath");
    const linearPrimitives = componentContext.components.require("XteLinearPrimitives");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const unitFormatter = componentContext.components.require("UnitAwareFormatter");
    const stableDigits = componentContext.components.require("StableDigits");
    const layoutApi = componentContext.components.require("XteLinearLayout");
    const tileLayout = componentContext.components.require("TextTileLayout");
    const springMotion = componentContext.components.require("SpringEasing").createMotion();

    /** @param {HTMLCanvasElement} canvas @returns {boolean} */
    function isPointerMotionActive(canvas) {
      return springMotion.isActive(canvas);
    }

    /** @param {number | undefined} xteNumber @param {string} xteDistance */
    function resolveSignedDisplayXte(xteNumber, xteDistance) {
      if (xteNumber === undefined) return NaN;
      const displayAbs = unitFormatter.extractNumericDisplay(xteDistance, Math.abs(xteNumber));
      if (!Number.isFinite(displayAbs)) return NaN;
      return xteNumber < 0 ? -displayAbs : displayAbs;
    }

    /** @param {DyniXteLinearPointerOptions} options @param {number} signedXte */
    function drawLinearPointer(options, signedXte) {
      if (!Number.isFinite(signedXte)) return;
      const { canvas, ctx, geom, theme, xteScale, easingEnabled } = options;
      const targetRatio = signedXte / xteScale;
      const easedRatio = springMotion.resolve(canvas, targetRatio, easingEnabled, Date.now());
      const resolvedRatio = Number.isFinite(easedRatio) ? easedRatio : targetRatio;
      const pointerX = gaugeMath.mapValueToX(resolvedRatio * xteScale, -xteScale, xteScale, geom.x0, geom.x1, true);
      if (!Number.isFinite(pointerX)) return;
      const color = Math.abs(signedXte) > xteScale ? theme.colors.alarm : theme.colors.pointer;
      linearPrimitives.drawPointerUpward(ctx, Math.round(pointerX), geom, color);
    }

    /**
     * Extracts/formats the raw xte value and draws the dynamic pointer.
     * @param {DyniXteLinearPointerOptions} options
     * @returns {{ xteNumber: number | undefined, xteHasValue: boolean, defaultText: string, xteDistance: string, xteDistanceMissing: boolean }}
     */
    function resolveAndDrawLinearPointer(options) {
      const display = options.display;
      const formatUnits = options.formatUnits;
      const xteNumber = /** @type {number | undefined} */ (display.xte);
      const xteHasValue = xteNumber !== undefined;
      const defaultText = placeholderNormalize.normalize(undefined, options.props.default);
      const xteDistance = unitFormatter.formatDistance(
        xteNumber === undefined ? undefined : Math.abs(xteNumber),
        formatUnits.xte,
        defaultText
      );
      const xteDistanceMissing = placeholderNormalize.isPlaceholder(xteDistance);
      drawLinearPointer(options, resolveSignedDisplayXte(xteNumber, xteDistance));

      return {
        xteNumber,
        xteHasValue,
        defaultText,
        xteDistance,
        xteDistanceMissing
      };
    }

    /** Applies stable-digits padding to the xte value text, probing whether it clips the metric tile before committing to it. @param {DyniXteLinearStableDigitsOptions} options @returns {string} */
    function resolveStableDigitsXteTextLinear(options) {
      const { ctx, xteDistance, xteSide, family, valueWeight, labelWeight, layout, metricRects } = options;
      const captions = options.captions;
      const units = options.units;
      const xteStable = stableDigits.normalize(xteDistance, {
        integerWidth: stableDigits.resolveIntegerWidth(xteDistance, 2),
        reserveSignSlot: false,
        sideSuffix: xteSide,
        reserveSideSuffixSlot: true
      });
      if (xteStable.padded === xteStable.plain || !metricRects || !metricRects.xte) {
        return xteStable.padded;
      }
      const xteSpacing = layoutApi.computeMetricTileSpacing(metricRects.xte, layout.responsive);
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
          padX: xteSpacing.padX,
          captionHeightPx: xteSpacing.captionHeightPx
        })
      );
      const fit = probe && probe.fit ? probe.fit : null;
      const clipped = !!(probe && fit && fit.total > probe.textW + 0.01);
      return clipped ? xteStable.plain : xteStable.padded;
    }

    /**
     * Formats the track/dtw/bearing text metrics and assembles the per-field metrics record.
     * @param {DyniXteLinearMetricsOptions} options
     * @returns {Record<"cog"|"xte"|"dtw"|"btw", { caption: unknown, value: string, unit: unknown }>}
     */
    function buildLinearMetrics(options) {
      const display = options.display;
      const formatUnits = options.formatUnits;
      const layoutConfig = options.layoutConfig;
      const captions = options.captions;
      const units = options.units;
      const leadingZero = layoutConfig.leadingZero !== false;
      const dtwDistance = unitFormatter.formatDistance(display.dtw, formatUnits.dtw, options.defaultText);
      const cogHeading = unitFormatter.formatWithToken(
        display.cog,
        "formatDirection360",
        leadingZero,
        options.defaultText
      );
      const brgHeading = unitFormatter.formatWithToken(
        display.btw,
        "formatDirection360",
        leadingZero,
        options.defaultText
      );
      return /** @type {Record<"cog"|"xte"|"dtw"|"btw", { caption: unknown, value: string, unit: unknown }>} */ ({
        cog: { caption: captions.track, value: cogHeading, unit: units.track },
        xte: { caption: captions.xte, value: options.xteValueText, unit: units.xte },
        dtw: { caption: captions.dtw, value: dtwDistance, unit: units.dtw },
        btw: { caption: captions.brg, value: brgHeading, unit: units.brg }
      });
    }

    return {
      isPointerMotionActive: isPointerMotionActive,
      resolveAndDrawLinearPointer: resolveAndDrawLinearPointer,
      resolveStableDigitsXteTextLinear: resolveStableDigitsXteTextLinear,
      buildLinearMetrics: buildLinearMetrics
    };
  }

  return { id: "XteLinearDynamicMetrics", create: create };
});
