/**
 * Module: RegattaTimerMarkup - Pure HTML assembly owner for regatta timer renderer output
 * Documentation: documentation/widgets/regatta-timer.md
 * Depends: HtmlWidgetUtils, RegattaTimerPhase
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRegattaTimerMarkup = factory(); }
}(this, function () {
  "use strict";

  const DEFAULT_DURATION_MINUTES = 5;

  function normalizeMode(mode) {
    if (mode === "high" || mode === "flat") {
      return mode;
    }
    return "normal";
  }

  function normalizeColorPhase(colorPhase) {
    if (colorPhase === "warning" || colorPhase === "critical") {
      return colorPhase;
    }
    return "normal";
  }

  function normalizeInteractionState(interactionState) {
    return interactionState === "dispatch" ? "dispatch" : "passive";
  }

  function toDurationMs(rawMinutes) {
    const minutes = Number(rawMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return DEFAULT_DURATION_MINUTES * 60 * 1000;
    }
    return Math.round(minutes * 60 * 1000);
  }

  function toBarPercent(model, config, phaseApi) {
    const phase = phaseApi.normalize(model.phase);
    if (phase === "elapsed") {
      return "0";
    }
    if (phase === "idle") {
      return "100";
    }

    const remainingMs = Number(model.remainingMs);
    const durationMs = toDurationMs(config.durationMinutes);
    if (!Number.isFinite(remainingMs) || remainingMs <= 0 || durationMs <= 0) {
      return "0";
    }

    const percent = (remainingMs / durationMs) * 100;
    return String(Math.max(0, Math.min(100, percent)));
  }

  function create(def, componentContext) {
    const phaseApi = componentContext.components.require("RegattaTimerPhase");

    function render(options) {
      if (!options || typeof options !== "object") {
        throw new Error("RegattaTimerMarkup.render requires options object");
      }
      if (!options.htmlUtils) {
        throw new Error("RegattaTimerMarkup.render requires htmlUtils");
      }

      const model = options.model;
      const fit = options.fit;
      const config = options.config;
      const htmlUtils = options.htmlUtils;
      const mode = normalizeMode(options.mode);
      const phase = phaseApi.normalize(model.phase);
      const colorPhase = normalizeColorPhase(model.colorPhase);
      const interactionState = normalizeInteractionState(options.interactionState);
      const displayText = model.displayTime == null ? "" : String(model.displayTime);
      const baseButtonStyle = typeof fit.buttonStyle === "string" ? fit.buttonStyle : "";
      const stableDigitsEnabled = options.stableDigitsEnabled === true;

      const wrapperClasses = [
        "dyni-regatta-html",
        "dyni-regatta-mode-" + mode,
        "dyni-regatta-phase-" + phase,
        "dyni-regatta-color-" + colorPhase,
        "dyni-regatta-open-" + interactionState
      ];

      const barHtml = config.progressBarEnabled === true
        ? (
          '<div class="dyni-regatta-bar"'
          + htmlUtils.toStyleAttr(
            htmlUtils.joinStyles(
              "width:" + toBarPercent(model, config, phaseApi) + "%;",
              fit.barStyle
            )
          )
          + "></div>"
        )
        : "";

      return ""
        + '<div class="' + wrapperClasses.join(" ") + '"'
        + htmlUtils.toStyleAttr(fit.wrapperStyle)
        + ">"
        + barHtml
        + '<div class="dyni-regatta-display"'
        + htmlUtils.toStyleAttr(fit.displayStyle)
        + ">"
        + '<div class="dyni-regatta-time' + (stableDigitsEnabled ? " dyni-tabular" : "") + '"'
        + htmlUtils.toStyleAttr(fit.timerStyle)
        + ">"
        + htmlUtils.escapeHtml(displayText)
        + "</div>"
        + "</div>"
        + '<div class="dyni-regatta-controls"'
        + htmlUtils.toStyleAttr(fit.controlsStyle)
        + ">"
        + '<div class="dyni-regatta-btn dyni-regatta-btn-start"'
        + ' data-dyni-action="regatta-start"'
        + htmlUtils.toStyleAttr(htmlUtils.joinStyles(baseButtonStyle, fit.startButtonStyle))
        + ">"
        + htmlUtils.escapeHtml("START")
        + "</div>"
        + '<div class="dyni-regatta-btn dyni-regatta-btn-sync"'
        + ' data-dyni-action="regatta-sync"'
        + htmlUtils.toStyleAttr(htmlUtils.joinStyles(baseButtonStyle, fit.syncButtonStyle))
        + ">"
        + htmlUtils.escapeHtml("SYNC")
        + "</div>"
        + '<div class="dyni-regatta-btn dyni-regatta-btn-reset"'
        + ' data-dyni-action="regatta-reset"'
        + htmlUtils.toStyleAttr(htmlUtils.joinStyles(baseButtonStyle, fit.resetButtonStyle))
        + ">"
        + htmlUtils.escapeHtml("RESET")
        + "</div>"
        + "</div>"
        + "</div>";
    }

    return {
      id: "RegattaTimerMarkup",
      render: render
    };
  }

  return { id: "RegattaTimerMarkup", create: create };
}));
