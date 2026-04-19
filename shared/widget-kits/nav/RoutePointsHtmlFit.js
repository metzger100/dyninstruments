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
        const px = Number.isFinite(parsed) ? parsed : this.approxFontPx;
        this.approxFontPx = Math.max(1, px);
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
    const probeCanvas = ownerDocument && typeof ownerDocument.createElement === "function"
      ? ownerDocument.createElement("canvas")
      : null;
    const measured = probeCanvas && typeof probeCanvas.getContext === "function"
      ? probeCanvas.getContext("2d")
      : null;
    const readyContext = measured || createMeasureContext();
    if (ctx) {
      ctx[MEASURE_CTX_KEY] = readyContext;
    }
    return readyContext;
  }

  function toText(value) {
    return value == null ? "" : String(value);
  }

  function formatLatLonInfo(point, defaultText, Helpers, placeholderNormalize) {
    const text = String(Helpers.applyFormatter({ lat: point.lat, lon: point.lon }, {
      formatter: "formatLonLats",
      formatterParameters: [],
      default: defaultText
    }));
    return placeholderNormalize.normalize(text, defaultText);
  }

  function formatCourseDistanceInfo(args, stableDigitsEnabled, stableDigits) {
    const cfg = args || {};
    const placeholder = cfg.placeholderValue + cfg.courseUnit + "/" + cfg.placeholderValue + cfg.distanceUnit;
    const previousPoint = cfg.previousPoint;
    const currentPoint = cfg.currentPoint;
    const courseUnit = cfg.courseUnit;
    const distanceUnit = cfg.distanceUnit;
    if (!previousPoint || !currentPoint) {
      return { valueText: placeholder, fallbackValueText: placeholder };
    }

    const leg = cfg.centerMath.computeCourseDistance(previousPoint, currentPoint, cfg.useRhumbLine === true);
    if (!leg) {
      return { valueText: placeholder, fallbackValueText: placeholder };
    }

    const courseTextRaw = String(cfg.Helpers.applyFormatter(leg.course, {
      formatter: "formatDirection",
      formatterParameters: [],
      default: cfg.defaultText
    }));
    const distanceTextRaw = String(cfg.Helpers.applyFormatter(leg.distance, {
      formatter: "formatDistance",
      formatterParameters: [distanceUnit],
      default: cfg.defaultText
    }));
    const courseText = cfg.placeholderNormalize.normalize(courseTextRaw, cfg.defaultText);
    const distanceText = cfg.placeholderNormalize.normalize(distanceTextRaw, cfg.defaultText);
    const courseStable = stableDigitsEnabled === true
      ? stableDigits.normalize(courseText, {
        integerWidth: stableDigits.resolveIntegerWidth(courseText, 3),
        reserveSignSlot: false
      })
      : { padded: courseText, fallback: courseText };
    const distanceStable = stableDigitsEnabled === true
      ? stableDigits.normalize(distanceText, {
        integerWidth: stableDigits.resolveIntegerWidth(distanceText, 2),
        reserveSignSlot: false
      })
      : { padded: distanceText, fallback: distanceText };

    return {
      valueText: courseStable.padded + courseUnit + "/" + distanceStable.padded + distanceUnit,
      fallbackValueText: courseStable.fallback + courseUnit + "/" + distanceStable.fallback + distanceUnit
    };
  }

  function buildRowInfoText(args) {
    const cfg = args || {};
    const placeholder = cfg.placeholderValue + cfg.courseUnit + "/" + cfg.placeholderValue + cfg.distanceUnit;
    if (cfg.showLatLon === true) {
      const text = formatLatLonInfo(cfg.currentPoint, cfg.defaultText, cfg.Helpers, cfg.placeholderNormalize);
      return { valueText: text, fallbackValueText: text };
    }
    if (cfg.index <= 0 || !cfg.previousValid || !cfg.currentValid) {
      return { valueText: placeholder, fallbackValueText: placeholder };
    }
    return formatCourseDistanceInfo(cfg, cfg.stableDigitsEnabled, cfg.stableDigits);
  }

  function measurePx(args, htmlUtils, tileLayout) {
    const cfg = args || {};
    const rect = cfg.rect;
    if (!rect || !(rect.w > 0) || !(rect.h > 0) || !cfg.text) {
      return 0;
    }
    const maxPxRatio = htmlUtils.toFiniteNumber(cfg.maxPxRatio);
    const maxPx = maxPxRatio > 0
      ? Math.max(1, Math.floor(rect.h * maxPxRatio))
      : Math.max(1, Math.floor(rect.h));
    const fit = tileLayout.measureFittedLine({
      textApi: cfg.textApi,
      ctx: cfg.ctx,
      text: cfg.text,
      maxW: Math.max(1, Math.floor(rect.w)),
      maxH: Math.max(1, Math.floor(rect.h)),
      maxPx: maxPx,
      textFillScale: cfg.textFillScale,
      family: cfg.family,
      weight: cfg.weight
    });
    if (!fit) {
      return null;
    }
    cfg.textApi.setFont(cfg.ctx, fit.px, cfg.weight, cfg.family);
    return {
      px: fit.px,
      text: fit.text,
      width: cfg.ctx.measureText(toText(cfg.text)).width
    };
  }

  function selectInfoText(args, htmlUtils, tileLayout) {
    const cfg = args || {};
    const valueText = toText(cfg.valueText);
    const fallbackText = cfg.fallbackText == null ? valueText : toText(cfg.fallbackText);
    const valueFit = measurePx({
      rect: cfg.rect,
      text: valueText,
      maxPxRatio: cfg.maxPxRatio,
      textApi: cfg.textApi,
      ctx: cfg.ctx,
      textFillScale: cfg.textFillScale,
      family: cfg.family,
      weight: cfg.weight
    }, htmlUtils, tileLayout);
    if (!valueFit || !fallbackText || fallbackText === valueText || valueFit.width <= Math.max(1, Math.floor(cfg.rect.w)) + 0.01) {
      return { text: valueText, px: valueFit && valueFit.px ? valueFit.px : 0 };
    }
    const fallbackFit = measurePx({
      rect: cfg.rect,
      text: fallbackText,
      maxPxRatio: cfg.maxPxRatio,
      textApi: cfg.textApi,
      ctx: cfg.ctx,
      textFillScale: cfg.textFillScale,
      family: cfg.family,
      weight: cfg.weight
    }, htmlUtils, tileLayout);
    return { text: fallbackText, px: fallbackFit && fallbackFit.px ? fallbackFit.px : 0 };
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
      routeNameText: routeName, metaText: metaText
    };
  }

  function toRowTexts(points, index) {
    const source = Array.isArray(points) ? points[index] : null;
    const point = source && typeof source === "object" ? source : {};
    return {
      ordinalText: toText(point.ordinalText != null ? point.ordinalText : (index + 1)),
      nameText: toText(point.nameText != null ? point.nameText : point.name),
      infoText: toText(point.infoText != null ? point.infoText : point.info),
      infoFallbackText: toText(point.infoFallbackText != null ? point.infoFallbackText : (point.infoText != null ? point.infoText : point.info))
    };
  }

  function resolveEnvironment(args) {
    const cfg = args || {};
    const Helpers = cfg.Helpers;
    const theme = cfg.theme;
    const targetEl = cfg.targetEl;
    const hostContext = cfg.hostContext;
    const tokenSet = theme.resolveForRoot(Helpers.requirePluginRoot(targetEl));
    const measureCtx = resolveMeasureContext(hostContext, targetEl);
    if (!measureCtx || typeof measureCtx.measureText !== "function") {
      return null;
    }
    return {
      measureCtx: measureCtx,
      family: tokenSet.font.family,
      monoFamily: tokenSet.font.familyMono || tokenSet.font.family,
      valueWeight: tokenSet.font.weight,
      labelWeight: tokenSet.font.labelWeight
    };
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
      const maxPx = ratio > 0 ? Math.max(1, Math.floor(rect.h * ratio)) : Math.max(1, Math.floor(rect.h));
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
      return fit && fit.px > 0
        ? "font-size:" + Math.max(1, Math.floor(htmlUtils.toFiniteNumber(fit.px))) + "px;"
        : "";
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
      const infoFamily = model.stableDigitsEnabled === true && model.showLatLon !== true ? env.monoFamily : env.family;

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
        const infoTextFit = model.showLatLon === true
          ? {
            text: rowTexts.infoText,
            px: measurePx({
              rect: row.infoRect,
              text: rowTexts.infoText,
              textApi: radialText,
              ctx: env.measureCtx,
              textFillScale: textFillScale,
              family: infoFamily,
              weight: env.labelWeight
            }, htmlUtils, tileLayout)
          }
          : selectInfoText({
            rect: row.infoRect,
            valueText: rowTexts.infoText,
            fallbackText: rowTexts.infoFallbackText,
            textApi: radialText,
            ctx: env.measureCtx,
            textFillScale: textFillScale,
            family: infoFamily,
            weight: env.labelWeight
          }, htmlUtils, tileLayout);
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
            text: infoTextFit.text,
            textFillScale: textFillScale,
            family: infoFamily,
            weight: env.labelWeight
          }),
          infoText: infoTextFit.text
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
          maxPxRatio: model.mode === "flat"
            ? EMPTY_MAX_PX_RATIO.flat
            : (model.mode === "high" ? EMPTY_MAX_PX_RATIO.high : EMPTY_MAX_PX_RATIO.normal)
        });
      }

      return { headerFit: headerFit, rowFits: rowFits, emptyStyle: emptyStyle };
    }

    return {
      id: "RoutePointsHtmlFit",
      compute: compute
    };
  }

  create.buildRowInfoText = buildRowInfoText;

  return { id: "RoutePointsHtmlFit", create: create };
}));
