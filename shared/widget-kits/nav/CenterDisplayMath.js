/**
 * @file CenterDisplayMath - Position normalization and center-display leg math
 * Documentation: documentation/widgets/center-display.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniCenterDisplayMath = factory();
  }
})(this, function () {
  "use strict";

  const EARTH_RADIUS_M = 6371000;

  /** @type {DyniValueMathApi["toOptionalFiniteNumber"]} */
  let toOptionalFiniteNumber;

  /** @param {number} value @returns {number} */
  function toRadians(value) {
    return (value * Math.PI) / 180;
  }

  /** @param {number} value @returns {number} */
  function toDegrees(value) {
    return (value * 180) / Math.PI;
  }

  /** @param {number} value @returns {number} */
  function wrapRadians(value) {
    if (value > Math.PI) {
      return value - Math.PI * 2;
    }
    if (value < -Math.PI) {
      return value + Math.PI * 2;
    }
    return value;
  }

  /** @param {unknown} value @returns {DyniLatLon | null} */
  function normalizePoint(value) {
    if (!value || typeof value !== "object") {
      return null;
    }
    const arr = Array.isArray(value) ? value : null;
    const rec = /** @type {{ lon?: unknown, lat?: unknown }} */ (value);
    const lonRaw = arr ? arr[0] : rec.lon;
    const latRaw = arr ? arr[1] : rec.lat;
    if (arr && arr.length < 2) {
      return null;
    }
    const lat = toOptionalFiniteNumber(latRaw);
    const lon = toOptionalFiniteNumber(lonRaw);
    if (typeof lat === "undefined" || typeof lon === "undefined") {
      return null;
    }
    return { lat: lat, lon: lon };
  }

  /** @param {DyniLatLon} src @param {DyniLatLon} dst @returns {DyniCourseDistance} */
  function computeGreatCircle(src, dst) {
    const phi1 = toRadians(src.lat);
    const phi2 = toRadians(dst.lat);
    const dPhi = phi2 - phi1;
    const dLambda = wrapRadians(toRadians(dst.lon - src.lon));
    const sinHalfPhi = Math.sin(dPhi / 2);
    const sinHalfLambda = Math.sin(dLambda / 2);
    const a = sinHalfPhi * sinHalfPhi + Math.cos(phi1) * Math.cos(phi2) * sinHalfLambda * sinHalfLambda;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
    const y = Math.sin(dLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
    let course = toDegrees(Math.atan2(y, x));
    if (!Number.isFinite(course)) {
      course = 0;
    }
    course = (course + 360) % 360;
    return {
      course: course,
      distance: EARTH_RADIUS_M * c
    };
  }

  /** @param {DyniLatLon} src @param {DyniLatLon} dst @returns {DyniCourseDistance} */
  function computeRhumbLine(src, dst) {
    const phi1 = toRadians(src.lat);
    const phi2 = toRadians(dst.lat);
    const dPhi = phi2 - phi1;
    let dLambda = toRadians(dst.lon - src.lon);
    dLambda = wrapRadians(dLambda);
    const psi1 = Math.log(Math.tan(Math.PI / 4 + phi1 / 2));
    const psi2 = Math.log(Math.tan(Math.PI / 4 + phi2 / 2));
    const dPsi = psi2 - psi1;
    const q = Math.abs(dPsi) > 1e-12 ? dPhi / dPsi : Math.cos(phi1);
    let course = toDegrees(Math.atan2(dLambda, dPsi));
    if (!Number.isFinite(course)) {
      course = 0;
    }
    course = (course + 360) % 360;
    return {
      course: course,
      distance: Math.sqrt(dPhi * dPhi + q * q * dLambda * dLambda) * EARTH_RADIUS_M
    };
  }

  /**
   * @param {unknown} srcValue
   * @param {unknown} dstValue
   * @param {unknown} useRhumbLine
   * @returns {DyniCourseDistance | null}
   */
  function computeCourseDistance(srcValue, dstValue, useRhumbLine) {
    const src = normalizePoint(srcValue);
    const dst = normalizePoint(dstValue);
    if (!src || !dst) {
      return null;
    }
    return useRhumbLine ? computeRhumbLine(src, dst) : computeGreatCircle(src, dst);
  }

  /** @param {unknown} activeMeasure @returns {DyniLatLon | null} */
  function extractMeasureStart(activeMeasure) {
    const measure = /** @type {{ getPointAtIndex?: unknown }} */ (activeMeasure);
    if (!measure || typeof measure.getPointAtIndex !== "function") {
      return null;
    }
    return normalizePoint(measure.getPointAtIndex(0));
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniCenterDisplayMathApi}
   */
  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");
    toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;

    return {
      id: "CenterDisplayMath",
      normalizePoint: normalizePoint,
      computeCourseDistance: computeCourseDistance,
      extractMeasureStart: extractMeasureStart
    };
  }

  return { id: "CenterDisplayMath", create: create };
});
