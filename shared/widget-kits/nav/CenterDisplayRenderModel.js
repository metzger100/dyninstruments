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
      buildDisplayState: buildDisplayState
    };
  }

  return { id: "CenterDisplayRenderModel", create: create };
}));
