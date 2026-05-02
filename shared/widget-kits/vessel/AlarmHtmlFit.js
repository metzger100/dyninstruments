/**
 * Module: AlarmHtmlFit - Text-fit and token-style owner for vessel alarm HTML
 * Documentation: documentation/widgets/alarm.md
 * Depends: ThemeResolver, TextLayoutEngine, AlarmHtmlFitChrome, HtmlWidgetUtils
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAlarmHtmlFit = factory(); }
}(this, function () {
  "use strict";

  const SECONDARY_SCALE = 0.8;
  const CONTENT_PAD_X_RATIO = 0.03;
  const MEASURE_CTX_KEY = "__dyniAlarmMeasureCtx";
  const FIT_CACHE_KEY = "__dyniAlarmHtmlFitCache";
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

  function create(def, Helpers) {
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);
    const textLayout = Helpers.getModule("TextLayoutEngine").create(def, Helpers);
    const themeResolver = Helpers.getModule("ThemeResolver");
    const chromeApi = Helpers.getModule("AlarmHtmlFitChrome").create(def, Helpers);

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
      const layout = chromeApi.resolveLayout({
        model: model,
        shellRect: shellRect
      });
      if (!layout) {
        return null;
      }
      const padX = computeContentPadX(layout.contentRect.width, layout.contentRect.height);
      const family = font.family;
      const valueWeight = font.weight;
      const labelWeight = font.labelWeight;
      const signature = chromeApi.buildSignature({
        mode: layout.mode,
        width: layout.contentRect.width,
        height: layout.contentRect.height,
        shellWidth: layout.shellRect.width,
        shellHeight: layout.shellRect.height,
        chrome: layout.contentRect.chrome,
        padX: padX,
        model: model,
        family: family,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        themeBg: tokens.bg,
        themeFg: tokens.fg,
        themeStrip: tokens.strip,
        fontMetricsEpoch: cfg.fontMetricsEpoch
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
      const chrome = layout.contentRect.chrome;
      const shellStyle = chromeApi.buildShellStyle(chrome);
      const accentStyle = chromeApi.buildAccentStyle(model, chrome, tokens);
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
        return chromeApi.resolveLayout(args);
      }
    };
  }

  return { id: "AlarmHtmlFit", create: create };
}));
