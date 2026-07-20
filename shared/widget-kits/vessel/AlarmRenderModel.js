/**
 * @file AlarmRenderModel - Pure semantic display model for vessel alarm HTML
 * Documentation: documentation/widgets/alarm.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniAlarmRenderModel = factory();
  }
})(this, function () {
  "use strict";

  const DEFAULT_CAPTION = "ALARM";
  const DEFAULT_IDLE_VALUE = "NONE";

  /** @type {DyniValueMathApi["toObject"]} */
  let toObject;
  /** @type {DyniValueMathApi["toOptionalFiniteNumber"]} */
  let toOptionalFiniteNumber;

  /** @param {Record<string, unknown>} props @param {string} key @param {string} defaultValue @returns {string} */
  function readText(props, key, defaultValue) {
    if (Object.prototype.hasOwnProperty.call(props, key)) {
      const value = props[key];
      return value == null ? "" : String(value);
    }
    return defaultValue;
  }

  /** @param {Record<string, unknown>} props @param {DyniAlarmState} state @param {DyniHtmlWidgetUtilsApi} htmlUtils @returns {DyniAlarmInteractionState} */
  function resolveAlarmInteractionState(props, state, htmlUtils) {
    if (htmlUtils.isEditingMode(props)) {
      return "passive";
    }
    if (state !== "active") {
      return "passive";
    }
    return htmlUtils.canDispatchSurfaceInteraction(props) ? "dispatch" : "passive";
  }

  /** @param {unknown} def @param {DyniComponentContext} componentContext @returns {DyniAlarmRenderModelApi} */
  function create(def, componentContext) {
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const valueMath = componentContext.components.require("ValueMath");
    toObject = valueMath.toObject;
    toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;

    /** @param {unknown} args @returns {DyniAlarmRenderModel} */
    function buildModel(args) {
      const cfg = /** @type {Record<string, unknown>} */ (args || {});
      const props = toObject(cfg.props);
      const domain = toObject(cfg.domain || props.domain);
      const state = domain.state === "active" ? "active" : "idle";
      const captionText = readText(props, "caption", DEFAULT_CAPTION);
      const idleValueText = DEFAULT_IDLE_VALUE;
      const activeValueText = readText(domain, "alarmText", "");
      const valueText = state === "active" ? activeValueText : idleValueText;
      const interactionState = resolveAlarmInteractionState(props, state, htmlUtils);

      return {
        state: state,
        isActive: state === "active",
        hasActiveAlarms: domain.hasActiveAlarms === true,
        activeCount: typeof domain.activeCount === "number" ? domain.activeCount : 0,
        alarmNames: Array.isArray(domain.alarmNames) ? domain.alarmNames.slice() : [],
        alarmText: readText(domain, "alarmText", valueText),
        captionText: captionText,
        idleValueText: idleValueText,
        activeValueText: activeValueText,
        valueText: valueText,
        unitText: "",
        showStrip: state === "idle",
        showActiveBackground: state === "active",
        showHotspot: interactionState === "dispatch",
        interactionState: interactionState,
        canDispatch: interactionState === "dispatch",
        ratioThresholdNormal: toOptionalFiniteNumber(props.ratioThresholdNormal),
        ratioThresholdFlat: toOptionalFiniteNumber(props.ratioThresholdFlat)
      };
    }

    return {
      id: "AlarmRenderModel",
      buildModel: buildModel
    };
  }

  return { id: "AlarmRenderModel", create: create };
});
