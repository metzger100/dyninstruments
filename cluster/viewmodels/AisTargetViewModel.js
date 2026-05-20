/**
 * Module: AisTargetViewModel - AIS target summary domain normalization contract owner
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ValueMath
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetViewModel = factory(); }
}(this, function () {
  "use strict";

  let isObject;
  let hasText;
  let toOptionalFiniteNumber;

  function toDispatchMmsi(mmsi) {
    if (typeof mmsi === "number" && Number.isFinite(mmsi)) {
      return String(Math.trunc(mmsi));
    }
    if (typeof mmsi === "string" && mmsi.trim()) {
      return mmsi.trim();
    }
    return "";
  }

  function pickNameOrMmsi(target, mmsiRaw) {
    const isAton = target.type === 21 || target.type === "21";
    if (isAton && hasText(target.name)) {
      return target.name.trim();
    }
    if (hasText(target.shipname)) {
      return target.shipname.trim();
    }
    if (typeof mmsiRaw === "string" && mmsiRaw.trim() !== "") {
      return mmsiRaw.trim();
    }
    if (typeof mmsiRaw === "number" && Number.isFinite(mmsiRaw)) {
      return String(mmsiRaw);
    }
    return "";
  }

  function deriveFrontText(cpa, passFront) {
    if (!cpa) {
      return "-";
    }
    if (typeof passFront !== "number") {
      return "Done";
    }
    if (passFront > 0) {
      return "Front";
    }
    if (passFront < 0) {
      return "Back";
    }
    return "Pass";
  }

  function deriveColorRole(state) {
    if ((state.warning && state.aisMarkAllWarning) || state.nextWarning) {
      return "warning";
    }
    if (state.nearest) {
      return "nearest";
    }
    if (state.trackedMatch) {
      return "tracking";
    }
    if (state.hasColorMmsi) {
      return "normal";
    }
    return undefined;
  }

  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");
    isObject = valueMath.isObject;
    hasText = valueMath.hasText;
    toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;

    function build(props) {
      const p = props || {};
      const target = isObject(p.target) ? p.target : {};
      const mmsiRaw = target.mmsi;
      const trackedMmsiRaw = p.trackedMmsi;
      const hasTargetIdentity = typeof mmsiRaw !== "undefined";
      const mmsiNormalized = toDispatchMmsi(mmsiRaw);
      const cpa = toOptionalFiniteNumber(target.cpa);
      const tcpa = toOptionalFiniteNumber(target.tcpa);
      const passFront = toOptionalFiniteNumber(target.passFront);
      const colorState = {
        warning: target.warning === true,
        nextWarning: target.nextWarning === true,
        nearest: target.nearest === true,
        trackedMatch: hasTargetIdentity && mmsiRaw === trackedMmsiRaw,
        hasColorMmsi: !!mmsiRaw && mmsiRaw !== "",
        aisMarkAllWarning: p.aisMarkAllWarning === true
      };
      const frontText = deriveFrontText(cpa, passFront);
      const frontInitial = typeof frontText === "string" && frontText
        ? frontText.charAt(0)
        : "-";
      const colorRole = deriveColorRole(colorState);

      return {
        mmsiRaw: mmsiRaw,
        mmsiNormalized: mmsiNormalized,
        trackedMmsiRaw: trackedMmsiRaw,
        hasTargetIdentity: hasTargetIdentity,
        hasDispatchMmsi: mmsiNormalized !== "",
        hasColorMmsi: colorState.hasColorMmsi,
        distance: toOptionalFiniteNumber(target.distance),
        cpa: cpa,
        tcpa: tcpa,
        headingTo: toOptionalFiniteNumber(target.headingTo),
        nameOrMmsi: pickNameOrMmsi(target, mmsiRaw),
        frontText: frontText,
        frontInitial: frontInitial,
        showTcpaBranch: tcpa > 0,
        warning: colorState.warning,
        nextWarning: colorState.nextWarning,
        nearest: colorState.nearest,
        trackedMatch: colorState.trackedMatch,
        colorRole: colorRole,
        hasColorRole: typeof colorRole === "string" && colorRole !== ""
      };
    }

    return {
      id: "AisTargetViewModel",
      build: build
    };
  }

  return { id: "AisTargetViewModel", create: create };
}));
