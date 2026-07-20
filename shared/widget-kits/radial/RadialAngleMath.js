/**
 * @file RadialAngleMath - Shared angle conversion and value/angle mapping helpers
 * Documentation: documentation/radial/gauge-shared-api.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniRadialAngleMath = factory();
  }
})(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;

  function create() {
    /** @param {number} deg @returns {number} */
    function degToRad(deg) {
      return (deg * Math.PI) / 180;
    }

    /** @param {number} rad @returns {number} */
    function radToDeg(rad) {
      return (rad * 180) / Math.PI;
    }

    /** @param {number} n @param {number} m @returns {number} */
    function mod(n, m) {
      return ((n % m) + m) % m;
    }

    /** @param {number} deg @returns {number} */
    function norm360(deg) {
      if (!Number.isFinite(deg)) {
        return deg;
      }
      return mod(deg, 360);
    }

    /** @param {number} deg @returns {number} */
    function norm180(deg) {
      if (!Number.isFinite(deg)) {
        return deg;
      }
      let r = mod(deg + 180, 360) - 180;
      if (r === 180) r = -180;
      return r;
    }

    /**
     * @param {unknown} deg
     * @param {DyniAngleConfig | undefined} cfg
     * @param {unknown} rotationDeg
     * @returns {number}
     */
    function degToCanvasRad(deg, cfg, rotationDeg) {
      cfg = cfg || {};
      const zeroDegAt = hasOwn.call(cfg, "zeroDegAt") ? cfg.zeroDegAt : "north";
      const clockwise = cfg.clockwise !== false;

      let d = Number(deg);
      if (!Number.isFinite(d)) d = 0;
      d = d + (Number(rotationDeg) || 0);

      const shift = zeroDegAt === "east" ? 0 : -90;
      const signed = clockwise ? d : -d;
      return degToRad(norm360(signed + shift));
    }

    /**
     * @param {unknown} value
     * @param {DyniAngleOptions | undefined} opts
     * @returns {number}
     */
    function valueToAngle(value, opts) {
      opts = opts || {};
      const min = Number(opts.min);
      const max = Number(opts.max);
      const startDeg = Number(opts.startDeg);
      const endDeg = Number(opts.endDeg);

      if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(startDeg) || !Number.isFinite(endDeg)) {
        return NaN;
      }

      let v = Number(value);
      if (!Number.isFinite(v)) {
        return NaN;
      }

      const clampValue = opts.clamp !== false;
      if (clampValue) v = Math.max(min, Math.min(max, v));

      const t = max === min ? 0 : (v - min) / (max - min);
      return startDeg + (endDeg - startDeg) * t;
    }

    /**
     * @param {unknown} rawValue
     * @param {unknown} minV
     * @param {unknown} maxV
     * @param {DyniArc | undefined} arc
     * @param {boolean | undefined} doClamp
     * @returns {number}
     */
    function valueToAngleFlat(rawValue, minV, maxV, arc, doClamp) {
      return valueToAngle(rawValue, {
        min: Number(minV),
        max: Number(maxV),
        startDeg: Number(arc && arc.startDeg),
        endDeg: Number(arc && arc.endDeg),
        clamp: doClamp !== false
      });
    }

    /**
     * @param {unknown} angleDeg
     * @param {DyniAngleOptions | undefined} opts
     * @returns {number}
     */
    function angleToValue(angleDeg, opts) {
      opts = opts || {};
      const min = Number(opts.min);
      const max = Number(opts.max);
      const startDeg = Number(opts.startDeg);
      const endDeg = Number(opts.endDeg);

      if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(startDeg) || !Number.isFinite(endDeg)) {
        return NaN;
      }

      let a = Number(angleDeg);
      if (!Number.isFinite(a)) {
        return NaN;
      }

      const denom = endDeg - startDeg;
      const t = denom === 0 ? 0 : (a - startDeg) / denom;
      let v = min + (max - min) * t;

      const clampValue = opts.clamp !== false;
      if (clampValue) v = Math.max(min, Math.min(max, v));

      return v;
    }

    /**
     * @param {unknown} v0
     * @param {unknown} v1
     * @param {DyniAngleOptions | undefined} opts
     * @returns {DyniAngleRange}
     */
    function valueRangeToAngleRange(v0, v1, opts) {
      const a0 = valueToAngle(v0, opts);
      const a1 = valueToAngle(v1, opts);
      return { a0, a1 };
    }

    return {
      id: "RadialAngleMath",
      mod,
      degToRad,
      radToDeg,
      norm360,
      norm180,
      degToCanvasRad,
      valueToAngle,
      valueToAngleFlat,
      angleToValue,
      valueRangeToAngleRange
    };
  }

  return { id: "RadialAngleMath", create };
});
