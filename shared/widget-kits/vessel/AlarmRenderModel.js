/**
 * Module: AlarmRenderModel - Pure semantic display model for vessel alarm HTML
 * Documentation: documentation/guides/add-new-html-kind.md
 * Depends: HtmlWidgetUtils
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAlarmRenderModel = factory(); }
}(this, function () {
  "use strict";

  const DEFAULT_CAPTION = "ALARM";
  const DEFAULT_IDLE_VALUE = "NONE";

  function toObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function readText(props, key, defaultValue) {
    if (Object.prototype.hasOwnProperty.call(props, key)) {
      const value = props[key];
      return value == null ? "" : String(value);
    }
    return defaultValue;
  }

  function resolveSurfacePolicy(props) {
    const p = props && typeof props === "object" ? props : null;
    return p && p.surfacePolicy && typeof p.surfacePolicy === "object" ? p.surfacePolicy : null;
  }

  function resolveInteractionState(props, state, surfacePolicy, htmlUtils) {
    if (htmlUtils.isEditingMode(props)) {
      return "passive";
    }
    if (state !== "active") {
      return "passive";
    }
    return surfacePolicy && surfacePolicy.interaction && surfacePolicy.interaction.mode === "dispatch"
      ? "dispatch"
      : "passive";
  }

  function create(def, Helpers) {
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);

    function buildModel(args) {
      const cfg = args || {};
      const props = toObject(cfg.props);
      const domain = toObject(cfg.domain || props.domain);
      const surfacePolicy = resolveSurfacePolicy(props);
      const state = domain.state === "active" ? "active" : "idle";
      const captionText = readText(props, "caption", DEFAULT_CAPTION);
      const idleValueText = DEFAULT_IDLE_VALUE;
      const activeValueText = readText(domain, "alarmText", "");
      const valueText = state === "active" ? activeValueText : idleValueText;
      const interactionState = resolveInteractionState(props, state, surfacePolicy, htmlUtils);

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
        ratioThresholdNormal: htmlUtils.toFiniteNumber(props.ratioThresholdNormal),
        ratioThresholdFlat: htmlUtils.toFiniteNumber(props.ratioThresholdFlat)
      };
    }

    return {
      id: "AlarmRenderModel",
      buildModel: buildModel
    };
  }

  return { id: "AlarmRenderModel", create: create };
}));
