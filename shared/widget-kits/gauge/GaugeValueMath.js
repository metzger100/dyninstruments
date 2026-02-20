/**
 * Module: GaugeValueMath - Shared numeric, range, angle and semicircle geometry helpers
 * Documentation: documentation/gauges/gauge-shared-api.md
 * Depends: GaugeAngleMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniGaugeValueMath = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const angle = Helpers.getModule("GaugeAngleMath").create(def, Helpers);

    function isFiniteNumber(n) {
      return typeof n === "number" && isFinite(n);
    }

    function toNumber(value) {
      const n = Number(value);
      return isFinite(n) ? n : NaN;
    }

    function extractNumberText(text) {
      const match = String(text).match(/-?\d+(?:\.\d+)?/);
      return match ? match[0] : "";
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

    const valueToAngle = (value, minV, maxV, arc, doClamp) => {
      const opts = {
        min: Number(minV),
        max: Number(maxV),
        startDeg: Number(arc.startDeg),
        endDeg: Number(arc.endDeg),
        clamp: doClamp !== false
      };
      return angle.valueToAngle(value, opts);
    };

    const angleToValue = (angleDeg, minV, maxV, arc, doClamp) => {
      const opts = {
        min: Number(minV),
        max: Number(maxV),
        startDeg: Number(arc.startDeg),
        endDeg: Number(arc.endDeg),
        clamp: doClamp !== false
      };
      return angle.angleToValue(angleDeg, opts);
    };

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

    function buildHighEndSectors(props, minV, maxV, arc, options) {
      const p = props || {};
      const opts = options || {};
      const warningColor = opts.warningColor || "#e7c66a";
      const alarmColor = opts.alarmColor || "#ff7a76";

      const warningFrom = Number(p.warningFrom);
      const alarmFrom = Number(p.alarmFrom);

      const warningTo = (isFinite(alarmFrom) && isFinite(warningFrom) && alarmFrom > warningFrom)
        ? alarmFrom
        : maxV;

      const warning = isFinite(warningFrom)
        ? sectorAngles(warningFrom, warningTo, minV, maxV, arc)
        : null;

      const alarm = isFinite(alarmFrom)
        ? sectorAngles(alarmFrom, maxV, minV, maxV, arc)
        : null;

      const sectors = [];
      if (warning) sectors.push({ a0: warning.a0, a1: warning.a1, color: warningColor });
      if (alarm) sectors.push({ a0: alarm.a0, a1: alarm.a1, color: alarmColor });
      return sectors;
    }

    function buildLowEndSectors(props, minV, maxV, arc, options) {
      const p = props || {};
      const opts = options || {};
      const warningColor = opts.warningColor || "#e7c66a";
      const alarmColor = opts.alarmColor || "#ff7a76";

      const warningFrom = Number((typeof p.warningFrom !== "undefined")
        ? p.warningFrom
        : opts.defaultWarningFrom);
      const alarmFrom = Number((typeof p.alarmFrom !== "undefined")
        ? p.alarmFrom
        : opts.defaultAlarmFrom);

      const alarmTo = isFinite(alarmFrom)
        ? clamp(alarmFrom, minV, maxV)
        : NaN;

      const warningTo = isFinite(warningFrom)
        ? clamp(warningFrom, minV, maxV)
        : NaN;

      const alarm = (isFinite(alarmTo) && alarmTo > minV)
        ? sectorAngles(minV, alarmTo, minV, maxV, arc)
        : null;

      const warning = (isFinite(alarmTo) && isFinite(warningTo) && warningTo > alarmTo)
        ? sectorAngles(alarmTo, warningTo, minV, maxV, arc)
        : null;

      const warningOnly = (!alarm && isFinite(warningTo) && warningTo > minV)
        ? sectorAngles(minV, warningTo, minV, maxV, arc)
        : null;

      const sectors = [];
      if (alarm) sectors.push({ a0: alarm.a0, a1: alarm.a1, color: alarmColor });
      if (warning) sectors.push({ a0: warning.a0, a1: warning.a1, color: warningColor });
      if (warningOnly) sectors.push({ a0: warningOnly.a0, a1: warningOnly.a1, color: warningColor });
      return sectors;
    }

    function formatSpeedString(raw, unit) {
      const n = Number(raw);
      if (!isFinite(n)) return "---";
      if (window.avnav && avnav.api && avnav.api.formatter && typeof avnav.api.formatter.formatSpeed === "function") {
        try {
          return String(avnav.api.formatter.formatSpeed(n, unit || "kn"));
        } catch (ignore) {}
      }
      return n.toFixed(1) + " " + (unit || "kn");
    }

    function formatAngle180(value, leadingZero) {
      const n = Number(value);
      if (!isFinite(n)) return "---";
      let a = ((n + 180) % 360 + 360) % 360 - 180;
      if (a === 180) a = -180;
      const rounded = Math.round(Math.abs(a));
      let out = String(rounded);
      if (leadingZero) out = out.padStart(3, "0");
      if (a < 0) out = "-" + out;
      return out;
    }

    function formatDirection360(value, leadingZero) {
      const n = Number(value);
      if (!isFinite(n)) return "---";
      let a = n % 360;
      if (a < 0) a += 360;
      const rounded = Math.round(a) % 360;
      let out = String(rounded);
      if (leadingZero) out = out.padStart(3, "0");
      return out;
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
      id: "GaugeValueMath",
      version: "0.1.0",
      isFiniteNumber,
      extractNumberText,
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
      buildHighEndSectors,
      buildLowEndSectors,
      formatSpeedString,
      formatAngle180,
      formatDirection360,
      formatMajorLabel,
      computeSemicircleGeometry
    };
  }

  return { id: "GaugeValueMath", create };
}));
