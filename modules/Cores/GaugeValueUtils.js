/**
 * Module: GaugeValueUtils - Shared numeric, range, angle and semicircle geometry helpers
 * Documentation: documentation/gauges/gauge-shared-api.md
 * Depends: GaugeAngleUtils
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniGaugeValueUtils = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const mod = Helpers && Helpers.getModule && Helpers.getModule("GaugeAngleUtils");
    const angle = mod && typeof mod.create === "function" ? mod.create(def, Helpers) : null;

    function isFiniteNumber(n) {
      return typeof n === "number" && isFinite(n);
    }

    function toNumber(value) {
      const n = Number(value);
      return isFinite(n) ? n : NaN;
    }

    function clamp(value, lo, hi) {
      const n = Number(value);
      if (!isFinite(n)) return Number(lo);
      return Math.max(Number(lo), Math.min(Number(hi), n));
    }

    function almostInt(value, eps) {
      const epsilon = isFinite(Number(eps)) ? Number(eps) : 1e-6;
      return Math.abs(value - Math.round(value)) <= epsilon;
    }

    function isApprox(a, b, eps) {
      const epsilon = isFinite(Number(eps)) ? Number(eps) : 1e-6;
      return Math.abs(Number(a) - Number(b)) <= epsilon;
    }

    function computePad(W, H) {
      return Math.max(6, Math.floor(Math.min(W, H) * 0.04));
    }

    function computeGap(W, H) {
      return Math.max(6, Math.floor(Math.min(W, H) * 0.03));
    }

    function computeMode(ratio, thresholdNormal, thresholdFlat) {
      if (ratio < thresholdNormal) return "high";
      if (ratio > thresholdFlat) return "flat";
      return "normal";
    }

    function normalizeRange(minRaw, maxRaw, defaultMin, defaultMax) {
      let minV = toNumber(minRaw);
      let maxV = toNumber(maxRaw);

      if (!isFinite(minV)) minV = toNumber(defaultMin);
      if (!isFinite(minV)) minV = 0;

      if (!isFinite(maxV)) maxV = toNumber(defaultMax);
      if (!isFinite(maxV)) maxV = minV + 1;

      if (maxV <= minV) maxV = minV + 1;
      return { min: minV, max: maxV, range: maxV - minV };
    }

    function valueToAngle(value, minV, maxV, arc, doClamp) {
      const opts = {
        min: Number(minV),
        max: Number(maxV),
        startDeg: Number(arc.startDeg),
        endDeg: Number(arc.endDeg),
        clamp: doClamp !== false
      };

      if (angle && typeof angle.valueToAngle === "function") {
        return angle.valueToAngle(value, opts);
      }

      let v = Number(value);
      if (!isFinite(v)) return NaN;
      if (opts.clamp) v = clamp(v, opts.min, opts.max);
      const t = (opts.max === opts.min) ? 0 : (v - opts.min) / (opts.max - opts.min);
      return opts.startDeg + (opts.endDeg - opts.startDeg) * t;
    }

    function angleToValue(angleDeg, minV, maxV, arc, doClamp) {
      const opts = {
        min: Number(minV),
        max: Number(maxV),
        startDeg: Number(arc.startDeg),
        endDeg: Number(arc.endDeg),
        clamp: doClamp !== false
      };

      if (angle && typeof angle.angleToValue === "function") {
        return angle.angleToValue(angleDeg, opts);
      }

      const a = Number(angleDeg);
      if (!isFinite(a)) return NaN;
      const denom = opts.endDeg - opts.startDeg;
      const t = denom === 0 ? 0 : (a - opts.startDeg) / denom;
      let value = opts.min + (opts.max - opts.min) * t;
      if (opts.clamp) value = clamp(value, opts.min, opts.max);
      return value;
    }

    function buildValueTickAngles(minV, maxV, majorStep, minorStep, arc) {
      const majors = [];
      const minors = [];
      if (!isFinite(minV) || !isFinite(maxV) || maxV <= minV) return { majors, minors };

      let minor = Math.abs(Number(minorStep));
      let major = Math.abs(Number(majorStep));
      if (!isFinite(minor) || minor <= 0) minor = (maxV - minV) / 20;
      if (!isFinite(major) || major <= 0) major = minor * 5;

      const steps = Math.max(1, Math.round((maxV - minV) / minor));
      for (let i = 0; i <= steps; i++) {
        let v = minV + i * minor;
        if (v > maxV) v = maxV;

        const rel = (v - minV) / major;
        const angle = valueToAngle(v, minV, maxV, arc, true);
        (almostInt(rel, 1e-4) ? majors : minors).push(angle);

        if (v === maxV) break;
      }

      if (!majors.length || !isApprox(majors[0], arc.startDeg, 1e-6)) majors.unshift(arc.startDeg);
      if (!isApprox(majors[majors.length - 1], arc.endDeg, 1e-6)) majors.push(arc.endDeg);

      return { majors, minors };
    }

    function sectorAngles(from, to, minV, maxV, arc) {
      const f = toNumber(from);
      const t = toNumber(to);
      if (!isFinite(f) || !isFinite(t)) return null;

      const ff = clamp(f, minV, maxV);
      const tt = clamp(t, minV, maxV);
      if (Math.abs(tt - ff) < 1e-9) return null;

      let a0 = valueToAngle(ff, minV, maxV, arc, true);
      let a1 = valueToAngle(tt, minV, maxV, arc, true);
      if (a1 < a0) {
        const tmp = a0;
        a0 = a1;
        a1 = tmp;
      }
      if (Math.abs(a1 - a0) < 1e-6) return null;
      return { a0, a1 };
    }

    function formatMajorLabel(value) {
      const n = Number(value);
      if (!isFinite(n)) return "";
      if (almostInt(n, 1e-6)) return String(Math.round(n));
      const rounded = Math.round(n * 1000) / 1000;
      return String(rounded);
    }

    function computeSemicircleGeometry(W, H, pad) {
      const availW = Math.max(1, W - 2 * pad);
      const availH = Math.max(1, H - 2 * pad);

      const R = Math.max(14, Math.min(Math.floor(availW / 2), Math.floor(availH)));
      const gaugeLeft = pad + Math.floor((availW - 2 * R) / 2);
      const gaugeTop = pad + Math.floor((availH - R) / 2);

      const ringW = Math.max(6, Math.floor(R * 0.12));
      return {
        availW,
        availH,
        R,
        gaugeLeft,
        gaugeTop,
        cx: gaugeLeft + R,
        cy: gaugeTop + R,
        rOuter: R,
        ringW,
        needleDepth: Math.max(8, Math.floor(ringW * 0.9))
      };
    }

    return {
      id: "GaugeValueUtils",
      version: "0.1.0",
      isFiniteNumber,
      clamp,
      almostInt,
      isApprox,
      computePad,
      computeGap,
      computeMode,
      normalizeRange,
      valueToAngle,
      angleToValue,
      buildValueTickAngles,
      sectorAngles,
      formatMajorLabel,
      computeSemicircleGeometry
    };
  }

  return { id: "GaugeValueUtils", create };
}));
