/**
 * Module: RoutePointsInfoText - Shared info-text formatter for route-points row fitting
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsInfoText = factory(); }
}(this, function () {
  "use strict";

  function formatLatLonInfo(point, defaultText, Helpers, placeholderNormalize) {
    const text = String(Helpers.applyFormatter({ lat: point.lat, lon: point.lon }, {
      formatter: "formatLonLats",
      formatterParameters: [],
      default: defaultText
    }));
    return placeholderNormalize.normalize(text, defaultText);
  }

  function formatCourseDistanceInfo(args, stableDigitsEnabled, stableDigits) {
    const cfg = args || {};
    const placeholder = cfg.placeholderValue + cfg.courseUnit + "/" + cfg.placeholderValue + cfg.distanceUnit;
    const previousPoint = cfg.previousPoint;
    const currentPoint = cfg.currentPoint;
    const courseUnit = cfg.courseUnit;
    const distanceUnit = cfg.distanceUnit;
    if (!previousPoint || !currentPoint) {
      return { valueText: placeholder, fallbackValueText: placeholder };
    }

    const leg = cfg.centerMath.computeCourseDistance(previousPoint, currentPoint, cfg.useRhumbLine === true);
    if (!leg) {
      return { valueText: placeholder, fallbackValueText: placeholder };
    }

    const courseTextRaw = String(cfg.Helpers.applyFormatter(leg.course, {
      formatter: "formatDirection",
      formatterParameters: [],
      default: cfg.defaultText
    }));
    const distanceTextRaw = String(cfg.Helpers.applyFormatter(leg.distance, {
      formatter: "formatDistance",
      formatterParameters: [distanceUnit],
      default: cfg.defaultText
    }));
    const courseText = cfg.placeholderNormalize.normalize(courseTextRaw, cfg.defaultText);
    const distanceText = cfg.placeholderNormalize.normalize(distanceTextRaw, cfg.defaultText);
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

  function buildRowInfoText(args) {
    const cfg = args || {};
    const placeholder = cfg.placeholderValue + cfg.courseUnit + "/" + cfg.placeholderValue + cfg.distanceUnit;
    if (cfg.showLatLon === true) {
      const text = formatLatLonInfo(cfg.currentPoint, cfg.defaultText, cfg.Helpers, cfg.placeholderNormalize);
      return { valueText: text, fallbackValueText: text };
    }
    if (cfg.index <= 0 || !cfg.previousValid || !cfg.currentValid) {
      return { valueText: placeholder, fallbackValueText: placeholder };
    }
    return formatCourseDistanceInfo(cfg, cfg.stableDigitsEnabled, cfg.stableDigits);
  }

  function create(def, Helpers) {
    return {
      id: "RoutePointsInfoText",
      buildRowInfoText: buildRowInfoText
    };
  }

  return { id: "RoutePointsInfoText", create: create };
}));
