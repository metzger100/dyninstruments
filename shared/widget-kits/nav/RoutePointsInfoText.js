/**
 * Module: RoutePointsInfoText - Shared info-text formatter for route-points row fitting
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: UnitAwareFormatter
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsInfoText = factory(); }
}(this, function () {
  "use strict";

  function formatLatLonInfo(point, defaultText, unitFormatter) {
    return unitFormatter.formatWithToken({ lat: point.lat, lon: point.lon }, "formatLonLats", undefined, defaultText);
  }

  function formatCourseDistanceInfo(args, stableDigitsEnabled, stableDigits, unitFormatter) {
    const cfg = args || {};
    const placeholder = cfg.placeholderValue + cfg.courseUnit + "/" + cfg.placeholderValue + cfg.distanceUnit;
    const previousPoint = cfg.previousPoint;
    const currentPoint = cfg.currentPoint;
    const courseUnit = cfg.courseUnit;
    const distanceUnit = cfg.distanceUnit;
    const formatDistanceUnit = cfg.formatDistanceUnit;
    if (!previousPoint || !currentPoint) {
      return { valueText: placeholder, fallbackValueText: placeholder };
    }

    const leg = cfg.centerMath.computeCourseDistance(previousPoint, currentPoint, cfg.useRhumbLine === true);
    if (!leg) {
      return { valueText: placeholder, fallbackValueText: placeholder };
    }

    const courseText = unitFormatter.formatWithToken(leg.course, "formatDirection", undefined, cfg.defaultText);
    const distanceText = unitFormatter.formatDistance(leg.distance, formatDistanceUnit, cfg.defaultText);
    const courseStable = stableDigitsEnabled === true
      ? stableDigits.normalize(courseText, {
        integerWidth: stableDigits.resolveIntegerWidth(courseText, 3),
        reserveSignSlot: false
      })
      : { padded: courseText, fallback: courseText };
    const distanceStable = stableDigitsEnabled === true
      ? stableDigits.normalize(distanceText, {
        integerWidth: stableDigits.resolveIntegerWidth(distanceText, 2),
        reserveSignSlot: false
      })
      : { padded: distanceText, fallback: distanceText };

    return {
      valueText: courseStable.padded + courseUnit + "/" + distanceStable.padded + distanceUnit,
      fallbackValueText: courseStable.fallback + courseUnit + "/" + distanceStable.fallback + distanceUnit
    };
  }

  function buildRowInfoText(args, unitFormatter) {
    const cfg = args || {};
    const placeholder = cfg.placeholderValue + cfg.courseUnit + "/" + cfg.placeholderValue + cfg.distanceUnit;
    if (cfg.showLatLon === true) {
      const text = formatLatLonInfo(cfg.currentPoint, cfg.defaultText, unitFormatter);
      return { valueText: text, fallbackValueText: text };
    }
    if (cfg.index <= 0 || !cfg.previousValid || !cfg.currentValid) {
      return { valueText: placeholder, fallbackValueText: placeholder };
    }
    return formatCourseDistanceInfo(cfg, cfg.stableDigitsEnabled, cfg.stableDigits, unitFormatter);
  }

  function create(def, Helpers) {
    const unitFormatter = Helpers.getModule("UnitAwareFormatter").create(def, Helpers);
    return {
      id: "RoutePointsInfoText",
      buildRowInfoText: function (args) {
        return buildRowInfoText(args, unitFormatter);
      }
    };
  }

  return { id: "RoutePointsInfoText", create: create };
}));
