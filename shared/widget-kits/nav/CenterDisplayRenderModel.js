/**
 * Module: CenterDisplayRenderModel - Display-state builder for center-display canvas renderer
 * Documentation: documentation/widgets/center-display.md
 * Depends: PlaceholderNormalize, StableDigits
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniCenterDisplayRenderModel = factory(); }
}(this, function () {
  "use strict";

  const DEGREE_UNIT = "\u00b0";

  function trimString(value) {
    return value == null ? "" : String(value).trim();
  }

  function appendUnit(text, unit, defaultText) {
    return (!unit || text === defaultText) ? text : text + unit;
  }

  function computeMeasurementHints(args) {
    const cfg = args || {};
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

  function create(def, Helpers) {
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);
    const stableDigits = Helpers.getModule("StableDigits").create(def, Helpers);

    function formatCoordinate(point, axis, defaultText) {
      const raw = point && axis === "lat" ? point.lat : point && point.lon;
      const out = String(Helpers.applyFormatter(raw, {
        formatter: "formatLonLatsDecimal",
        formatterParameters: [axis],
        default: defaultText
      }));
      return placeholderNormalize.normalize(out, defaultText);
    }

    function formatCourse(value, defaultText) {
      const out = String(Helpers.applyFormatter(value, {
        formatter: "formatDirection",
        formatterParameters: [],
        default: defaultText
      }));
      return placeholderNormalize.normalize(out, defaultText);
    }

    function formatDistance(value, unit, defaultText) {
      const out = String(Helpers.applyFormatter(value, {
        formatter: "formatDistance",
        formatterParameters: [unit],
        default: defaultText
      }));
      return placeholderNormalize.normalize(out, defaultText);
    }

    function buildDisplayState(props, math, defaultText) {
      const p = props || {};
      const stableDigitsEnabled = p.stableDigits === true;
      const display = (p.display && typeof p.display === "object") ? p.display : {};
      const captions = (p.captions && typeof p.captions === "object") ? p.captions : {};
      const units = (p.units && typeof p.units === "object") ? p.units : {};
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
          caption: trimString(captions.measure),
          unit: trimString(units.measure),
          course: measureRelation.course,
          distance: measureRelation.distance
        });
      }
      rows.push({
        id: "marker",
        caption: trimString(captions.marker),
        unit: trimString(units.marker),
        course: display.marker ? display.marker.course : undefined,
        distance: display.marker ? display.marker.distance : undefined
      });
      rows.push({
        id: "boat",
        caption: trimString(captions.boat),
        unit: trimString(units.boat),
        course: display.boat ? display.boat.course : undefined,
        distance: display.boat ? display.boat.distance : undefined
      });

      return {
        positionCaption: trimString(captions.position),
        latText: formatCoordinate(position, "lat", defaultText),
        lonText: formatCoordinate(position, "lon", defaultText),
        rows: rows.map(function (row) {
          const courseRawText = appendUnit(formatCourse(row.course, defaultText), DEGREE_UNIT, defaultText);
          const distanceRawText = appendUnit(formatDistance(row.distance, row.unit, defaultText), row.unit, defaultText);
          const courseStable = stableDigitsEnabled
            ? stableDigits.normalize(courseRawText, {
              integerWidth: stableDigits.resolveIntegerWidth(courseRawText, 3),
              reserveSignSlot: true
            })
            : { padded: courseRawText, fallback: courseRawText };
          const distanceStable = stableDigitsEnabled
            ? stableDigits.normalize(distanceRawText, {
              integerWidth: stableDigits.resolveIntegerWidth(distanceRawText, 2),
              reserveSignSlot: true
            })
            : { padded: distanceRawText, fallback: distanceRawText };
          return {
            id: row.id,
            caption: row.caption,
            fullValueText: courseStable.padded + " / " + distanceStable.padded,
            compactValueText: courseStable.fallback + "/" + distanceStable.fallback
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
