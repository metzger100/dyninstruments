/**
 * @file AisTargetViewModel - AIS target summary domain normalization contract owner
 * Documentation: documentation/architecture/cluster-widget-system.md
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetViewModel = factory();
  }
})(this, function () {
  "use strict";

  /** @typedef {{ mmsi?: unknown, type?: unknown, name?: string, shipname?: string, cpa?: unknown, tcpa?: unknown, passFront?: unknown, warning?: unknown, nextWarning?: unknown, nearest?: unknown, distance?: unknown, headingTo?: unknown } & Record<string, unknown>} DyniAisTarget */
  /** @typedef {{ warning: boolean, nextWarning: boolean, nearest: boolean, trackedMatch: boolean, hasColorMmsi: boolean, aisMarkAllWarning: boolean }} DyniAisColorState */
  /** @typedef {{ target?: unknown, trackedMmsi?: unknown, aisMarkAllWarning?: unknown }} DyniAisTargetProps */
  /** @typedef {{ mmsiRaw: unknown, mmsiNormalized: string, trackedMmsiRaw: unknown, hasTargetIdentity: boolean, hasDispatchMmsi: boolean, hasColorMmsi: boolean, distance: number | undefined, cpa: number | undefined, tcpa: number | undefined, headingTo: number | undefined, nameOrMmsi: string, frontText: string, frontInitial: string, showTcpaBranch: boolean, warning: boolean, nextWarning: boolean, nearest: boolean, trackedMatch: boolean, colorRole: DyniAisColorRole | undefined, hasColorRole: boolean }} DyniAisTargetViewModelOutput */
  /** @typedef {"warning" | "nearest" | "tracking" | "normal"} DyniAisColorRole */
  /** @typedef {{ id: "AisTargetViewModel", build: (props?: DyniAisTargetProps) => DyniAisTargetViewModelOutput }} DyniAisTargetViewModelApi */

  /** @type {DyniValueMathApi["isObject"]} */
  let isObject;
  /** @type {DyniValueMathApi["hasText"]} */
  let hasText;
  /** @type {DyniValueMathApi["toOptionalFiniteNumber"]} */
  let toOptionalFiniteNumber;

  /** @param {unknown} mmsi @returns {string} */
  function toDispatchMmsi(mmsi) {
    if (typeof mmsi === "number" && Number.isFinite(mmsi)) {
      return String(Math.trunc(mmsi));
    }
    if (typeof mmsi === "string" && mmsi.trim()) {
      return mmsi.trim();
    }
    return "";
  }

  /** @param {DyniAisTarget} target @param {unknown} mmsiRaw @returns {string} */
  function pickNameOrMmsi(target, mmsiRaw) {
    const isAton = target.type === 21 || target.type === "21";
    if (isAton && typeof target.name === "string" && hasText(target.name)) {
      return target.name.trim();
    }
    if (typeof target.shipname === "string" && hasText(target.shipname)) {
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

  /** @param {number | undefined} cpa @param {number | undefined} passFront @returns {string} */
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

  /** @param {DyniAisColorState} state @returns {DyniAisColorRole | undefined} */
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

  /** @param {unknown} def @param {DyniComponentContext} componentContext @returns {DyniAisTargetViewModelApi} */
  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");
    isObject = valueMath.isObject;
    hasText = valueMath.hasText;
    toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;

    /** @param {DyniAisTargetProps | undefined} props @returns {DyniAisTargetViewModelOutput} */
    function build(props) {
      const p = /** @type {DyniAisTargetProps} */ (props || {});
      const target = /** @type {DyniAisTarget} */ (isObject(p.target) ? p.target : {});
      const mmsiRaw = target.mmsi;
      const trackedMmsiRaw = p.trackedMmsi;
      const hasTargetIdentity = typeof mmsiRaw !== "undefined";
      const mmsiNormalized = toDispatchMmsi(mmsiRaw);
      const cpa = toOptionalFiniteNumber(target.cpa);
      const tcpa = toOptionalFiniteNumber(target.tcpa);
      const passFront = toOptionalFiniteNumber(target.passFront);
      /** @type {DyniAisColorState} */
      const colorState = {
        warning: target.warning === true,
        nextWarning: target.nextWarning === true,
        nearest: target.nearest === true,
        trackedMatch: hasTargetIdentity && mmsiRaw === trackedMmsiRaw,
        hasColorMmsi: !!mmsiRaw && mmsiRaw !== "",
        aisMarkAllWarning: p.aisMarkAllWarning === true
      };
      const frontText = deriveFrontText(cpa, passFront);
      const frontInitial = typeof frontText === "string" && frontText ? frontText.charAt(0) : "-";
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
        showTcpaBranch: typeof tcpa === "number" && tcpa > 0,
        warning: colorState.warning,
        nextWarning: colorState.nextWarning,
        nearest: colorState.nearest,
        trackedMatch: colorState.trackedMatch,
        colorRole: colorRole,
        hasColorRole: colorRole !== undefined
      };
    }

    return {
      id: "AisTargetViewModel",
      build: build
    };
  }

  return { id: "AisTargetViewModel", create: create };
});
