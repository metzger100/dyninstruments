/**
 * Module: RoutePointsHtmlFit - Per-cell text-fit owner for route-points HTML renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ThemeResolver, RadialTextLayout, TextTileLayout, RoutePointsLayout, HtmlWidgetUtils
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsHtmlFit = factory(); }
}(this, function () {
  "use strict";

  const MEASURE_CTX_KEY = "__dyniRoutePointsTextMeasureCtx";
  const EMPTY_MAX_PX_RATIO = {
    flat: 0.5,
    normal: 0.66,
    high: 0.56
  };

  function createMeasureContext() {
    return {
      font: "700 12px sans-serif",
      approxFontPx: 12,
      measureText: function (text) {
        const source = String(this.font || "");
        const match = source.match(/(\d+(?:\.\d+)?)px/);
        const parsed = match ? Number(match[1]) : this.approxFontPx;
        const resolvedPx = Number.isFinite(parsed) ? parsed : this.approxFontPx;
        this.approxFontPx = Math.max(1, resolvedPx);
        return { width: String(text).length * this.approxFontPx * 0.56 };
      }
    };
  }

  function resolveMeasureContext(hostContext, targetEl) {
    const ctx = hostContext && typeof hostContext === "object" ? hostContext : null;
    if (ctx && ctx[MEASURE_CTX_KEY]) {
      return ctx[MEASURE_CTX_KEY];
    }
    const ownerDocument = targetEl && targetEl.ownerDocument
      ? targetEl.ownerDocument
      : (typeof document !== "undefined" ? document : null);
    let measured = null;
    if (ownerDocument && typeof ownerDocument.createElement === "function") {
      const probeCanvas = ownerDocument.createElement("canvas");
      const hasContextApi = probeCanvas && typeof probeCanvas.getContext === "function";
      measured = hasContextApi ? probeCanvas.getContext("2d") : null;
    }
    const readyContext = measured || createMeasureContext();
    if (ctx) {
      ctx[MEASURE_CTX_KEY] = readyContext;
    }
    return readyContext;
  }

  function toText(value) {
    return value == null ? "" : String(value);
  }

  function toStyle(px, htmlUtils) {
    const n = htmlUtils.toFiniteNumber(px);
    if (!(n > 0)) {
      return "";
    }
    return "font-size:" + Math.max(1, Math.floor(n)) + "px;";
  }

  function toPointCount(model, htmlUtils) {
    if (Array.isArray(model.points)) {
      return model.points.length;
    }
    const count = htmlUtils.toFiniteNumber(model.pointCount);
    if (!(count > 0)) {
      return 0;
    }
    return Math.floor(count);
  }

  function toHeaderTexts(model, pointCount) {
    const routeName = toText(model.routeNameText != null ? model.routeNameText : model.routeName);
    let metaText = toText(model.metaText);
    if (!metaText) {
      const waypointsText = toText(model.waypointsText);
      metaText = waypointsText ? (String(pointCount) + " " + waypointsText) : String(pointCount);
    }
    return {
      routeNameText: routeName,
      metaText: metaText
    };
  }

  function toRowTexts(points, index) {
    const source = Array.isArray(points) ? points[index] : null;
    const point = source && typeof source === "object" ? source : {};
    return {
      ordinalText: toText(point.ordinalText != null ? point.ordinalText : (index + 1)),
      nameText: toText(point.nameText != null ? point.nameText : point.name),
      infoText: toText(point.infoText != null ? point.infoText : point.info)
    };
  }

  function resolveEnvironment(args) {
    const cfg = args || {};
    const Helpers = cfg.Helpers;
    const theme = cfg.theme;
    const targetEl = cfg.targetEl;
    const hostContext = cfg.hostContext;
    const rootCandidate = Helpers.resolveWidgetRoot(targetEl);
    const themeRoot = rootCandidate || targetEl;
    const tokenSet = theme.resolveForRoot(themeRoot);
    const measureCtx = resolveMeasureContext(hostContext, targetEl);
    if (!measureCtx || typeof measureCtx.measureText !== "function") {
      return null;
    }
    return {
      measureCtx: measureCtx,
      family: Helpers.resolveFontFamily(targetEl),
      valueWeight: tokenSet.font.weight,
      labelWeight: tokenSet.font.labelWeight
    };
  }

  function resolveEmptyMaxPxRatio(mode) {
    if (mode === "flat") {
      return EMPTY_MAX_PX_RATIO.flat;
    }
    if (mode === "high") {
      return EMPTY_MAX_PX_RATIO.high;
    }
    return EMPTY_MAX_PX_RATIO.normal;
  }

  function create(def, Helpers) {
    const theme = Helpers.getModule("ThemeResolver");
    const radialText = Helpers.getModule("RadialTextLayout").create(def, Helpers);
    const tileLayout = Helpers.getModule("TextTileLayout").create(def, Helpers);
    const layoutApi = Helpers.getModule("RoutePointsLayout").create(def, Helpers);
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);

    function measureStyle(args) {
      const cfg = args || {};
      const rect = cfg.rect;
      if (!rect || !(rect.w > 0) || !(rect.h > 0)) {
        return "";
      }
      const ratio = htmlUtils.toFiniteNumber(cfg.maxPxRatio);
      const maxPx = ratio > 0
        ? Math.max(1, Math.floor(rect.h * ratio))
        : Math.max(1, Math.floor(rect.h));
      const fit = tileLayout.measureFittedLine({
        textApi: radialText,
        ctx: cfg.ctx,
        text: cfg.text,
        maxW: Math.max(1, Math.floor(rect.w)),
        maxH: Math.max(1, Math.floor(rect.h)),
        maxPx: maxPx,
        textFillScale: cfg.textFillScale,
        family: cfg.family,
        weight: cfg.weight
      });
      return toStyle(fit && fit.px, htmlUtils);
    }

    function compute(args) {
      const cfg = args || {};
      const model = cfg.model || null;
      const shellRect = cfg.shellRect || null;
      const targetEl = cfg.targetEl || null;
      const hostContext = cfg.hostContext || null;
      if (!model || !shellRect || !targetEl) {
        return null;
      }

      const env = resolveEnvironment({
        Helpers: Helpers,
        theme: theme,
        hostContext: hostContext,
        targetEl: targetEl
      });
      if (!env) {
        return null;
      }

      const W = Math.max(1, Math.round(shellRect.width));
      const layoutShellHeight = htmlUtils.toFiniteNumber(model.layoutShellHeight);
      const H = Math.max(1, Math.round(
        (typeof layoutShellHeight === "number" && layoutShellHeight > 0)
          ? layoutShellHeight
          : shellRect.height
      ));
      const pointCount = toPointCount(model, htmlUtils);
      const insets = layoutApi.computeInsets(W, H);
      const contentRect = layoutApi.createContentRect(W, H, insets);
      const layout = layoutApi.computeLayout({
        contentRect: contentRect,
        mode: model.mode,
        ratioThresholdNormal: model.ratioThresholdNormal,
        ratioThresholdFlat: model.ratioThresholdFlat,
        isVerticalContainer: model.isVerticalContainer === true,
        verticalAnchorWidth: W,
        showHeader: model.showHeader,
        pointCount: pointCount,
        responsive: insets.responsive,
        trailingGutterPx: model.scrollbarGutterPx
      });
      const headerTexts = toHeaderTexts(model, pointCount);
      const textFillScale = layout.responsive && layout.responsive.textFillScale;

      let headerFit = null;
      if (layout.showHeader && layout.headerLayout) {
        headerFit = {
          routeNameStyle: measureStyle({
            rect: layout.headerLayout.routeNameRect,
            ctx: env.measureCtx,
            text: headerTexts.routeNameText,
            textFillScale: textFillScale,
            family: env.family,
            weight: env.valueWeight
          }),
          metaStyle: measureStyle({
            rect: layout.headerLayout.metaRect,
            ctx: env.measureCtx,
            text: headerTexts.metaText,
            textFillScale: textFillScale,
            family: env.family,
            weight: env.labelWeight
          })
        };
      }

      const rowFits = [];
      for (let i = 0; i < layout.rows.length; i += 1) {
        const row = layout.rows[i];
        const rowTexts = toRowTexts(model.points, i);
        rowFits.push({
          ordinalStyle: measureStyle({
            rect: row.ordinalRect,
            ctx: env.measureCtx,
            text: rowTexts.ordinalText,
            textFillScale: textFillScale,
            family: env.family,
            weight: env.labelWeight
          }),
          nameStyle: measureStyle({
            rect: row.nameRect,
            ctx: env.measureCtx,
            text: rowTexts.nameText,
            textFillScale: textFillScale,
            family: env.family,
            weight: env.valueWeight
          }),
          infoStyle: measureStyle({
            rect: row.infoRect,
            ctx: env.measureCtx,
            text: rowTexts.infoText,
            textFillScale: textFillScale,
            family: env.family,
            weight: env.labelWeight
          })
        });
      }

      let emptyStyle = "";
      if (model.hasRoute !== true) {
        emptyStyle = measureStyle({
          rect: contentRect,
          ctx: env.measureCtx,
          text: toText(model.emptyText || model.routeNameText || "No Route"),
          textFillScale: textFillScale,
          family: env.family,
          weight: env.valueWeight,
          maxPxRatio: resolveEmptyMaxPxRatio(model.mode)
        });
      }

      return {
        headerFit: headerFit,
        rowFits: rowFits,
        emptyStyle: emptyStyle
      };
    }

    return {
      id: "RoutePointsHtmlFit",
      compute: compute
    };
  }

  return { id: "RoutePointsHtmlFit", create: create };
}));
