/**
 * Module: GaugeTickUtils - Shared tick sweep and major/minor angle generation
 * Documentation: documentation/gauges/gauge-shared-api.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniGaugeTickUtils = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function mod(n, m) { return ((n % m) + m) % m; }

    function computeSweep(startDeg, endDeg) {
      let s = Number(startDeg);
      let e = Number(endDeg);
      if (!isFinite(s) || !isFinite(e)) return { s: 0, e: 0, sweep: 0, dir: 1 };

      let sweep = e - s;
      if (sweep === 0) sweep = 360;
      const dir = (sweep >= 0) ? 1 : -1;

      return { s, e, sweep, dir };
    }

    function buildTickAngles(opts) {
      opts = opts || {};
      const startDeg = Number(opts.startDeg ?? 0);
      const endDeg = Number(opts.endDeg ?? 360);
      const stepMajor = Math.abs(Number(opts.stepMajor ?? 30)) || 30;
      const stepMinor = Math.abs(Number(opts.stepMinor ?? 10)) || 10;
      const includeEnd = !!opts.includeEnd;
      const majorMode = opts.majorMode || "absolute";

      const sweepInfo = computeSweep(startDeg, endDeg);
      const s = sweepInfo.s;
      const e = sweepInfo.e;
      const dir = sweepInfo.dir;

      const majors = [];
      const minors = [];

      function isMajorAngle(a) {
        if (majorMode === "relative") {
          return mod(Math.round(a - s), stepMajor) === 0;
        }
        return mod(Math.round(a), stepMajor) === 0;
      }

      const maxSteps = 5000;
      let count = 0;
      let a = s;

      function reachedEnd(curr) {
        if (dir > 0) return includeEnd ? (curr > e) : (curr >= e);
        return includeEnd ? (curr < e) : (curr <= e);
      }

      while (!reachedEnd(a) && count++ < maxSteps) {
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
      id: "GaugeTickUtils",
      version: "0.1.0",
      computeSweep,
      buildTickAngles
    };
  }

  return { id: "GaugeTickUtils", create };
}));
