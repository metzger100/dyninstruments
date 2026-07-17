/**
 * @file RadialTickMath - Shared tick sweep and major/minor angle generation
 * Documentation: documentation/radial/gauge-shared-api.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniRadialTickMath = factory();
  }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniRadialTickMathApi}
   */
  function create(def, componentContext) {
    const angleMath = componentContext.components.require("RadialAngleMath");
    const mod = angleMath.mod;

    /**
     * @param {unknown} startDeg
     * @param {unknown} endDeg
     * @returns {DyniRadialSweepInfo}
     */
    function computeSweep(startDeg, endDeg) {
      let s = Number(startDeg);
      let e = Number(endDeg);
      if (!Number.isFinite(s) || !Number.isFinite(e)) {
        return { s: 0, e: 0, sweep: 0, dir: 1 };
      }

      let sweep = e - s;
      if (sweep === 0) sweep = 360;
      const dir = (sweep >= 0) ? 1 : -1;

      return { s, e, sweep, dir };
    }

    /**
     * @param {number} curr
     * @param {number} end
     * @param {unknown} dir
     * @param {boolean} includeEnd
     * @returns {boolean}
     */
    function isBeyondEnd(curr, end, dir, includeEnd) {
      const direction = Number(dir) >= 0 ? 1 : -1;
      if (direction > 0) {
        return includeEnd ? (curr > end) : (curr >= end);
      }
      return includeEnd ? (curr < end) : (curr <= end);
    }

    /**
     * @param {DyniRadialTickOptions} [opts]
     * @returns {DyniRadialTickAngles}
     */
    function buildTickAngles(opts) {
      opts = opts || {};
      const startDeg = Number(hasOwn.call(opts, "startDeg") ? opts.startDeg : 0);
      const endDeg = Number(hasOwn.call(opts, "endDeg") ? opts.endDeg : 360);
      const stepMajor = Math.abs(Number(hasOwn.call(opts, "stepMajor") ? opts.stepMajor : 30)) || 30;
      const stepMinor = Math.abs(Number(hasOwn.call(opts, "stepMinor") ? opts.stepMinor : 10)) || 10;
      const includeEnd = !!opts.includeEnd;
      const majorMode = hasOwn.call(opts, "majorMode") ? opts.majorMode : "absolute";

      const sweepInfo = computeSweep(startDeg, endDeg);
      const s = sweepInfo.s;
      const e = sweepInfo.e;
      const dir = sweepInfo.dir;

      const majors = [];
      const minors = [];

      /** @param {number} a @returns {boolean} */
      function isMajorAngle(a) {
        if (majorMode === "relative") {
          return mod(Math.round(a - s), stepMajor) === 0;
        }
        return mod(Math.round(a), stepMajor) === 0;
      }

      const maxSteps = 5000;
      let count = 0;
      let a = s;

      while (!isBeyondEnd(a, e, dir, includeEnd) && count++ < maxSteps) {
        if (isMajorAngle(a)) majors.push(a);
        else minors.push(a);
        a += dir * stepMinor;
      }

      if (includeEnd) {
        if (isMajorAngle(e)) majors.push(e);
        else minors.push(e);
      }

      return { majors, minors };
    }

    return {
      id: "RadialTickMath",
      computeSweep,
      isBeyondEnd,
      buildTickAngles
    };
  }

  return { id: "RadialTickMath", create };
}));
