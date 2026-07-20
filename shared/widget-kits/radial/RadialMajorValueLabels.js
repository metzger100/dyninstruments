/**
 * @file RadialMajorValueLabels - Shared major-tick value label drawing for radial gauge widgets
 * Documentation: documentation/widgets/semicircle-gauges.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniRadialMajorValueLabels = factory();
  }
})(this, function () {
  "use strict";

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniRadialMajorValueLabelsApi}
   */
  function create(def, componentContext) {
    const GU = componentContext.components.require("RadialToolkit");
    const angle = GU.angle;
    const value = GU.value;
    const draw = GU.draw;

    /** @param {number} minV @param {number} maxV */
    function isValidRange(minV, maxV) {
      return Number.isFinite(minV) && Number.isFinite(maxV) && maxV > minV;
    }

    /** @param {unknown} showEndLabels @param {number} index @param {boolean} atMax */
    function shouldSkipEndLabel(showEndLabels, index, atMax) {
      return !showEndLabels && (index === 0 || atMax);
    }

    /** @param {DyniRadialMajorValueLabelsOptions} options @param {number} step */
    function collectLabels(options, step) {
      const angles = [];
      /** @type {Record<string, string>} */
      const labelsMap = {};
      const count = Math.max(1, Math.round((options.maxV - options.minV) / step));
      for (let i = 0; i <= count; i += 1) {
        const tickValue = Math.min(options.maxV, options.minV + i * step);
        const atMax = value.isApprox(tickValue, options.maxV, 1e-6);
        if (shouldSkipEndLabel(options.showEndLabels, i, atMax)) {
          if (atMax) break;
          continue;
        }
        const angleDeg = angle.valueToAngleFlat(tickValue, options.minV, options.maxV, options.arc, true);
        angles.push(angleDeg);
        labelsMap[angleDeg] = value.formatMajorLabel(tickValue);
        if (atMax) break;
      }
      return { angles: angles, labelsMap: labelsMap };
    }

    /** @param {DyniRadialMajorValueLabelsOptions} options @returns {void} */
    function drawMajorValueLabels(options) {
      const { ctx, family, geom, labels, minV, maxV, majorStep, labelWeight } = options;
      if (!isValidRange(minV, maxV)) {
        return;
      }
      const step = Math.abs(Number(majorStep));
      if (!Number.isFinite(step) || step <= 0) {
        return;
      }

      const collected = collectLabels(options, step);
      if (!collected.angles.length) {
        return;
      }

      draw.drawLabels(ctx, geom.cx, geom.cy, geom.rOuter, {
        angles: collected.angles,
        radiusOffset: labels.radiusOffset,
        fontPx: labels.fontPx,
        weight: labelWeight,
        family: family,
        labelsMap: collected.labelsMap
      });
    }

    return { id: "RadialMajorValueLabels", drawMajorValueLabels: drawMajorValueLabels };
  }

  return { id: "RadialMajorValueLabels", create: create };
});
