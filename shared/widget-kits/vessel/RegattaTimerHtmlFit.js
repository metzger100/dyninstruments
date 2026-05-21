/**
 * Module: RegattaTimerHtmlFit - Responsive style-fit owner for regatta timer HTML layout
 * Documentation: exec-plans/active/PLAN28.md
 * Depends: HtmlWidgetUtils, ValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRegattaTimerHtmlFit = factory(); }
}(this, function () {
  "use strict";

  const FIT_CACHE_KEY = "__dyniRegattaTimerHtmlFitCache";
  const DEFAULT_MODE = "normal";
  const MIN_BUTTON_TAP_TARGET_PX = 32;

  function normalizeMode(mode) {
    if (mode === "high" || mode === "flat") {
      return mode;
    }
    return DEFAULT_MODE;
  }

  function normalizePhase(phase) {
    if (phase === "countdown" || phase === "elapsed") {
      return phase;
    }
    return "idle";
  }

  function resolveRegattaCacheEntry(hostContext) {
    const owner = hostContext && typeof hostContext === "object" ? hostContext : null;
    if (!owner) {
      return null;
    }
    const existing = owner[FIT_CACHE_KEY];
    if (existing && typeof existing === "object") {
      return existing;
    }
    const cache = { signature: "", result: null };
    owner[FIT_CACHE_KEY] = cache;
    return cache;
  }

  function clearCache(hostContext) {
    const owner = hostContext && typeof hostContext === "object" ? hostContext : null;
    if (owner && Object.prototype.hasOwnProperty.call(owner, FIT_CACHE_KEY)) {
      delete owner[FIT_CACHE_KEY];
    }
  }

  function scaledPx(ratio, baseLength) {
    return Math.max(1, Math.floor(baseLength * ratio));
  }

  function computeModeShares(mode) {
    if (mode === "high") {
      return { display: 0.68, controls: 0.32 };
    }
    if (mode === "flat") {
      return { display: 1.0, controls: 1.0 };
    }
    return { display: 0.62, controls: 0.38 };
  }

  function buildSignature(width, height, mode, phase, displayTime) {
    return JSON.stringify([
      width,
      height,
      mode,
      phase,
      String(displayTime || "").length
    ]);
  }

  function create(def, componentContext) {
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const valueMath = componentContext.components.require("ValueMath");

    function compute(options) {
      const cfg = options || {};
      const model = valueMath.toObject(cfg.model);
      const shellRect = valueMath.toObject(cfg.shellRect);
      const widthRaw = valueMath.toOptionalFiniteNumber(shellRect.width);
      const heightRaw = valueMath.toOptionalFiniteNumber(shellRect.height);
      if (!(widthRaw > 0) || !(heightRaw > 0)) {
        return null;
      }

      const width = Math.max(1, Math.round(widthRaw));
      const height = Math.max(1, Math.round(heightRaw));
      const mode = normalizeMode(cfg.mode);
      const phase = normalizePhase(model.phase);
      const displayTime = model.displayTime == null ? "00:00" : String(model.displayTime);
      const cache = resolveRegattaCacheEntry(cfg.hostContext);
      const signature = buildSignature(width, height, mode, phase, displayTime);
      if (cache && cache.signature === signature && cache.result) {
        return cache.result;
      }

      const minSide = Math.max(1, Math.min(width, height));
      const shares = computeModeShares(mode);
      const pad = scaledPx(0.045, minSide);
      const displayGap = scaledPx(0.02, minSide);
      const controlGap = scaledPx(0.03, minSide);
      const barHeight = scaledPx(0.02, minSide);
      const displayHeight = Math.max(1, Math.floor((height - (pad * 2)) * shares.display));
      const controlsHeight = mode === "flat"
        ? Math.max(1, height - (pad * 2))
        : Math.max(1, Math.floor((height - (pad * 2)) * shares.controls));
      const displayWidth = mode === "flat"
        ? Math.max(1, Math.floor((width - (pad * 2)) * 0.6))
        : Math.max(1, width - (pad * 2));
      const visibleButtons = phase === "countdown" ? 2 : 1;
      const buttonHeight = Math.max(
        MIN_BUTTON_TAP_TARGET_PX,
        Math.floor((controlsHeight - (controlGap * Math.max(0, visibleButtons - 1))) / Math.max(1, visibleButtons))
      );
      const buttonFontPx = Math.max(1, Math.floor(buttonHeight * 0.38));
      const timerHeightBudget = Math.max(1, displayHeight - barHeight - displayGap);
      const timerWidthBudget = Math.max(1, displayWidth);
      const glyphFactor = Math.max(1.5, displayTime.length * 0.62);
      const timerByHeight = Math.floor(timerHeightBudget * 0.78);
      const timerByWidth = Math.floor(timerWidthBudget / glyphFactor);
      const timerPx = Math.max(1, Math.min(timerByHeight, timerByWidth));

      const result = {
        wrapperStyle: "padding:" + pad + "px;",
        displayStyle: "row-gap:" + displayGap + "px;" + (mode === "flat" ? "min-width:0;" : ""),
        timerStyle: htmlUtils.toFontStyle(timerPx),
        controlsStyle: "gap:" + controlGap + "px;",
        barStyle: "height:" + barHeight + "px;",
        buttonStyle: ""
          + "min-height:" + buttonHeight + "px;"
          + "font-size:" + buttonFontPx + "px;"
          + "padding:" + Math.max(1, Math.floor(buttonHeight * 0.24)) + "px " + Math.max(1, Math.floor(buttonHeight * 0.42)) + "px;",
        startButtonStyle: "",
        syncButtonStyle: "",
        resetButtonStyle: ""
      };

      if (cache) {
        cache.signature = signature;
        cache.result = result;
      }
      return result;
    }

    return {
      id: "RegattaTimerHtmlFit",
      compute: compute,
      clearCache: clearCache,
      FIT_CACHE_KEY: FIT_CACHE_KEY
    };
  }

  return { id: "RegattaTimerHtmlFit", create: create };
}));
