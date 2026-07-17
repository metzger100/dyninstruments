/**
 * @file CenterDisplayRenderModel - Display-state builder for center-display canvas renderer
 * Documentation: documentation/widgets/center-display.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniCenterDisplayRenderModel = factory();
  }
}(this, function () {
  "use strict";

  const DEGREE_UNIT = "\u00b0";

  /** @type {DyniValueMathApi["trimText"]} */
  let trimText;
  /** @type {DyniValueMathApi["appendUnit"]} */
  let appendUnit;

  /**
   * @param {unknown} args
   * @returns {DyniCenterDisplayMeasurementHints}
   */
  function computeMeasurementHints(args) {
    const cfg = /** @type {DyniCenterDisplayMeasurementHintArgs} */ (/** @type {unknown} */ (args || {}));
    const rows = cfg.rows;
    const measureTextWidth = cfg.measureTextWidth;
    const computeResponsiveLineMaxPx = cfg.computeResponsiveLineMaxPx;
    const clampShare = cfg.clampShare;
    if (typeof measureTextWidth !== "function" || typeof computeResponsiveLineMaxPx !== "function" || typeof clampShare !== "function") {
      throw new Error("CenterDisplayRenderModel: helper functions are required");
    }
    const baseCaptionPx = Math.max(1, Math.floor(cfg.contentRect.h * 0.15));
    const baseCoordPx = Math.max(1, Math.floor(cfg.contentRect.h * 0.17));
    const baseRowLabelPx = Math.max(1, Math.floor(cfg.contentRect.h / Math.max(3, rows.length + 1)));
    const baseRowValuePx = Math.max(1, Math.floor(baseRowLabelPx * 1.18));
    const positionCaptionWidth = cfg.positionCaption
      ? measureTextWidth(
        cfg.ctx,
        cfg.textApi,
        cfg.positionCaption,
        cfg.labelFamily,
        cfg.labelWeight,
        baseCaptionPx,
        cfg.frameWidthCache
      )
      : 0;
    const coordWidth = Math.max(measureTextWidth(cfg.ctx, cfg.textApi, cfg.latText, cfg.coordFamily, cfg.valueWeight, baseCoordPx, cfg.frameWidthCache),
      measureTextWidth(cfg.ctx, cfg.textApi, cfg.lonText, cfg.coordFamily, cfg.valueWeight, baseCoordPx, cfg.frameWidthCache));
    let rowBlockWidth = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const labelWidth = row.caption
        ? measureTextWidth(
          cfg.ctx,
          cfg.textApi,
          row.caption,
          cfg.labelFamily,
          cfg.labelWeight,
          baseRowLabelPx,
          cfg.frameWidthCache
        )
        : 0;
      const valueWidth = Math.min(
        measureTextWidth(
          cfg.ctx,
          cfg.textApi,
          row.fullValueText,
          cfg.relationValueFamily,
          cfg.valueWeight,
          baseRowValuePx,
          cfg.frameWidthCache
        ),
        measureTextWidth(
          cfg.ctx,
          cfg.textApi,
          row.compactValueText,
          cfg.relationValueFamily,
          cfg.valueWeight,
          baseRowValuePx,
          cfg.frameWidthCache
        )
      );
      rowBlockWidth = Math.max(rowBlockWidth, labelWidth + cfg.gap + valueWidth);
    }
    const normalCaptionShare = positionCaptionWidth > 0
      ? clampShare(
        (positionCaptionWidth + cfg.gap) / Math.max(1, positionCaptionWidth + coordWidth + cfg.gap * 2),
        0.16,
        0.42
      )
      : undefined;
    const flatCenterShare = clampShare(
      Math.max(positionCaptionWidth, coordWidth) / Math.max(1, Math.max(positionCaptionWidth, coordWidth) + rowBlockWidth),
      0.28,
      0.56
    );
    const stackedCaptionRatio = clampShare(
      positionCaptionWidth > 0
        ? 0.16 + ((positionCaptionWidth / Math.max(1, positionCaptionWidth + coordWidth)) * 0.18)
        : 0.24,
      0.16,
      0.34
    );
    return {
      normalCaptionShare: normalCaptionShare, flatCenterShare: flatCenterShare,
      highCaptionRatio: stackedCaptionRatio, flatCaptionRatio: clampShare((stackedCaptionRatio || 0.24) * 0.92, 0.16, 0.34)
    };
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniCenterDisplayRenderModelApi}
   */
  function create(def, componentContext) {
    const stableDigits = componentContext.components.require("StableDigits");
    const unitFormatter = componentContext.components.require("UnitAwareFormatter");
    const valueMath = componentContext.components.require("ValueMath");
    trimText = valueMath.trimText;
    appendUnit = valueMath.appendUnit;

    /** @param {DyniLatLon | null} point @param {"lat" | "lon"} axis @param {string} defaultText @returns {string} */
    function formatCoordinate(point, axis, defaultText) {
      const raw = point && axis === "lat" ? point.lat : point && point.lon;
      return unitFormatter.formatWithToken(raw, "formatLonLatsDecimal", axis, defaultText);
    }

    /** @param {unknown} value @param {string} defaultText @returns {string} */
    function formatCourse(value, defaultText) {
      return unitFormatter.formatWithToken(value, "formatDirection", undefined, defaultText);
    }

    /** @param {unknown} value @param {unknown} formatUnit @param {string} defaultText @returns {string} */
    function formatDistance(value, formatUnit, defaultText) {
      return unitFormatter.formatDistance(value, formatUnit, defaultText);
    }

    /**
     * @param {unknown} props
     * @param {DyniCenterDisplayMathApi} math
     * @param {string} defaultText
     * @returns {DyniCenterDisplayState}
     */
    function buildDisplayState(props, math, defaultText) {
      const p = /** @type {DyniCenterDisplayProps} */ (/** @type {unknown} */ (props || {}));
      const stableDigitsEnabled = p.stableDigits === true;
      const display = (p.display && typeof p.display === "object") ? p.display : {};
      const captions = (p.captions && typeof p.captions === "object") ? p.captions : {};
      const units = (p.units && typeof p.units === "object") ? p.units : {};
      const formatTokens = (p.formatUnits && typeof p.formatUnits === "object") ? p.formatUnits : {};
      const position = math.normalizePoint(display.position);
      const measureInfo = (display.measure && typeof display.measure === "object") ? display.measure : {};
      const measureStart = math.extractMeasureStart(measureInfo.activeMeasure);
      const measureRelation = (measureStart && position)
        ? math.computeCourseDistance(measureStart, position, measureInfo.useRhumbLine === true)
        : null;

      const rows = [];
      if (measureRelation) {
        rows.push({
          id: "measure",
          caption: trimText(captions.measure),
          unit: trimText(units.measure),
          formatUnit: trimText(formatTokens.measure),
          course: measureRelation.course,
          distance: measureRelation.distance
        });
      }
      rows.push({
        id: "marker",
        caption: trimText(captions.marker),
        unit: trimText(units.marker),
        formatUnit: trimText(formatTokens.marker),
        course: display.marker ? display.marker.course : undefined,
        distance: display.marker ? display.marker.distance : undefined
      });
      rows.push({
        id: "boat",
        caption: trimText(captions.boat),
        unit: trimText(units.boat),
        formatUnit: trimText(formatTokens.boat),
        course: display.boat ? display.boat.course : undefined,
        distance: display.boat ? display.boat.distance : undefined
      });

      return {
        positionCaption: trimText(captions.position),
        latText: formatCoordinate(position, "lat", defaultText),
        lonText: formatCoordinate(position, "lon", defaultText),
        rows: rows.map(function (row) {
          const courseBaseText = formatCourse(row.course, defaultText);
          const distanceBaseText = formatDistance(row.distance, row.formatUnit, defaultText);
          const courseRawText = courseBaseText === defaultText
            ? courseBaseText
            : appendUnit(courseBaseText, DEGREE_UNIT, defaultText);
          const distanceRawText = distanceBaseText === defaultText
            ? distanceBaseText
            : appendUnit(distanceBaseText, row.unit, defaultText);
          const courseStable = stableDigitsEnabled
            ? stableDigits.normalize(courseRawText, {
              integerWidth: stableDigits.resolveIntegerWidth(courseRawText, 3),
              reserveSignSlot: true
            })
            : { padded: courseRawText, plain: courseRawText };
          const distanceStable = stableDigitsEnabled
            ? stableDigits.normalize(distanceRawText, {
              integerWidth: stableDigits.resolveIntegerWidth(distanceRawText, 2),
              reserveSignSlot: true
            })
            : { padded: distanceRawText, plain: distanceRawText };
          return {
            id: row.id,
            caption: row.caption,
            fullValueText: courseStable.padded + " / " + distanceStable.padded,
            compactValueText: courseStable.plain + "/" + distanceStable.plain
          };
        })
      };
    }

    return {
      id: "CenterDisplayRenderModel",
      buildDisplayState: buildDisplayState,
      computeMeasurementHints: computeMeasurementHints
    };
  }

  return { id: "CenterDisplayRenderModel", create: create };
}));
