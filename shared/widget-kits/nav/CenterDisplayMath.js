/**
 * Module: CenterDisplayMath - Position normalization and center-display leg math
 * Documentation: documentation/widgets/center-display.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniCenterDisplayMath = factory(); }
}(this, function () {
  "use strict";

  const EARTH_RADIUS_M = 6371000;

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function toRadians(value) {
    return value * Math.PI / 180;
  }

  function toDegrees(value) {
    return value * 180 / Math.PI;
  }

  function wrapRadians(value) {
    if (value > Math.PI) {
      return value - Math.PI * 2;
    }
    if (value < -Math.PI) {
      return value + Math.PI * 2;
    }
    return value;
  }

  function normalizePoint(value) {
    if (!value || typeof value !== "object") {
      return null;
    }
    const lonRaw = Array.isArray(value) ? value[0] : value.lon;
    const latRaw = Array.isArray(value) ? value[1] : value.lat;
    if (Array.isArray(value) && value.length < 2) {
      return null;
    }
    const lat = toFiniteNumber(latRaw);
    const lon = toFiniteNumber(lonRaw);
    if (typeof lat === "undefined" || typeof lon === "undefined") {
      return null;
    }
    return { lat: lat, lon: lon };
  }

  function computeGreatCircle(src, dst) {
    const phi1 = toRadians(src.lat);
    const phi2 = toRadians(dst.lat);
    const dPhi = phi2 - phi1;
    const dLambda = wrapRadians(toRadians(dst.lon - src.lon));
    const sinHalfPhi = Math.sin(dPhi / 2);
    const sinHalfLambda = Math.sin(dLambda / 2);
    const a = sinHalfPhi * sinHalfPhi +
      Math.cos(phi1) * Math.cos(phi2) * sinHalfLambda * sinHalfLambda;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
    const y = Math.sin(dLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
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

  function computeRhumbLine(src, dst) {
    const phi1 = toRadians(src.lat);
    const phi2 = toRadians(dst.lat);
    const dPhi = phi2 - phi1;
    let dLambda = toRadians(dst.lon - src.lon);
    dLambda = wrapRadians(dLambda);
    const psi1 = Math.log(Math.tan(Math.PI / 4 + phi1 / 2));
    const psi2 = Math.log(Math.tan(Math.PI / 4 + phi2 / 2));
    const dPsi = psi2 - psi1;
    const q = Math.abs(dPsi) > 1e-12 ? (dPhi / dPsi) : Math.cos(phi1);
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

  function computeCourseDistance(srcValue, dstValue, useRhumbLine) {
    const src = normalizePoint(srcValue);
    const dst = normalizePoint(dstValue);
    if (!src || !dst) {
      return null;
    }
    return useRhumbLine ? computeRhumbLine(src, dst) : computeGreatCircle(src, dst);
  }

  function extractMeasureStart(activeMeasure) {
    if (!activeMeasure || typeof activeMeasure.getPointAtIndex !== "function") {
      return null;
    }
    return normalizePoint(activeMeasure.getPointAtIndex(0));
  }

  function create() {
    return {
      id: "CenterDisplayMath",
      normalizePoint: normalizePoint,
      computeCourseDistance: computeCourseDistance,
      extractMeasureStart: extractMeasureStart
    };
  }

  return { id: "CenterDisplayMath", create: create };
}));
