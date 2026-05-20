/**
 * Module: RoutePointsHtmlFit - Per-cell text-fit owner for route-points HTML renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: componentContext.theme.tokens, CanvasTextLayout, TextTileLayout, RoutePointsLayout, HtmlWidgetUtils, HtmlMeasureUtils, RoutePointsInfoText, ValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsHtmlFit = factory(); }
}(this, function () {
  "use strict";

  const EMPTY_MAX_PX_RATIO = {
    flat: 0.5,
    normal: 0.66,
    high: 0.56
  };
  let toText;

  function selectInfoText(args, htmlUtils, htmlMeasureUtils, tileLayout) {
    const cfg = args || {};
    const valueText = toText(cfg.valueText);
    const plainText = cfg.plainText == null ? valueText : toText(cfg.plainText);
    const valueFit = htmlMeasureUtils.measurePx({
      rect: cfg.rect,
      text: valueText,
      maxPxRatio: cfg.maxPxRatio,
      textApi: cfg.textApi,
      ctx: cfg.ctx,
      textFillScale: cfg.textFillScale,
      family: cfg.family,
      weight: cfg.weight
    }, htmlUtils, tileLayout);
    if (!valueFit || !plainText || plainText === valueText || valueFit.width <= Math.max(1, Math.floor(cfg.rect.w)) + 0.01) {
      return { text: valueText, px: valueFit && valueFit.px ? valueFit.px : 0 };
    }
    const plainFit = htmlMeasureUtils.measurePx({
      rect: cfg.rect,
      text: plainText,
      maxPxRatio: cfg.maxPxRatio,
      textApi: cfg.textApi,
      ctx: cfg.ctx,
      textFillScale: cfg.textFillScale,
      family: cfg.family,
      weight: cfg.weight
    }, htmlUtils, tileLayout);
    return { text: plainText, px: plainFit && plainFit.px ? plainFit.px : 0 };
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
      infoPlainText: toText(point.infoPlainText != null ? point.infoPlainText : (point.infoText != null ? point.infoText : point.info))
    };
  }

  function resolveEnvironment(args) {
    const cfg = args || {};
    const componentContext = cfg.componentContext;
    const theme = cfg.theme;
    const targetEl = cfg.targetEl;
    const hostContext = cfg.hostContext;
    const tokenSet = theme.resolveForRoot(componentContext.dom.requirePluginRoot(targetEl));
    const measureCtx = cfg.htmlMeasureUtils.resolveMeasureContext(hostContext, targetEl);
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

  function create(def, componentContext) {
    const theme = componentContext.theme.tokens;
    const radialText = componentContext.components.require("CanvasTextLayout");
    const tileLayout = componentContext.components.require("TextTileLayout");
    const layoutApi = componentContext.components.require("RoutePointsLayout");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const htmlMeasureUtils = componentContext.components.require("HtmlMeasureUtils");
    const routePointsInfoText = componentContext.components.require("RoutePointsInfoText");
    toText = componentContext.components.require("ValueMath").toText;

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
        componentContext: componentContext,
        theme: theme,
        hostContext: hostContext,
        targetEl: targetEl,
        htmlMeasureUtils: htmlMeasureUtils
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
          routeNameStyle: htmlMeasureUtils.measureStyle({
            rect: layout.headerLayout.routeNameRect,
            textApi: radialText,
            ctx: env.measureCtx,
            text: headerTexts.routeNameText,
            textFillScale: textFillScale,
            family: env.family,
            weight: env.valueWeight
          }, htmlUtils, tileLayout),
          metaStyle: htmlMeasureUtils.measureStyle({
            rect: layout.headerLayout.metaRect,
            textApi: radialText,
            ctx: env.measureCtx,
            text: headerTexts.metaText,
            textFillScale: textFillScale,
            family: env.family,
            weight: env.labelWeight
          }, htmlUtils, tileLayout)
        };
      }

      const rowFits = [];
      for (let i = 0; i < layout.rows.length; i += 1) {
        const row = layout.rows[i];
        const rowTexts = toRowTexts(model.points, i);
        const infoTextFit = model.showLatLon === true
          ? {
            text: rowTexts.infoText,
            px: (htmlMeasureUtils.measurePx({
              rect: row.infoRect,
              text: rowTexts.infoText,
              textApi: radialText,
              ctx: env.measureCtx,
              textFillScale: textFillScale,
              family: infoFamily,
              weight: env.labelWeight
            }, htmlUtils, tileLayout) || {}).px || 0
          }
          : selectInfoText({
            rect: row.infoRect,
            valueText: rowTexts.infoText,
            plainText: rowTexts.infoPlainText,
            textApi: radialText,
            ctx: env.measureCtx,
            textFillScale: textFillScale,
            family: infoFamily,
            weight: env.labelWeight
          }, htmlUtils, htmlMeasureUtils, tileLayout);
        rowFits.push({
          ordinalStyle: htmlMeasureUtils.measureStyle({
            rect: row.ordinalRect,
            textApi: radialText,
            ctx: env.measureCtx,
            text: rowTexts.ordinalText,
            textFillScale: textFillScale,
            family: env.family,
            weight: env.labelWeight
          }, htmlUtils, tileLayout),
          nameStyle: htmlMeasureUtils.measureStyle({
            rect: row.nameRect,
            textApi: radialText,
            ctx: env.measureCtx,
            text: rowTexts.nameText,
            textFillScale: textFillScale,
            family: env.family,
            weight: env.valueWeight
          }, htmlUtils, tileLayout),
          infoStyle: htmlMeasureUtils.measureStyle({
            rect: row.infoRect,
            textApi: radialText,
            ctx: env.measureCtx,
            text: infoTextFit.text,
            textFillScale: textFillScale,
            family: infoFamily,
            weight: env.labelWeight
          }, htmlUtils, tileLayout),
          infoText: infoTextFit.text
        });
      }

      let emptyStyle = "";
      if (model.hasRoute !== true) {
        emptyStyle = htmlMeasureUtils.measureStyle({
          rect: contentRect,
          textApi: radialText,
          ctx: env.measureCtx,
          text: toText(model.emptyText || model.routeNameText || "No Route"),
          textFillScale: textFillScale,
          family: env.family,
          weight: env.valueWeight,
          maxPxRatio: model.mode === "flat"
            ? EMPTY_MAX_PX_RATIO.flat
            : (model.mode === "high" ? EMPTY_MAX_PX_RATIO.high : EMPTY_MAX_PX_RATIO.normal)
        }, htmlUtils, tileLayout);
      }

      return { headerFit: headerFit, rowFits: rowFits, emptyStyle: emptyStyle };
    }

    const spec = {
      id: "RoutePointsHtmlFit",
      compute: compute
    };
    spec.buildRowInfoText = routePointsInfoText.buildRowInfoText;
    return spec;
  }

  return { id: "RoutePointsHtmlFit", create: create };
}));
