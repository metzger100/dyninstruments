/**
 * Module: RegattaTimerHtmlFit - Responsive style-fit owner for regatta timer HTML layout
 * Documentation: documentation/widgets/regatta-timer.md
 * Depends: HtmlWidgetUtils, ValueMath, RegattaTimerPhase, HtmlMeasureUtils, TextLayoutEngine, componentContext.theme.tokens, componentContext.dom
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

  function buildSignature(width, height, mode, phase, displayTime, stableDigitsEnabled, family, valueWeight, labelWeight) {
    return JSON.stringify([
      width,
      height,
      mode,
      phase,
      String(displayTime || "").length,
      stableDigitsEnabled === true,
      family || "",
      valueWeight,
      labelWeight
    ]);
  }

  function create(def, componentContext) {
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const valueMath = componentContext.components.require("ValueMath");
    const phaseApi = componentContext.components.require("RegattaTimerPhase");
    const htmlMeasureUtils = componentContext.components.require("HtmlMeasureUtils");
    const textLayout = componentContext.components.require("TextLayoutEngine");
    const themeResolver = componentContext.theme.tokens;
    const domApi = componentContext.dom;

    function compute(options) {
      const cfg = options || {};
      const model = valueMath.toObject(cfg.model);
      const targetEl = cfg.targetEl || null;
      if (!targetEl) {
        return null;
      }
      const shellRect = valueMath.toObject(cfg.shellRect);
      const widthRaw = valueMath.toOptionalFiniteNumber(shellRect.width);
      const heightRaw = valueMath.toOptionalFiniteNumber(shellRect.height);
      if (!(widthRaw > 0) || !(heightRaw > 0)) {
        return null;
      }

      const rootEl = domApi.requirePluginRoot(targetEl);
      const theme = themeResolver.resolveForRoot(rootEl);
      const font = theme && theme.font && typeof theme.font === "object" ? theme.font : null;
      if (!font) {
        return null;
      }
      const family = font.family;
      const valueWeight = font.weight;
      const labelWeight = font.labelWeight;
      const monoFamily = font.familyMono || family;
      const ctx = htmlMeasureUtils.resolveMeasureContext(cfg.hostContext, cfg.targetEl);
      if (!ctx || typeof ctx.measureText !== "function") {
        return null;
      }

      const width = Math.max(1, Math.round(widthRaw));
      const height = Math.max(1, Math.round(heightRaw));
      const mode = normalizeMode(cfg.mode);
      const phase = phaseApi.normalize(model.phase);
      const displayTime = model.displayTime == null ? "00:00" : String(model.displayTime);
      const stableDigitsEnabled = cfg.stableDigitsEnabled === true;
      const cache = resolveRegattaCacheEntry(cfg.hostContext);
      const signature = buildSignature(width, height, mode, phase, displayTime, stableDigitsEnabled, family, valueWeight, labelWeight);
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
      const buttonPadY = Math.max(0, Math.floor(buttonHeight * 0.12));
      const buttonPadX = Math.max(0, Math.floor(Math.min(buttonWidth * 0.08, buttonHeight * 0.35)));
      const buttonInnerHeight = Math.max(1, buttonHeight - (buttonPadY * 2));
      const buttonInnerWidth = Math.max(1, buttonWidth - (buttonPadX * 2));
      const longestLabel = visibleLabels.reduce(function (longest, label) {
        return label.length > longest.length ? label : longest;
      }, "");
      const buttonFit = textLayout.fitSingleLineBinary({
        ctx: ctx,
        text: longestLabel,
        maxW: buttonInnerWidth,
        maxH: buttonInnerHeight,
        family: family,
        weight: labelWeight
      });
      const buttonFontPx = buttonFit.px;
      const timerHeightBudget = Math.max(1, displayHeight - displayGap);
      const timerWidthBudget = Math.max(1, displayWidth);
      const timerFit = textLayout.fitSingleLineBinary({
        ctx: ctx,
        text: displayTime,
        maxW: timerWidthBudget,
        maxH: timerHeightBudget,
        family: family,
        weight: valueWeight,
        useMono: stableDigitsEnabled,
        monoFamily: monoFamily
      });
      const timerPx = timerFit.px;
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
