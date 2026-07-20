/**
 * @file RadialValueMath - Radial geometry helpers plus ValueMath compatibility exports
 * Documentation: documentation/radial/gauge-shared-api.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniRadialValueMath = factory();
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
    const sectorMath = componentContext.components.require("RadialSectorMath");

    /**
     * @param {unknown} angleDeg
     * @param {unknown} minV
     * @param {unknown} maxV
     * @param {DyniArc} arc
     * @param {boolean | undefined} doClamp
     * @returns {number}
     */
    function angleToValue(angleDeg, minV, maxV, arc, doClamp) {
      const opts = {
        min: Number(minV),
        max: Number(maxV),
        startDeg: Number(arc.startDeg),
        endDeg: Number(arc.endDeg),
        clamp: doClamp !== false
      };
      return angle.angleToValue(angleDeg, opts);
    }

    /**
     * @param {number} minV
     * @param {number} maxV
     * @param {unknown} majorStep
     * @param {unknown} minorStep
     * @param {DyniArc} arc
     * @returns {DyniRadialTickAngles}
     */
    function buildValueTickAngles(minV, maxV, majorStep, minorStep, arc) {
      /** @type {number[]} */
      const majors = [];
      /** @type {number[]} */
      const minors = [];
      const startDeg = Number(arc && arc.startDeg);
      const endDeg = Number(arc && arc.endDeg);
      if (!Number.isFinite(minV) || !Number.isFinite(maxV) || maxV <= minV) {
        return { majors: majors, minors: minors };
      }
      if (!Number.isFinite(startDeg) || !Number.isFinite(endDeg)) {
        return { majors: majors, minors: minors };
      }

      let minor = Math.abs(Number(minorStep));
      let major = Math.abs(Number(majorStep));
      if (!Number.isFinite(minor) || minor <= 0) minor = (maxV - minV) / 20;
      if (!Number.isFinite(major) || major <= 0) major = minor * 5;

      const steps = Math.max(1, Math.round((maxV - minV) / minor));
      for (let i = 0; i <= steps; i += 1) {
        let v = minV + i * minor;
        if (v > maxV) v = maxV;

        const rel = (v - minV) / major;
        const tickAngle = angle.valueToAngleFlat(v, minV, maxV, arc, true);
        (value.almostInt(rel, 1e-4) ? majors : minors).push(tickAngle);

        if (v === maxV) {
          break;
        }
      }

      if (!majors.length || !value.isApprox(majors[0], startDeg, 1e-6)) majors.unshift(startDeg);
      if (!value.isApprox(majors[majors.length - 1], endDeg, 1e-6)) majors.push(endDeg);

      return { majors: majors, minors: minors };
    }

    return Object.assign({}, value, {
      id: "RadialValueMath",
      valueToAngle: angle.valueToAngleFlat,
      angleToValue: angleToValue,
      buildValueTickAngles: buildValueTickAngles,
      sectorAngles: sectorMath.sectorAngles,
      buildHighEndSectors: sectorMath.buildHighEndSectors,
      buildLowEndSectors: sectorMath.buildLowEndSectors
    });
  }

  return { id: "RadialValueMath", create: create };
});
