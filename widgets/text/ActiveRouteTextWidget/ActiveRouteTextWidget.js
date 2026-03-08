/**
 * Module: ActiveRouteTextWidget - Responsive active-route summary with conditional next-course tile
 * Documentation: documentation/widgets/active-route.md
 * Depends: ThemeResolver, TextLayoutEngine, RadialTextLayout, TextTileLayout, ActiveRouteLayout
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniActiveRouteTextWidget = factory(); }
}(this, function () {
  "use strict";

  const hasOwn = Object.prototype.hasOwnProperty;
  const APPROACH_ALPHA = 0.14;
  const ROUTE_NAME_ALPHA = 0.78;
  const ROUTE_NAME_ALPHA_NORMAL = 0.92;
  const METRIC_SEC_SCALE = 0.72;
  const ROUTE_NAME_MAX_PX_RATIO_FLAT = 0.46;
  const ROUTE_NAME_MAX_PX_RATIO_HIGH = 0.54;
  const ROUTE_NAME_MAX_PX_RATIO_NORMAL = 0.66;

  function trimString(value) {
    return (value == null) ? "" : String(value).trim();
  }

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function parseWidgetData(props) {
    const p = props || {};
    const display = (p.display && typeof p.display === "object") ? p.display : null;
    const captions = (p.captions && typeof p.captions === "object") ? p.captions : null;
    const units = (p.units && typeof p.units === "object") ? p.units : null;
    return {
      routeName: trimString(p.routeName),
      remain: toFiniteNumber(display && display.remain),
      eta: display ? display.eta : undefined,
      nextCourse: toFiniteNumber(display && display.nextCourse),
      isApproaching: !!(display && display.isApproaching === true),
      remainCaption: trimString(captions && captions.remain),
      remainUnit: trimString(units && units.remain),
      etaCaption: trimString(captions && captions.eta),
      etaUnit: trimString(units && units.eta),
      nextCourseCaption: trimString(captions && captions.nextCourse),
      nextCourseUnit: trimString(units && units.nextCourse)
    };
  }

  function formatText(rawValue, formatter, formatterParameters, defaultText, Helpers) {
    const out = String(Helpers.applyFormatter(rawValue, {
      formatter: formatter,
      formatterParameters: formatterParameters,
      default: defaultText
    }));
    return out.trim() ? out : defaultText;
  }

  function buildMetricSpecs(parsed, remainText, etaText, nextCourseText) {
    const metrics = [
      {
        id: "remain",
        caption: parsed.remainCaption,
        value: remainText,
        unit: parsed.remainUnit
      },
      {
        id: "eta",
        caption: parsed.etaCaption,
        value: etaText,
        unit: parsed.etaUnit
      }
    ];
    if (parsed.isApproaching) {
      metrics.push({
        id: "next",
        caption: parsed.nextCourseCaption,
        value: nextCourseText,
        unit: parsed.nextCourseUnit
      });
    }
    return metrics;
  }

  function buildModeArgs(W, H, props) {
    const args = {
      W: W,
      H: H,
      captionText: "",
      unitText: ""
    };
    const normal = toFiniteNumber(props && props.ratioThresholdNormal);
    const flat = toFiniteNumber(props && props.ratioThresholdFlat);
    if (typeof normal !== "undefined") {
      args.ratioThresholdNormal = normal;
    }
    if (typeof flat !== "undefined") {
      args.ratioThresholdFlat = flat;
    }
    return args;
  }

  function measureRenderData(args) {
    const nameFit = args.tileLayout.measureFittedLine({
      textApi: args.radialText,
      ctx: args.ctx,
      text: args.routeNameText,
      maxW: Math.max(1, args.layout.nameRect.w - args.layout.namePadX * 2),
      maxH: args.layout.nameRect.h,
      maxPx: Math.max(1, Math.floor(args.layout.nameRect.h * args.nameMaxPxRatio)),
      textFillScale: args.textFillScale,
      family: args.family,
      weight: args.nameWeight
    });
    const metricFits = Object.create(null);
    for (let i = 0; i < args.metrics.length; i++) {
      const metric = args.metrics[i];
      metricFits[metric.id] = args.tileLayout.measureMetricTile({
        textApi: args.radialText,
        ctx: args.ctx,
        metric: metric,
        rect: args.layout.metricRects[metric.id],
        textFillScale: args.textFillScale,
        family: args.family,
        valueWeight: args.valueWeight,
        labelWeight: args.labelWeight,
        secScale: METRIC_SEC_SCALE
      });
    }
    return {
      layout: args.layout,
      nameFit: nameFit,
      metricFits: metricFits
    };
  }

  function applyApproachAccent(ctx, rect, warningColor) {
    if (!(rect && rect.w > 0 && rect.h > 0)) {
      return;
    }
    ctx.save();
    ctx.globalAlpha = APPROACH_ALPHA;
    ctx.fillStyle = warningColor;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }

  function create(def, Helpers) {
    const theme = Helpers.getModule("ThemeResolver").create(def, Helpers);
    const text = Helpers.getModule("TextLayoutEngine").create(def, Helpers);
    const radialText = Helpers.getModule("RadialTextLayout").create(def, Helpers);
    const tileLayout = Helpers.getModule("TextTileLayout").create(def, Helpers);
    const layoutApi = Helpers.getModule("ActiveRouteLayout").create(def, Helpers);
    const fitCache = text.createFitCache(["high", "normal", "flat"]);

    function renderCanvas(canvas, props) {
      const p = props || {};
      const setup = Helpers.setupCanvas(canvas);
      const ctx = setup && setup.ctx;
      const W = setup && setup.W;
      const H = setup && setup.H;
      if (!ctx || !W || !H) {
        return;
      }

      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = "middle";

      const tokens = theme.resolve(canvas);
      const family = Helpers.resolveFontFamily(canvas);
      const color = Helpers.resolveTextColor(canvas);
      const valueWeight = tokens.font.weight;
      const labelWeight = tokens.font.labelWeight;
      const parsed = parseWidgetData(p);
      const defaultText = String(p.default);
      const metricRemain = p.disconnect === true ? undefined : parsed.remain;
      const metricEta = p.disconnect === true ? undefined : parsed.eta;
      const metricNextCourse = p.disconnect === true ? undefined : parsed.nextCourse;
      const remainText = formatText(metricRemain, "formatDistance", [parsed.remainUnit], defaultText, Helpers);
      const etaText = formatText(metricEta, "formatTime", [], defaultText, Helpers);
      const nextCourseText = parsed.isApproaching
        ? formatText(metricNextCourse, "formatDirection", [], defaultText, Helpers)
        : "";
      const metrics = buildMetricSpecs(parsed, remainText, etaText, nextCourseText);
      const routeNameText = parsed.routeName || defaultText;
      const modeData = text.computeModeLayout(buildModeArgs(W, H, p));
      const nameWeight = modeData.mode === "normal" ? valueWeight : labelWeight;
      const nameAlpha = modeData.mode === "normal" ? ROUTE_NAME_ALPHA_NORMAL : ROUTE_NAME_ALPHA;
      const nameMaxPxRatio = modeData.mode === "flat"
        ? ROUTE_NAME_MAX_PX_RATIO_FLAT
        : (modeData.mode === "normal" ? ROUTE_NAME_MAX_PX_RATIO_NORMAL : ROUTE_NAME_MAX_PX_RATIO_HIGH);
      const insets = layoutApi.computeInsets(W, H);
      const contentRect = layoutApi.createContentRect(W, H, insets);
      const layout = layoutApi.computeLayout({
        contentRect: contentRect,
        gap: insets.gap,
        namePadX: insets.namePadX,
        mode: modeData.mode,
        isApproaching: parsed.isApproaching,
        responsive: insets.responsive
      });

      if (parsed.isApproaching) {
        applyApproachAccent(ctx, contentRect, tokens.colors.warning);
      }

      ctx.fillStyle = color;
      const key = text.makeFitCacheKey({
        mode: modeData.mode,
        W: W,
        H: H,
        routeName: routeNameText,
        isApproaching: parsed.isApproaching,
        remain: remainText,
        eta: etaText,
        nextCourse: nextCourseText,
        remainCaption: parsed.remainCaption,
        remainUnit: parsed.remainUnit,
        etaCaption: parsed.etaCaption,
        etaUnit: parsed.etaUnit,
        nextCourseCaption: parsed.nextCourseCaption,
        nextCourseUnit: parsed.nextCourseUnit,
        family: family,
        valueWeight: valueWeight,
        labelWeight: labelWeight
      });
      const renderData = text.resolveFitCache(fitCache, modeData.mode, key, function () {
        return measureRenderData({
          ctx: ctx,
          layout: layout,
          metrics: metrics,
          routeNameText: routeNameText,
          textFillScale: layout.responsive.textFillScale,
          nameWeight: nameWeight,
          nameMaxPxRatio: nameMaxPxRatio,
          family: family,
          valueWeight: valueWeight,
          labelWeight: labelWeight,
          radialText: radialText,
          tileLayout: tileLayout
        });
      });

      tileLayout.drawFittedLine({
        textApi: radialText,
        ctx: ctx,
        fit: renderData.nameFit,
        rect: renderData.layout.nameRect,
        align: "left",
        padX: renderData.layout.namePadX,
        family: family,
        weight: nameWeight,
        color: color,
        alpha: nameAlpha
      });

      for (let i = 0; i < metrics.length; i++) {
        const metric = metrics[i];
        tileLayout.drawMetricTile({
          textApi: radialText,
          ctx: ctx,
          metric: metric,
          rect: renderData.layout.metricRects[metric.id],
          measurement: renderData.metricFits[metric.id],
          family: family,
          color: color,
          align: "center",
          valueWeight: valueWeight,
          labelWeight: labelWeight,
          secScale: METRIC_SEC_SCALE
        });
      }

      if (p.disconnect) {
        text.drawDisconnectOverlay({
          ctx: ctx,
          W: W,
          H: H,
          family: family,
          color: color,
          labelWeight: labelWeight
        });
      }
    }

    function translateFunction() {
      return {};
    }

    return {
      id: "ActiveRouteTextWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "ActiveRouteTextWidget", create: create };
}));
