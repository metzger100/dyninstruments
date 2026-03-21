/**
 * Module: MapZoomHtmlFit - Per-element text fitting for map zoom HTML renderer
 * Documentation: documentation/widgets/map-zoom.md
 * Depends: Helpers.resolveFontFamily
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniMapZoomHtmlFit = factory(); }
}(this, function () {
  "use strict";

  const MEASURE_CTX_KEY = "__dyniMapZoomMeasureCtx";

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function resolveShellRect(hostContext) {
    const commit = hostContext && hostContext.__dyniHostCommitState;
    const target = commit && (commit.shellEl || commit.rootEl);
    if (!target || typeof target.getBoundingClientRect !== "function") {
      return null;
    }
    const rect = target.getBoundingClientRect();
    const width = toFiniteNumber(rect && rect.width);
    const height = toFiniteNumber(rect && rect.height);
    if (!(width > 0) || !(height > 0)) {
      return null;
    }
    return { width: width, height: height };
  }

  function buildApproximateMeasureContext() {
    const context = {
      font: "700 12px sans-serif",
      approxFontPx: 12,
      measureText: function (text) {
        const source = String(this.font || "");
        const match = source.match(/(\d+(?:\.\d+)?)px/);
        const parsed = match ? Number(match[1]) : this.approxFontPx;
        const resolvedPx = Number.isFinite(parsed) ? parsed : this.approxFontPx;
        this.approxFontPx = Math.max(1, resolvedPx);
        return { width: String(text).length * this.approxFontPx * 0.58 };
      }
    };
    return context;
  }

  function getMeasureTarget(hostContext) {
    const commit = hostContext && hostContext.__dyniHostCommitState;
    return commit && (commit.shellEl || commit.rootEl);
  }

  function resolveMeasureContext(hostContext) {
    if (hostContext && hostContext[MEASURE_CTX_KEY]) {
      return hostContext[MEASURE_CTX_KEY];
    }

    const target = getMeasureTarget(hostContext);
    const ownerDocument = target && target.ownerDocument ? target.ownerDocument : (typeof document !== "undefined" ? document : null);
    const ownerView = ownerDocument && ownerDocument.defaultView;
    const userAgent = ownerView && ownerView.navigator ? String(ownerView.navigator.userAgent || "") : "";
    const isJsDom = /jsdom/i.test(userAgent);

    let context2d = null;
    if (!isJsDom && ownerDocument && typeof ownerDocument.createElement === "function") {
      const canvas = ownerDocument.createElement("canvas");
      if (canvas && typeof canvas.getContext === "function") {
        context2d = canvas.getContext("2d");
      }
    }
    const out = context2d || buildApproximateMeasureContext();
    if (hostContext && typeof hostContext === "object") {
      hostContext[MEASURE_CTX_KEY] = out;
    }
    return out;
  }

  function measureWidthPx(ctx, text, family, weight, fontPx) {
    const px = Math.max(1, Math.floor(toFiniteNumber(fontPx) || 1));
    ctx.font = String(weight) + " " + px + "px " + String(family);
    return ctx.measureText(String(text)).width;
  }

  function fitTextPx(args) {
    const cfg = args || {};
    const ctx = cfg.ctx;
    const text = String(cfg.text);
    if (!ctx || typeof ctx.measureText !== "function" || !text.trim()) {
      return 0;
    }

    const minPx = Math.max(1, Math.floor(toFiniteNumber(cfg.minPx) || 1));
    const maxPx = Math.max(minPx, Math.floor(toFiniteNumber(cfg.maxPx) || minPx));
    const maxW = Math.max(1, toFiniteNumber(cfg.maxW) || 1);
    const maxH = Math.max(1, toFiniteNumber(cfg.maxH) || 1);
    const family = cfg.family;
    const weight = cfg.weight;

    for (let px = maxPx; px >= minPx; px -= 1) {
      const width = measureWidthPx(ctx, text, family, weight, px);
      if (width <= maxW && px <= maxH) {
        return px;
      }
    }
    return minPx;
  }

  function toFontStyle(px) {
    const out = Math.floor(toFiniteNumber(px) || 0);
    return out > 0 ? ("font-size:" + out + "px;") : "";
  }

  function capSecondaryPx(secondaryPx, valuePx, secondaryScale) {
    const currentPx = Math.floor(toFiniteNumber(secondaryPx) || 0);
    if (!(currentPx > 0)) {
      return 0;
    }
    const valueSizePx = Math.floor(toFiniteNumber(valuePx) || 0);
    if (!(valueSizePx > 0)) {
      return currentPx;
    }
    const rawScale = toFiniteNumber(secondaryScale);
    const scale = typeof rawScale === "number" ? rawScale : 0.8;
    const maxSecondaryPx = Math.max(1, Math.floor(valueSizePx * scale));
    return Math.min(currentPx, maxSecondaryPx);
  }

  function computeUnitValueFit(args) {
    const cfg = args || {};
    const gap = cfg.hasUnit ? cfg.gapPx : 0;
    const availableW = Math.max(1, cfg.maxW - gap);
    const unitMaxW = cfg.hasUnit ? Math.max(1, availableW * cfg.unitShare) : 0;
    const unitPx = cfg.hasUnit
      ? fitTextPx({
        ctx: cfg.ctx,
        text: cfg.unitText,
        family: cfg.family,
        weight: cfg.labelWeight,
        maxW: unitMaxW,
        maxH: cfg.unitMaxH,
        maxPx: cfg.unitMaxH
      })
      : 0;
    const unitWidth = cfg.hasUnit
      ? measureWidthPx(cfg.ctx, cfg.unitText, cfg.family, cfg.labelWeight, unitPx)
      : 0;
    const valueMaxW = cfg.hasUnit
      ? Math.max(1, availableW - unitWidth)
      : availableW;
    const valuePx = fitTextPx({
      ctx: cfg.ctx,
      text: cfg.valueText,
      family: cfg.family,
      weight: cfg.valueWeight,
      maxW: valueMaxW,
      maxH: cfg.valueMaxH,
      maxPx: cfg.valueMaxH
    });
    return {
      valuePx: valuePx,
      unitPx: unitPx
    };
  }

  function computeInlineFit(args) {
    const cfg = args || {};
    const segments = [];
    if (cfg.hasCaption) {
      segments.push("caption");
    }
    segments.push("value");
    if (cfg.hasUnit) {
      segments.push("unit");
    }
    const gapCount = Math.max(0, segments.length - 1);
    const totalGap = gapCount * cfg.gapPx;
    const rowW = Math.max(1, cfg.maxW - totalGap);
    const captionMaxW = cfg.hasCaption ? Math.max(1, rowW * 0.32) : 0;
    const unitMaxW = cfg.hasUnit ? Math.max(1, rowW * 0.20) : 0;

    const captionPx = cfg.hasCaption
      ? fitTextPx({
        ctx: cfg.ctx,
        text: cfg.captionText,
        family: cfg.family,
        weight: cfg.labelWeight,
        maxW: captionMaxW,
        maxH: cfg.captionMaxH,
        maxPx: cfg.captionMaxH
      })
      : 0;
    const captionW = cfg.hasCaption
      ? measureWidthPx(cfg.ctx, cfg.captionText, cfg.family, cfg.labelWeight, captionPx)
      : 0;

    const unitPx = cfg.hasUnit
      ? fitTextPx({
        ctx: cfg.ctx,
        text: cfg.unitText,
        family: cfg.family,
        weight: cfg.labelWeight,
        maxW: unitMaxW,
        maxH: cfg.unitMaxH,
        maxPx: cfg.unitMaxH
      })
      : 0;
    const unitW = cfg.hasUnit
      ? measureWidthPx(cfg.ctx, cfg.unitText, cfg.family, cfg.labelWeight, unitPx)
      : 0;

    const valueMaxW = Math.max(1, rowW - captionW - unitW);
    const valuePx = fitTextPx({
      ctx: cfg.ctx,
      text: cfg.valueText,
      family: cfg.family,
      weight: cfg.valueWeight,
      maxW: valueMaxW,
      maxH: cfg.valueMaxH,
      maxPx: cfg.valueMaxH
    });

    return {
      captionPx: captionPx,
      valuePx: valuePx,
      unitPx: unitPx
    };
  }

  function create(def, Helpers) {
    function compute(args) {
      const cfg = args || {};
      const model = cfg.model;
      const hostContext = cfg.hostContext ? cfg.hostContext : null;
      if (!model || typeof model !== "object") {
        return {
          captionStyle: "",
          valueStyle: "",
          unitStyle: "",
          requiredStyle: ""
        };
      }
      const rect = cfg.shellRect || resolveShellRect(hostContext);
      if (!rect) {
        return {
          captionStyle: "",
          valueStyle: "",
          unitStyle: "",
          requiredStyle: ""
        };
      }

      const measureCtx = resolveMeasureContext(hostContext);
      const target = getMeasureTarget(hostContext);
      const family = Helpers.resolveFontFamily(target || undefined);
      const valueWeight = 700;
      const labelWeight = 700;
      const hasCaption = !!model.caption;
      const hasUnit = !!model.unit;
      const hasRequired = model.showRequired === true;
      const gapPx = Math.max(1, Math.round(Math.min(rect.width, rect.height) * 0.015));
      const contentW = Math.max(1, rect.width * 0.92);
      const contentH = Math.max(1, rect.height * 0.9);
      const requiredShare = hasRequired ? 0.22 : 0;
      const mainH = Math.max(1, contentH * (1 - requiredShare));
      const requiredH = hasRequired ? Math.max(1, contentH * requiredShare) : 0;

      let captionPx = 0;
      let valuePx = 0;
      let unitPx = 0;

      if (model.mode === "high") {
        const rowH = mainH / 3;
        captionPx = hasCaption
          ? fitTextPx({
            ctx: measureCtx,
            text: model.caption,
            family: family,
            weight: labelWeight,
            maxW: contentW,
            maxH: rowH * 0.7,
            maxPx: rowH * 0.7
          })
          : 0;
        valuePx = fitTextPx({
          ctx: measureCtx,
          text: model.zoomText,
          family: family,
          weight: valueWeight,
          maxW: contentW,
          maxH: rowH * 0.92,
          maxPx: rowH * 0.92
        });
        unitPx = hasUnit
          ? fitTextPx({
            ctx: measureCtx,
            text: model.unit,
            family: family,
            weight: labelWeight,
            maxW: contentW,
            maxH: rowH * 0.7,
            maxPx: rowH * 0.7
          })
          : 0;
      } else if (model.mode === "normal") {
        const valueRowH = mainH * 0.66;
        const captionRowH = mainH * 0.34;
        const valueUnitFit = computeUnitValueFit({
          ctx: measureCtx,
          family: family,
          valueWeight: valueWeight,
          labelWeight: labelWeight,
          valueText: model.zoomText,
          unitText: model.unit,
          hasUnit: hasUnit,
          gapPx: gapPx,
          maxW: contentW,
          valueMaxH: valueRowH * 0.92,
          unitMaxH: valueRowH * 0.66,
          unitShare: 0.2
        });
        valuePx = valueUnitFit.valuePx;
        unitPx = valueUnitFit.unitPx;
        captionPx = hasCaption
          ? fitTextPx({
            ctx: measureCtx,
            text: model.caption,
            family: family,
            weight: labelWeight,
            maxW: contentW,
            maxH: captionRowH * 0.9,
            maxPx: captionRowH * 0.9
          })
          : 0;
      } else {
        const inlineFit = computeInlineFit({
          ctx: measureCtx,
          family: family,
          valueWeight: valueWeight,
          labelWeight: labelWeight,
          hasCaption: hasCaption,
          hasUnit: hasUnit,
          captionText: model.caption,
          valueText: model.zoomText,
          unitText: model.unit,
          gapPx: gapPx,
          maxW: contentW,
          captionMaxH: mainH * 0.62,
          valueMaxH: mainH * 0.92,
          unitMaxH: mainH * 0.62
        });
        captionPx = inlineFit.captionPx;
        valuePx = inlineFit.valuePx;
        unitPx = inlineFit.unitPx;
      }

      captionPx = capSecondaryPx(captionPx, valuePx, model.captionUnitScale);
      unitPx = capSecondaryPx(unitPx, valuePx, model.captionUnitScale);

      const requiredPx = hasRequired
        ? fitTextPx({
          ctx: measureCtx,
          text: model.requiredText,
          family: family,
          weight: labelWeight,
          maxW: contentW,
          maxH: requiredH * 0.86,
          maxPx: requiredH * 0.86
        })
        : 0;

      return {
        captionStyle: toFontStyle(captionPx),
        valueStyle: toFontStyle(valuePx),
        unitStyle: toFontStyle(unitPx),
        requiredStyle: toFontStyle(requiredPx)
      };
    }

    return {
      id: "MapZoomHtmlFit",
      compute: compute
    };
  }

  return { id: "MapZoomHtmlFit", create: create };
}));
