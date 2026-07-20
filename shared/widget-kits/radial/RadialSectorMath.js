/**
 * @file RadialSectorMath - Shared radial sector-building helpers
 * Documentation: documentation/radial/gauge-shared-api.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniRadialSectorMath = factory();
  }
})(this, function () {
  "use strict";

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   */
  function create(def, componentContext) {
    const angle = componentContext.components.require("RadialAngleMath");
    const value = componentContext.components.require("ValueMath");
    const toOptionalFiniteNumber = value.toOptionalFiniteNumber;

    /** @param {unknown} rawValue @param {unknown} defaultValue @returns {number | undefined} */
    function readOptionalThreshold(rawValue, defaultValue) {
      const parsed = toOptionalFiniteNumber(rawValue);
      if (typeof parsed === "number") {
        return parsed;
      }
      return toOptionalFiniteNumber(defaultValue);
    }

    /**
     * @param {unknown} from
     * @param {unknown} to
     * @param {number} minV
     * @param {number} maxV
     * @param {DyniArc} arc
     * @returns {DyniAngleRange | null}
     */
    function sectorAngles(from, to, minV, maxV, arc) {
      const f = value.toFiniteNumber(from);
      const t = value.toFiniteNumber(to);
      if (typeof f !== "number" || typeof t !== "number") {
        return null;
      }
      const ff = value.clamp(f, minV, maxV);
      const tt = value.clamp(t, minV, maxV);
      if (Math.abs(tt - ff) < 1e-9) {
        return null;
      }
      let a0 = angle.valueToAngleFlat(ff, minV, maxV, arc, true);
      let a1 = angle.valueToAngleFlat(tt, minV, maxV, arc, true);
      if (a1 < a0) {
        const tmp = a0;
        a0 = a1;
        a1 = tmp;
      }
      if (Math.abs(a1 - a0) < 1e-6) {
        return null;
      }
      return { a0: a0, a1: a1 };
    }

    /**
     * @param {DyniSectorProps | undefined} props
     * @param {number} minV
     * @param {number} maxV
     * @param {DyniArc} arc
     * @param {DyniSectorOptions | undefined} options
     * @returns {DyniColoredAngleRange[]}
     */
    function buildHighEndSectors(props, minV, maxV, arc, options) {
      const p = props || {};
      const opts = options || {};
      const warningFrom = readOptionalThreshold(p.warningFrom, undefined);
      const alarmFrom = readOptionalThreshold(p.alarmFrom, undefined);
      const warningTo =
        typeof alarmFrom === "number" && typeof warningFrom === "number" && alarmFrom > warningFrom ? alarmFrom : maxV;
      const warning = typeof warningFrom === "number" ? sectorAngles(warningFrom, warningTo, minV, maxV, arc) : null;
      const alarm = typeof alarmFrom === "number" ? sectorAngles(alarmFrom, maxV, minV, maxV, arc) : null;
      const sectors = [];
      if (warning) sectors.push({ a0: warning.a0, a1: warning.a1, color: opts.warningColor });
      if (alarm) sectors.push({ a0: alarm.a0, a1: alarm.a1, color: opts.alarmColor });
      return sectors;
    }

    /**
     * @param {DyniSectorProps | undefined} props
     * @param {number} minV
     * @param {number} maxV
     * @param {DyniArc} arc
     * @param {DyniSectorOptions | undefined} options
     * @returns {DyniColoredAngleRange[]}
     */
    function buildLowEndSectors(props, minV, maxV, arc, options) {
      const p = props || {};
      const opts = options || {};
      const warningFrom = readOptionalThreshold(p.warningFrom, opts.defaultWarningFrom);
      const alarmFrom = readOptionalThreshold(p.alarmFrom, opts.defaultAlarmFrom);
      const alarmTo = typeof alarmFrom === "number" ? value.clamp(alarmFrom, minV, maxV) : undefined;
      const warningTo = typeof warningFrom === "number" ? value.clamp(warningFrom, minV, maxV) : undefined;
      const alarm = typeof alarmTo === "number" && alarmTo > minV ? sectorAngles(minV, alarmTo, minV, maxV, arc) : null;
      const warning =
        typeof alarmTo === "number" && typeof warningTo === "number" && warningTo > alarmTo
          ? sectorAngles(alarmTo, warningTo, minV, maxV, arc)
          : null;
      const warningOnly =
        !alarm && typeof warningTo === "number" && warningTo > minV
          ? sectorAngles(minV, warningTo, minV, maxV, arc)
          : null;
      const sectors = [];
      if (alarm) sectors.push({ a0: alarm.a0, a1: alarm.a1, color: opts.alarmColor });
      if (warning) sectors.push({ a0: warning.a0, a1: warning.a1, color: opts.warningColor });
      if (warningOnly) sectors.push({ a0: warningOnly.a0, a1: warningOnly.a1, color: opts.warningColor });
      return sectors;
    }

    return {
      id: "RadialSectorMath",
      sectorAngles: sectorAngles,
      buildHighEndSectors: buildHighEndSectors,
      buildLowEndSectors: buildLowEndSectors
    };
  }

  return { id: "RadialSectorMath", create: create };
});
