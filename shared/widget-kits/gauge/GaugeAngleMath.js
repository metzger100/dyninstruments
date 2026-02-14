/**
 * Module: GaugeAngleMath - Shared angle conversion and value/angle mapping helpers
 * Documentation: documentation/gauges/gauge-shared-api.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniGaugeAngleMath = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function degToRad(deg) { return (deg * Math.PI) / 180; }
    function radToDeg(rad) { return (rad * 180) / Math.PI; }

    function mod(n, m) { return ((n % m) + m) % m; }

    function norm360(deg) {
      if (!isFinite(deg)) return deg;
      return mod(deg, 360);
    }

    function norm180(deg) {
      if (!isFinite(deg)) return deg;
      let r = mod(deg + 180, 360) - 180;
      if (r === 180) r = -180;
      return r;
    }

    function degToCanvasRad(deg, cfg, rotationDeg) {
      cfg = cfg || {};
      const zeroDegAt = cfg.zeroDegAt || "north";
      const clockwise = (cfg.clockwise !== false);

      let d = Number(deg);
      if (!isFinite(d)) d = 0;
      d = d + (Number(rotationDeg) || 0);

      const shift = (zeroDegAt === "east") ? 0 : -90;
      const signed = clockwise ? d : -d;
      return degToRad(norm360(signed + shift));
    }

    function valueToAngle(value, opts) {
      opts = opts || {};
      const min = Number(opts.min);
      const max = Number(opts.max);
      const startDeg = Number(opts.startDeg);
      const endDeg = Number(opts.endDeg);

      if (!isFinite(min) || !isFinite(max) || !isFinite(startDeg) || !isFinite(endDeg)) return NaN;

      let v = Number(value);
      if (!isFinite(v)) return NaN;

      const clampValue = (opts.clamp !== false);
      if (clampValue) v = Math.max(min, Math.min(max, v));

      const t = (max === min) ? 0 : (v - min) / (max - min);
      return startDeg + (endDeg - startDeg) * t;
    }

    function angleToValue(angleDeg, opts) {
      opts = opts || {};
      const min = Number(opts.min);
      const max = Number(opts.max);
      const startDeg = Number(opts.startDeg);
      const endDeg = Number(opts.endDeg);

      if (!isFinite(min) || !isFinite(max) || !isFinite(startDeg) || !isFinite(endDeg)) return NaN;

      let a = Number(angleDeg);
      if (!isFinite(a)) return NaN;

      const denom = (endDeg - startDeg);
      const t = (denom === 0) ? 0 : (a - startDeg) / denom;
      let v = min + (max - min) * t;

      const clampValue = (opts.clamp !== false);
      if (clampValue) v = Math.max(min, Math.min(max, v));

      return v;
    }

    function valueRangeToAngleRange(v0, v1, opts) {
      const a0 = valueToAngle(v0, opts);
      const a1 = valueToAngle(v1, opts);
      return { a0, a1 };
    }

    return {
      id: "GaugeAngleMath",
      version: "0.1.0",
      degToRad,
      radToDeg,
      norm360,
      norm180,
      degToCanvasRad,
      valueToAngle,
      angleToValue,
      valueRangeToAngleRange
    };
  }

  return { id: "GaugeAngleMath", create };
}));
