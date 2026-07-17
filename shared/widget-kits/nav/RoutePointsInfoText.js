/**
 * @file RoutePointsInfoText - Shared info-text formatter for route-points row fitting
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsInfoText = factory();
  }
}(this, function () {
  "use strict";

  /** @param {DyniRoutePointInfoPoint} point @param {string} defaultText @param {DyniUnitAwareFormatterApi} unitFormatter @returns {string} */
  function formatLatLonInfo(point, defaultText, unitFormatter) {
    return unitFormatter.formatWithToken({ lat: point.lat, lon: point.lon }, "formatLonLats", undefined, defaultText);
  }

  /**
   * @param {DyniRoutePointsInfoTextArgs} args
   * @param {boolean} stableDigitsEnabled
   * @param {DyniStableDigitsApi} stableDigits
   * @param {DyniUnitAwareFormatterApi} unitFormatter
   * @returns {DyniRoutePointsInfoTextResult}
   */
  function formatCourseDistanceInfo(args, stableDigitsEnabled, stableDigits, unitFormatter) {
    const cfg = args || {};
    const placeholder = cfg.placeholderValue + cfg.courseUnit + "/" + cfg.placeholderValue + cfg.distanceUnit;
    const previousPoint = cfg.previousPoint;
    const currentPoint = cfg.currentPoint;
    const courseUnit = cfg.courseUnit;
    const distanceUnit = cfg.distanceUnit;
    const formatDistanceUnit = cfg.formatDistanceUnit;
    if (!previousPoint || !currentPoint) {
      return { valueText: placeholder, plainValueText: placeholder };
    }

    const leg = cfg.centerMath.computeCourseDistance(previousPoint, currentPoint, cfg.useRhumbLine === true);
    if (!leg) {
      return { valueText: placeholder, plainValueText: placeholder };
    }

    const courseText = unitFormatter.formatWithToken(leg.course, "formatDirection", undefined, cfg.defaultText);
    const distanceText = unitFormatter.formatDistance(leg.distance, formatDistanceUnit, cfg.defaultText);
    const courseStable = stableDigitsEnabled === true
      ? stableDigits.normalize(courseText, {
          integerWidth: stableDigits.resolveIntegerWidth(courseText, 3),
          reserveSignSlot: false
        })
      : { padded: courseText, plain: courseText };
    const distanceStable = stableDigitsEnabled === true
      ? stableDigits.normalize(distanceText, {
        integerWidth: stableDigits.resolveIntegerWidth(distanceText, 2),
        reserveSignSlot: false
      })
      : { padded: distanceText, plain: distanceText };

    return {
      valueText: courseStable.padded + courseUnit + "/" + distanceStable.padded + distanceUnit,
      plainValueText: courseStable.plain + courseUnit + "/" + distanceStable.plain + distanceUnit
    };
  }

  /** @param {unknown} args @param {DyniUnitAwareFormatterApi} unitFormatter @returns {DyniRoutePointsInfoTextResult} */
  function buildRowInfoText(args, unitFormatter) {
    const cfg = /** @type {DyniRoutePointsInfoTextArgs} */ (args || {});
    const placeholder = cfg.placeholderValue + cfg.courseUnit + "/" + cfg.placeholderValue + cfg.distanceUnit;
    if (cfg.showLatLon === true) {
      const text = formatLatLonInfo(cfg.currentPoint, cfg.defaultText, unitFormatter);
      return { valueText: text, plainValueText: text };
    }
    if (cfg.index <= 0 || !cfg.previousValid || !cfg.currentValid) {
      return { valueText: placeholder, plainValueText: placeholder };
    }
    return formatCourseDistanceInfo(cfg, cfg.stableDigitsEnabled, cfg.stableDigits, unitFormatter);
  }

  /** @param {unknown} def @param {DyniComponentContext} componentContext @returns {DyniRoutePointsInfoTextApi} */
  function create(def, componentContext) {
    const unitFormatter = componentContext.components.require("UnitAwareFormatter");
    return {
      id: "RoutePointsInfoText",
      /** @param {unknown} args @returns {DyniRoutePointsInfoTextResult} */
      buildRowInfoText: function (args) {
        return buildRowInfoText(args, unitFormatter);
      }
    };
  }

  return { id: "RoutePointsInfoText", create: create };
}));
