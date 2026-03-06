/**
 * Module: ActiveRouteTextWidget - Responsive active-route summary with conditional next-course tile
 * Documentation: documentation/widgets/active-route.md
 * Depends: ThemeResolver, TextLayoutEngine, RadialTextLayout, TextTileLayout
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniActiveRouteTextWidget = factory(); }
}(this, function () {
  "use strict";

  const hasOwn = Object.prototype.hasOwnProperty;
  const NAME_PANEL_RATIO_FLAT = 0.38;
  const NAME_BAND_RATIO_HIGH = 0.22;
  const NAME_BAND_RATIO_NORMAL = 0.34;
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

  function createContentRect(W, H, insets) {
    return {
      x: insets.padX,
      y: insets.innerY,
      w: Math.max(1, W - insets.padX * 2),
      h: Math.max(1, H - insets.innerY * 2)
    };
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

  function computeLayout(contentRect, gap, mode, isApproaching) {
    const x = contentRect.x;
    const y = contentRect.y;
    const w = contentRect.w;
    const h = contentRect.h;
    const layout = {
      nameRect: null,
      metricRects: Object.create(null)
    };

    if (mode === "flat") {
      const nameW = Math.max(40, Math.floor(w * NAME_PANEL_RATIO_FLAT));
      const metricsX = x + nameW + gap;
      const metricsW = Math.max(1, w - nameW - gap);
      const columns = isApproaching ? 3 : 2;
      const cellW = Math.max(1, Math.floor((metricsW - gap * (columns - 1)) / columns));
      layout.nameRect = { x: x, y: y, w: nameW, h: h };
      layout.metricRects.remain = { x: metricsX, y: y, w: cellW, h: h };
      layout.metricRects.eta = { x: metricsX + cellW + gap, y: y, w: cellW, h: h };
      if (isApproaching) {
        layout.metricRects.next = { x: metricsX + (cellW + gap) * 2, y: y, w: cellW, h: h };
      }
      return layout;
    }

    const nameRatio = mode === "high" ? NAME_BAND_RATIO_HIGH : NAME_BAND_RATIO_NORMAL;
    const nameH = Math.max(16, Math.floor(h * nameRatio));
    const metricsY = y + nameH + gap;
    const metricsH = Math.max(1, h - nameH - gap);
    layout.nameRect = { x: x, y: y, w: w, h: nameH };

    if (mode === "high") {
      const rows = isApproaching ? 3 : 2;
      const cellH = Math.max(1, Math.floor((metricsH - gap * (rows - 1)) / rows));
      layout.metricRects.remain = { x: x, y: metricsY, w: w, h: cellH };
      layout.metricRects.eta = { x: x, y: metricsY + cellH + gap, w: w, h: cellH };
      if (isApproaching) {
        layout.metricRects.next = { x: x, y: metricsY + (cellH + gap) * 2, w: w, h: cellH };
      }
      return layout;
    }

    if (!isApproaching) {
      const cellW = Math.max(1, Math.floor((w - gap) / 2));
      layout.metricRects.remain = { x: x, y: metricsY, w: cellW, h: metricsH };
      layout.metricRects.eta = { x: x + cellW + gap, y: metricsY, w: cellW, h: metricsH };
      return layout;
    }

    const topH = Math.max(1, Math.floor((metricsH - gap) * 0.52));
    const bottomH = Math.max(1, metricsH - topH - gap);
    const cellW = Math.max(1, Math.floor((w - gap) / 2));
    layout.metricRects.remain = { x: x, y: metricsY, w: cellW, h: topH };
    layout.metricRects.eta = { x: x + cellW + gap, y: metricsY, w: cellW, h: topH };
    layout.metricRects.next = { x: x, y: metricsY + topH + gap, w: w, h: bottomH };
    return layout;
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
    const layout = computeLayout(args.contentRect, args.gap, args.mode, args.parsed.isApproaching);
    const nameFit = args.tileLayout.measureFittedLine({
      textApi: args.radialText,
      ctx: args.ctx,
      text: args.routeNameText,
      maxW: layout.nameRect.w - args.namePadX * 2,
      maxH: layout.nameRect.h,
      maxPx: Math.max(12, Math.floor(layout.nameRect.h * args.nameMaxPxRatio)),
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
        rect: layout.metricRects[metric.id],
        family: args.family,
        valueWeight: args.valueWeight,
        labelWeight: args.labelWeight,
        secScale: METRIC_SEC_SCALE
      });
    }
    return {
      layout: layout,
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
      const insets = text.computeInsets(W, H);
      const contentRect = createContentRect(W, H, insets);
      const gap = Math.max(6, Math.floor(Math.min(contentRect.w, contentRect.h) * 0.04));

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
          mode: modeData.mode,
          contentRect: contentRect,
          gap: gap,
          parsed: parsed,
          metrics: metrics,
          routeNameText: routeNameText,
          namePadX: Math.max(4, Math.floor(contentRect.w * 0.01)),
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
        padX: Math.max(4, Math.floor(contentRect.w * 0.01)),
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
