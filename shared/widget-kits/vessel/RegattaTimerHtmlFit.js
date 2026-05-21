/**
 * Module: RegattaTimerHtmlFit - Responsive style-fit owner for regatta timer HTML layout
 * Documentation: exec-plans/active/PLAN28.md
 * Depends: HtmlWidgetUtils, ValueMath, RegattaTimerPhase
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRegattaTimerHtmlFit = factory(); }
}(this, function () {
  "use strict";

  const FIT_CACHE_KEY = "__dyniRegattaTimerHtmlFitCache";
  const DEFAULT_MODE = "normal";
  const BAR_HEIGHT_FROM_WIDGET_HEIGHT_RATIO = 0.03;

  function resolveVisibleLabels(phase) {
    if (phase === "countdown") {
      return ["SYNC", "RESET"];
    }
    if (phase === "elapsed") {
      return ["RESET"];
    }
    return ["START"];
  }

  function normalizeMode(mode) {
    if (mode === "high" || mode === "flat") {
      return mode;
    }
    return DEFAULT_MODE;
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

  function buildSignature(width, height, mode, phase, displayTime, stableDigitsEnabled) {
    return JSON.stringify([
      width,
      height,
      mode,
      phase,
      String(displayTime || "").length,
      stableDigitsEnabled === true
    ]);
  }

  function create(def, componentContext) {
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const valueMath = componentContext.components.require("ValueMath");
    const phaseApi = componentContext.components.require("RegattaTimerPhase");

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
      const phase = phaseApi.normalize(model.phase);
      const displayTime = model.displayTime == null ? "00:00" : String(model.displayTime);
      const stableDigitsEnabled = cfg.stableDigitsEnabled === true;
      const cache = resolveRegattaCacheEntry(cfg.hostContext);
      const signature = buildSignature(width, height, mode, phase, displayTime, stableDigitsEnabled);
      if (cache && cache.signature === signature && cache.result) {
        return cache.result;
      }

      const minSide = Math.max(1, Math.min(width, height));
      const shares = computeModeShares(mode);
      const pad = scaledPx(0.045, minSide);
      const sectionGap = scaledPx(0.02, minSide);
      const displayGap = scaledPx(0.02, minSide);
      const controlGap = scaledPx(0.03, minSide);
      const barHeight = scaledPx(BAR_HEIGHT_FROM_WIDGET_HEIGHT_RATIO, height);
      const contentWidth = Math.max(1, width - (pad * 2));
      const contentHeight = Math.max(1, height - (pad * 2));
      const visibleButtons = phase === "countdown" ? 2 : 1;
      const isNormalCountdown = phase === "countdown" && mode === "normal";
      const controlsColumns = isNormalCountdown ? 2 : 1;
      const controlsRows = isNormalCountdown ? 1 : visibleButtons;
      const modeSharesTotal = shares.display + shares.controls;
      const modeDisplayShare = modeSharesTotal > 0 ? (shares.display / modeSharesTotal) : 0.5;
      const modeControlsShare = modeSharesTotal > 0 ? (shares.controls / modeSharesTotal) : 0.5;
      let displayHeight = contentHeight;
      let controlsHeight = contentHeight;
      let displayWidth = contentWidth;
      let controlsWidth = contentWidth;

      if (mode === "flat") {
        const contentWidthWithoutGap = Math.max(1, contentWidth - sectionGap);
        displayWidth = Math.max(1, Math.floor(contentWidthWithoutGap * modeDisplayShare));
        controlsWidth = Math.max(1, contentWidthWithoutGap - displayWidth);
      } else {
        const contentHeightWithoutGap = Math.max(1, contentHeight - sectionGap);
        controlsHeight = Math.max(1, Math.floor(contentHeightWithoutGap * modeControlsShare));
        displayHeight = Math.max(1, contentHeightWithoutGap - controlsHeight);
      }

      const buttonsHeightBudget = Math.max(1, controlsHeight - (controlGap * Math.max(0, controlsRows - 1)));
      const buttonsWidthBudget = Math.max(1, controlsWidth - (controlGap * Math.max(0, controlsColumns - 1)));
      const buttonHeight = Math.max(1, Math.floor(buttonsHeightBudget / Math.max(1, controlsRows)));
      const buttonWidth = Math.max(1, Math.floor(buttonsWidthBudget / Math.max(1, controlsColumns)));
      const visibleLabels = resolveVisibleLabels(phase);
      const longestVisibleLabelLength = visibleLabels.reduce(function (maxLen, label) {
        const labelLength = String(label || "").length;
        return labelLength > maxLen ? labelLength : maxLen;
      }, 1);
      const buttonPadY = Math.max(0, Math.floor(buttonHeight * 0.12));
      const buttonPadX = Math.max(0, Math.floor(Math.min(buttonWidth * 0.08, buttonHeight * 0.35)));
      const buttonInnerHeight = Math.max(1, buttonHeight - (buttonPadY * 2));
      const buttonInnerWidth = Math.max(1, buttonWidth - (buttonPadX * 2));
      const buttonFontByHeight = Math.max(1, Math.floor(buttonInnerHeight * 0.7));
      const buttonFontByWidth = Math.max(1, Math.floor(buttonInnerWidth / Math.max(1.8, longestVisibleLabelLength * 0.66)));
      const buttonFontPx = Math.max(1, Math.min(buttonFontByHeight, buttonFontByWidth));
      const timerHeightBudget = Math.max(1, displayHeight - displayGap);
      const timerWidthBudget = Math.max(1, displayWidth);
      const glyphFactor = Math.max(1.5, displayTime.length * 0.62);
      const timerByHeight = Math.floor(timerHeightBudget * 0.78);
      const timerByWidth = Math.floor(timerWidthBudget / glyphFactor);
      const timerPx = Math.max(1, Math.min(timerByHeight, timerByWidth));
      const flatColumnsStyle = mode === "flat"
        ? "grid-template-columns:minmax(0," + displayWidth + "px) minmax(0," + controlsWidth + "px);"
        : "";
      const flatDisplayWidthStyle = mode === "flat"
        ? "width:" + displayWidth + "px;max-width:100%;"
        : "";
      const flatControlsWidthStyle = mode === "flat"
        ? "width:" + controlsWidth + "px;max-width:100%;"
        : "";
      const controlsGridStyle = isNormalCountdown
        ? "grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:minmax(0,1fr);"
        : (
          "grid-template-columns:minmax(0,1fr);"
          + "grid-template-rows:" + (visibleButtons > 1 ? "repeat(" + visibleButtons + ",minmax(0,1fr))" : "minmax(0,1fr)") + ";"
        );

      const result = {
        wrapperStyle: "padding:" + pad + "px;gap:" + sectionGap + "px;" + flatColumnsStyle,
        displayStyle: "row-gap:" + displayGap + "px;min-width:0;min-height:0;" + flatDisplayWidthStyle,
        timerStyle: htmlUtils.toFontStyle(timerPx),
        controlsStyle: "gap:" + controlGap + "px;min-width:0;min-height:0;" + controlsGridStyle + flatControlsWidthStyle,
        barStyle: "height:" + barHeight + "px;border-radius:" + Math.max(1, Math.floor(barHeight * 0.5)) + "px;",
        buttonStyle: ""
          + "height:" + buttonHeight + "px;"
          + "max-height:" + buttonHeight + "px;"
          + "min-height:0;"
          + "font-size:" + buttonFontPx + "px;"
          + "padding:" + buttonPadY + "px " + buttonPadX + "px;",
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
