/**
 * Module: AlarmHtmlFitChrome - Shell chrome and cache-signature helpers for vessel alarm HTML
 * Documentation: documentation/widgets/alarm.md
 * Depends: HtmlWidgetUtils
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAlarmHtmlFitChrome = factory(); }
}(this, function () {
  "use strict";

  const ALARM_STRIP_WIDTH_RATIO = 0.072;
  const ALARM_STRIP_WIDTH_MIN_PX = 8;
  const ALARM_STRIP_WIDTH_MAX_RATIO = 0.19;
  const ALARM_STRIP_GAP_TO_WIDTH_RATIO = 0.1875;
  const ALARM_STRIP_PADDING_TO_WIDTH_RATIO = 0.125;

  function toObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function toStyleText(colorKey, value) {
    const color = value == null ? "" : String(value).trim();
    return color ? (colorKey + ":" + color + ";") : "";
  }

  function resolveStripWidthPx(shellWidth, htmlUtils) {
    const rawWidth = htmlUtils.toFiniteNumber(shellWidth);
    const width = rawWidth > 0 ? Math.floor(rawWidth) : 1;
    const preferred = Math.round(width * ALARM_STRIP_WIDTH_RATIO);
    const maxWidth = Math.max(ALARM_STRIP_WIDTH_MIN_PX, Math.floor(width * ALARM_STRIP_WIDTH_MAX_RATIO));
    return Math.max(ALARM_STRIP_WIDTH_MIN_PX, Math.min(maxWidth, preferred));
  }

  function resolveShellChrome(model, shellRect, htmlUtils) {
    const stripWidth = resolveStripWidthPx(shellRect && shellRect.width, htmlUtils);
    const padding = Math.max(1, Math.round(stripWidth * ALARM_STRIP_PADDING_TO_WIDTH_RATIO));
    const stripGap = Math.max(1, Math.round(stripWidth * ALARM_STRIP_GAP_TO_WIDTH_RATIO));
    if (model && model.showStrip === true) {
      return {
        left: padding + stripWidth + stripGap,
        right: padding,
        top: padding,
        bottom: padding,
        stripWidth: stripWidth,
        stripGap: stripGap,
        padding: padding,
        stripRadius: stripWidth
      };
    }
    return {
      left: padding,
      right: padding,
      top: padding,
      bottom: padding,
      stripWidth: stripWidth,
      stripGap: stripGap,
      padding: padding,
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

  function resolveContentRect(shellRect, model, htmlUtils) {
    const chrome = resolveShellChrome(model, shellRect, htmlUtils);
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

  function resolveLayout(args, htmlUtils) {
    const cfg = args || {};
    const model = toObject(cfg.model);
    const roundedShellRect = resolveRoundedShellRect(cfg.shellRect, htmlUtils);
    if (!roundedShellRect) {
      return null;
    }
    const contentRect = resolveContentRect(roundedShellRect, model, htmlUtils);
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

  function buildShellStyle(model, shellRect, htmlUtils) {
    const chrome = resolveShellChrome(model, shellRect, htmlUtils);
    return "padding:" + chrome.top + "px " + chrome.right + "px " + chrome.bottom + "px " + chrome.left + "px;";
  }

  function buildAccentStyle(model, shellRect, tokens, htmlUtils) {
    if (!model || model.showStrip !== true) {
      return "";
    }
    const chrome = resolveShellChrome(model, shellRect, htmlUtils);
    return "left:" + chrome.padding + "px;"
      + "top:" + chrome.padding + "px;"
      + "bottom:" + chrome.padding + "px;"
      + "width:" + chrome.stripWidth + "px;"
      + "border-radius:" + chrome.stripRadius + "px;"
      + toStyleText("background-color", tokens.strip);
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
      chrome.padding,
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

  function create(def, Helpers) {
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);

    return {
      resolveLayout: function (args) {
        return resolveLayout(args, htmlUtils);
      },
      buildShellStyle: function (model, shellRect) {
        return buildShellStyle(model, shellRect, htmlUtils);
      },
      buildAccentStyle: function (model, shellRect, tokens) {
        return buildAccentStyle(model, shellRect, tokens, htmlUtils);
      },
      buildSignature: buildSignature
    };
  }

  return { id: "AlarmHtmlFitChrome", create: create };
}));
