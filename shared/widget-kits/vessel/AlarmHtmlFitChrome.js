/**
 * Module: AlarmHtmlFitChrome - Shell chrome and cache-signature helpers for vessel alarm HTML
 * Documentation: documentation/widgets/alarm.md
 * Depends: HtmlWidgetUtils, AisTargetLayoutSizing, ValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniAlarmHtmlFitChrome = factory();
  }
}(this, function () {
  "use strict";

  let toObject;

  function resolveShellChrome(model, shellRect, chromeApi) {
    const aisChrome = chromeApi.resolveVisualChrome({
      W: shellRect.width,
      H: shellRect.height,
      hasAccent: model && model.showStrip === true
    });
    const stripWidth = Math.max(0, Math.round(aisChrome.stripWidth || 0));
    const stripLeft = Math.max(0, Math.round(aisChrome.stripLeft || 0));
    const stripTop = Math.max(0, Math.round(aisChrome.stripTop || 0));
    const stripBottom = Math.max(0, Math.round(aisChrome.stripBottom || 0));
    const contentLeft = Math.max(0, Math.round(aisChrome.contentLeft || 0));
    const contentRight = Math.max(0, Math.round(aisChrome.contentRight || 0));
    const contentTop = Math.max(0, Math.round(aisChrome.contentTop || 0));
    const contentBottom = Math.max(0, Math.round(aisChrome.contentBottom || 0));
    const stripGap = Math.max(0, Math.round(aisChrome.accentGap || 0));
    return {
      left: contentLeft,
      right: contentRight,
      top: contentTop,
      bottom: contentBottom,
      stripWidth: stripWidth,
      stripGap: stripGap,
      stripLeft: stripLeft,
      stripTop: stripTop,
      stripBottom: stripBottom,
      padX: Math.max(0, Math.round(aisChrome.padX || 0)),
      padY: Math.max(0, Math.round(aisChrome.padY || 0)),
      accentReserve: Math.max(0, Math.round(aisChrome.accentReserve || 0)),
      stripRadius: stripWidth
    };
  }

  function resolveRoundedShellRect(shellRect, htmlUtils) {
    const width = htmlUtils.toFiniteNumber(shellRect && shellRect.width);
    const height = htmlUtils.toFiniteNumber(shellRect && shellRect.height);
    if (!(width > 0) || !(height > 0)) {
      return null;
    }
    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  function resolveContentRect(shellRect, chrome) {
    const width = Math.max(1, Math.round(shellRect.width) - chrome.left - chrome.right);
    const height = Math.max(1, Math.round(shellRect.height) - chrome.top - chrome.bottom);
    return {
      width: width,
      height: height,
      chrome: chrome
    };
  }

  function resolveMode(htmlUtils, model, contentRect) {
    const width = htmlUtils.toFiniteNumber(contentRect && contentRect.width);
    const height = htmlUtils.toFiniteNumber(contentRect && contentRect.height);
    if (!(width > 0) || !(height > 0)) {
      return null;
    }
    const ratio = width / height;
    const normalThreshold = htmlUtils.toFiniteNumber(model.ratioThresholdNormal);
    const flatThreshold = htmlUtils.toFiniteNumber(model.ratioThresholdFlat);
    const resolvedNormalThreshold = normalThreshold > 0 ? normalThreshold : 1.0;
    const resolvedFlatThreshold = flatThreshold > 0 ? flatThreshold : 3.0;
    if (ratio < resolvedNormalThreshold) {
      return "high";
    }
    if (ratio > resolvedFlatThreshold) {
      return "flat";
    }
    return "normal";
  }

  function resolveLayout(args, htmlUtils, chromeApi) {
    const cfg = args || {};
    const model = toObject(cfg.model);
    const roundedShellRect = resolveRoundedShellRect(cfg.shellRect, htmlUtils);
    if (!roundedShellRect) {
      return null;
    }
    const chrome = resolveShellChrome(model, roundedShellRect, chromeApi);
    const contentRect = resolveContentRect(roundedShellRect, chrome);
    const mode = resolveMode(htmlUtils, model, contentRect);
    if (!mode) {
      return null;
    }
    return {
      mode: mode,
      shellRect: roundedShellRect,
      contentRect: contentRect
    };
  }

  function buildShellStyle(chrome) {
    return "padding:" + chrome.top + "px " + chrome.right + "px " + chrome.bottom + "px " + chrome.left + "px;";
  }

  function buildAccentStyle(model, chrome, tokens, htmlUtils) {
    if (!model || model.showStrip !== true) {
      return "";
    }
    return "left:" + chrome.stripLeft + "px;"
      + "top:" + chrome.stripTop + "px;"
      + "bottom:" + chrome.stripBottom + "px;"
      + "width:" + chrome.stripWidth + "px;"
      + "border-radius:" + chrome.stripRadius + "px;"
      + htmlUtils.toStyleText("background-color", tokens.strip);
  }

  function buildSignature(args) {
    const cfg = args || {};
    const model = toObject(cfg.model);
    const chrome = cfg.chrome && typeof cfg.chrome === "object" ? cfg.chrome : {};
    return JSON.stringify([
      cfg.mode,
      cfg.width,
      cfg.height,
      cfg.shellWidth,
      cfg.shellHeight,
      chrome.left,
      chrome.right,
      chrome.top,
      chrome.bottom,
      chrome.stripWidth,
      chrome.stripGap,
      chrome.stripLeft,
      chrome.stripTop,
      chrome.stripBottom,
      chrome.padX,
      chrome.padY,
      chrome.accentReserve,
      chrome.stripRadius,
      model.state,
      model.interactionState,
      model.captionText,
      model.valueText,
      model.ratioThresholdNormal,
      model.ratioThresholdFlat,
      model.showStrip === true ? 1 : 0,
      model.showActiveBackground === true ? 1 : 0,
      cfg.padX,
      cfg.family,
      cfg.valueWeight,
      cfg.labelWeight,
      cfg.themeBg,
      cfg.themeFg,
      cfg.themeStrip,
      cfg.fontMetricsEpoch
    ]);
  }

  function create(def, componentContext) {
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const aisSizingApi = componentContext.components.require("AisTargetLayoutSizing");
    toObject = componentContext.components.require("ValueMath").toObject;

    return {
      resolveLayout: function (args) {
        return resolveLayout(args, htmlUtils, aisSizingApi);
      },
      buildShellStyle: function (chrome) {
        return buildShellStyle(chrome);
      },
      buildAccentStyle: function (model, chrome, tokens) {
        return buildAccentStyle(model, chrome, tokens, htmlUtils);
      },
      buildSignature: buildSignature
    };
  }

  return { id: "AlarmHtmlFitChrome", create: create };
}));
