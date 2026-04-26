/**
 * Module: AlarmHtmlFit - Text-fit and token-style owner for vessel alarm HTML
 * Documentation: documentation/widgets/alarm.md
 * Depends: ThemeResolver, TextLayoutEngine, HtmlWidgetUtils
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAlarmHtmlFit = factory(); }
}(this, function () {
  "use strict";

  const DEFAULT_RATIO_THRESHOLD_NORMAL = 1.0;
  const DEFAULT_RATIO_THRESHOLD_FLAT = 3.0;
  const SECONDARY_SCALE = 0.8;
  const CONTENT_PAD_X_RATIO = 0.03;
  const MEASURE_CTX_KEY = "__dyniAlarmMeasureCtx";
  const FIT_CACHE_KEY = "__dyniAlarmHtmlFitCache";
  const ALARM_SHELL_CHROME = Object.freeze({
    padding: 2,
    stripLeftPadding: 13,
    stripWidth: 8,
    stripRadius: 8
  });

  function toObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function toText(value) {
    return value == null ? "" : String(value);
  }

  function parseFontPx(font) {
    const source = String(font || "");
    const match = source.match(/(\d+(?:\.\d+)?)px/);
    return match ? Number(match[1]) : 12;
  }

  function createApproximateMeasureContext() {
    return {
      font: "700 12px sans-serif",
      measureText: function (text) {
        const px = Math.max(1, parseFontPx(this.font));
        return { width: String(text).length * px * 0.56 };
      }
    };
  }

  function resolveMeasureContext(hostContext, targetEl) {
    const store = hostContext && typeof hostContext === "object" ? hostContext : null;
    if (store && store[MEASURE_CTX_KEY]) {
      return store[MEASURE_CTX_KEY];
    }

    const ownerDocument = targetEl && targetEl.ownerDocument
      ? targetEl.ownerDocument
      : (typeof document !== "undefined" ? document : null);
    let measureCtx = null;
    if (ownerDocument && typeof ownerDocument.createElement === "function") {
      const probe = ownerDocument.createElement("canvas");
      if (probe && typeof probe.getContext === "function") {
        measureCtx = probe.getContext("2d");
      }
    }
    if (!measureCtx) {
      measureCtx = createApproximateMeasureContext();
    }
    if (store) {
      store[MEASURE_CTX_KEY] = measureCtx;
    }
    return measureCtx;
  }

  function resolveFitCache(hostContext) {
    const store = hostContext && typeof hostContext === "object" ? hostContext : null;
    if (!store) {
      return null;
    }
    if (!store[FIT_CACHE_KEY] || typeof store[FIT_CACHE_KEY] !== "object") {
      store[FIT_CACHE_KEY] = { signature: "", result: null };
    }
    return store[FIT_CACHE_KEY];
  }

  function toFontStyle(px, htmlUtils) {
    const n = htmlUtils.toFiniteNumber(px);
    return n > 0 ? ("font-size:" + Math.max(1, Math.floor(n)) + "px;") : "";
  }

  function toStyleText(colorKey, value) {
    const color = toText(value).trim();
    return color ? (colorKey + ":" + color + ";") : "";
  }

  function resolveShellChrome(model) {
    if (model && model.showStrip === true) {
      return {
        left: ALARM_SHELL_CHROME.stripLeftPadding,
        right: ALARM_SHELL_CHROME.padding,
        top: ALARM_SHELL_CHROME.padding,
        bottom: ALARM_SHELL_CHROME.padding
      };
    }
    return {
      left: ALARM_SHELL_CHROME.padding,
      right: ALARM_SHELL_CHROME.padding,
      top: ALARM_SHELL_CHROME.padding,
      bottom: ALARM_SHELL_CHROME.padding
    };
  }

  function buildShellStyle(model) {
    const chrome = resolveShellChrome(model);
    return "padding:" + chrome.top + "px " + chrome.right + "px " + chrome.bottom + "px " + chrome.left + "px;";
  }

  function buildAccentStyle(model, tokens) {
    if (!model || model.showStrip !== true) {
      return "";
    }
    return "left:" + ALARM_SHELL_CHROME.padding + "px;"
      + "top:" + ALARM_SHELL_CHROME.padding + "px;"
      + "bottom:" + ALARM_SHELL_CHROME.padding + "px;"
      + "width:" + ALARM_SHELL_CHROME.stripWidth + "px;"
      + "border-radius:" + ALARM_SHELL_CHROME.stripRadius + "px;"
      + toStyleText("background-color", tokens.strip);
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

  function resolveContentRect(shellRect, model) {
    const chrome = resolveShellChrome(model);
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
    const resolvedNormalThreshold = normalThreshold > 0 ? normalThreshold : DEFAULT_RATIO_THRESHOLD_NORMAL;
    const resolvedFlatThreshold = flatThreshold > 0 ? flatThreshold : DEFAULT_RATIO_THRESHOLD_FLAT;
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
    const contentRect = resolveContentRect(roundedShellRect, model);
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

  function computeContentPadX(width, height) {
    return Math.max(2, Math.floor(Math.min(width, height) * CONTENT_PAD_X_RATIO));
  }

  function resolveThemeColors(theme) {
    const colors = theme && theme.colors && typeof theme.colors === "object" ? theme.colors : null;
    const alarmWidget = colors && colors.alarmWidget && typeof colors.alarmWidget === "object"
      ? colors.alarmWidget
      : null;
    return {
      bg: alarmWidget ? alarmWidget.bg : undefined,
      fg: alarmWidget ? alarmWidget.fg : undefined,
      strip: alarmWidget ? alarmWidget.strip : undefined
    };
  }

  function computeModeFit(args, textLayout, htmlUtils) {
    const cfg = args || {};
    const mode = cfg.mode;
    const model = cfg.model;
    const width = Math.max(1, Math.round(cfg.width));
    const height = Math.max(1, Math.round(cfg.height));
    const padX = computeContentPadX(width, height);
    const maxW = Math.max(1, width - padX * 2);
    const ctx = cfg.ctx;
    const family = cfg.family;
    const valueWeight = cfg.valueWeight;
    const labelWeight = cfg.labelWeight;
    const secScale = SECONDARY_SCALE;
    const textFillScale = 1;
    const gapBase = Math.max(0, Math.floor(Math.min(width, height) * 0.04));
    const innerY = Math.max(0, Math.floor(Math.min(width, height) * 0.05));

    if (mode === "flat") {
      const fit = textLayout.fitInlineTriplet({
        ctx: ctx,
        captionText: model.captionText,
        valueText: model.valueText,
        unitText: "",
        secScale: secScale,
        gap: gapBase,
        maxW: maxW,
        maxH: height,
        family: family,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        useMono: false,
        monoFamily: family,
        textFillScale: textFillScale
      });
      return {
        captionPx: fit.sPx,
        valuePx: fit.vPx,
        modeFit: fit
      };
    }

    if (mode === "high") {
      const fit = textLayout.fitThreeRowBlock({
        ctx: ctx,
        W: maxW,
        H: height,
        padX: 0,
        innerY: innerY,
        secScale: secScale,
        textFillScale: textFillScale,
        captionText: model.captionText,
        valueText: model.valueText,
        unitText: "",
        family: family,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        useMono: false,
        monoFamily: family
      });
      return {
        captionPx: fit.cPx,
        valuePx: fit.vPx,
        modeFit: fit
      };
    }

    const fit = textLayout.fitValueUnitCaptionRows({
      ctx: ctx,
      W: maxW,
      H: height,
      padX: 0,
      innerY: innerY,
      gapBase: gapBase,
      secScale: secScale,
      textFillScale: textFillScale,
      captionText: model.captionText,
      valueText: model.valueText,
      unitText: "",
      family: family,
      valueWeight: valueWeight,
      labelWeight: labelWeight,
      useMono: false,
      monoFamily: family
    });
    return {
      captionPx: fit.cPx,
      valuePx: fit.vPx,
      modeFit: fit
    };
  }

  function buildSignature(args) {
    const cfg = args || {};
    const model = toObject(cfg.model);
    return JSON.stringify([
      cfg.mode,
      cfg.width,
      cfg.height,
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
      cfg.themeStrip
    ]);
  }

  function create(def, Helpers) {
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);
    const textLayout = Helpers.getModule("TextLayoutEngine").create(def, Helpers);
    const themeResolver = Helpers.getModule("ThemeResolver");

    function compute(args) {
      const cfg = args || {};
      const model = toObject(cfg.model);
      const shellRect = cfg.shellRect && typeof cfg.shellRect === "object" ? cfg.shellRect : null;
      const targetEl = cfg.targetEl || cfg.rootEl || null;
      if (!model || !shellRect || !targetEl) {
        return null;
      }

      const rootEl = Helpers.requirePluginRoot(targetEl);
      const theme = themeResolver.resolveForRoot(rootEl);
      const tokens = resolveThemeColors(theme);
      const measureCtx = resolveMeasureContext(cfg.hostContext, targetEl);
      if (!measureCtx || typeof measureCtx.measureText !== "function") {
        return null;
      }

      const fitCache = resolveFitCache(cfg.hostContext);
      const font = theme && theme.font && typeof theme.font === "object" ? theme.font : null;
      if (!font) {
        return null;
      }
      const layout = resolveLayout({
        model: model,
        shellRect: shellRect
      }, htmlUtils);
      if (!layout) {
        return null;
      }
      const padX = computeContentPadX(layout.contentRect.width, layout.contentRect.height);
      const family = font.family;
      const valueWeight = font.weight;
      const labelWeight = font.labelWeight;
      const signature = buildSignature({
        mode: layout.mode,
        width: layout.contentRect.width,
        height: layout.contentRect.height,
        padX: padX,
        model: model,
        family: family,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        themeBg: tokens.bg,
        themeFg: tokens.fg,
        themeStrip: tokens.strip
      });
      if (fitCache && fitCache.signature === signature && fitCache.result) {
        return fitCache.result;
      }

      const modeFit = computeModeFit({
        mode: layout.mode,
        model: model,
        width: layout.contentRect.width,
        height: layout.contentRect.height,
        ctx: measureCtx,
        family: family,
        valueWeight: valueWeight,
        labelWeight: labelWeight
      }, textLayout, htmlUtils);

      const activeBackgroundStyle = model.showActiveBackground === true ? toStyleText("background-color", tokens.bg) : "";
      const activeForegroundStyle = model.state === "active" ? toStyleText("color", tokens.fg) : "";
      const shellStyle = buildShellStyle(model);
      const accentStyle = buildAccentStyle(model, tokens);
      const result = {
        mode: layout.mode,
        captionPx: modeFit.captionPx,
        valuePx: modeFit.valuePx,
        captionStyle: toFontStyle(modeFit.captionPx, htmlUtils),
        valueStyle: toFontStyle(modeFit.valuePx, htmlUtils),
        shellStyle: shellStyle,
        accentStyle: accentStyle,
        activeBackgroundStyle: activeBackgroundStyle,
        activeForegroundStyle: activeForegroundStyle,
        idleStripStyle: accentStyle,
        showStrip: model.showStrip === true,
        showActiveBackground: model.showActiveBackground === true,
        valueSingleLine: true,
        interactionState: model.interactionState || "passive",
        state: model.state || "idle"
      };

      if (fitCache) {
        fitCache.signature = signature;
        fitCache.result = result;
      }
      return result;
    }

    return {
      id: "AlarmHtmlFit",
      compute: compute,
      resolveLayout: function (args) {
        return resolveLayout(args, htmlUtils);
      }
    };
  }

  return { id: "AlarmHtmlFit", create: create };
}));
