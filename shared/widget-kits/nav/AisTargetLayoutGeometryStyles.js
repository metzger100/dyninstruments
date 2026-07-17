/**
 * @file AisTargetLayoutGeometryStyles - CSS grid serialization for AIS target layout geometry
 * Documentation: documentation/widgets/ais-target.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniAisTargetLayoutGeometryStyles = factory();
  }
}(this, function () {
  "use strict";

  /** @type {DyniHtmlWidgetUtilsApi["toPx"]} */
  let toPx;

  /** @param {unknown} value @returns {string} */
  function toTrackPx(value) {
    return "minmax(0," + toPx(value) + ")";
  }

  /** @param {unknown} top @param {unknown} right @param {unknown} bottom @param {unknown} left @returns {string} */
  function toPaddingStyle(top, right, bottom, left) {
    return "padding:" + toPx(top) + " " + toPx(right) + " " + toPx(bottom) + " " + toPx(left) + ";";
  }

  /** @param {unknown[]} values @returns {string} */
  function joinTrackSizes(values) {
    if (!values.length) {
      return toTrackPx(1);
    }
    return values.map(toTrackPx).join(" ");
  }

  /** @param {DyniRect | null | undefined} a @param {DyniRect | null | undefined} b @param {"x" | "y"} axis @returns {number} */
  function resolveRectGap(a, b, axis) {
    if (!a || !b) {
      return 0;
    }
    if (axis === "x") {
      return Math.max(0, b.x - (a.x + a.w));
    }
    return Math.max(0, b.y - (a.y + a.h));
  }

  /** @param {DyniAisTargetGeometryLayout | undefined} layout @returns {DyniAisTargetWrapperPaddings} */
  function resolveWrapperPaddings(layout) {
    const l = layout || {};
    const content = l.contentRect;
    if (!content) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }
    const shellW = Math.max(1, Math.floor(Number(l.shellWidth) || 1));
    const shellH = Math.max(1, Math.floor(Number(l.effectiveLayoutHeight) || 1));
    return {
      top: Math.max(0, content.y),
      left: Math.max(0, content.x),
      right: Math.max(0, shellW - content.x - content.w),
      bottom: Math.max(0, shellH - content.y - content.h)
    };
  }

  /** @param {DyniAisTargetGeometryLayout | undefined} layout @returns {string} */
  function buildWrapperStyle(layout) {
    const l = layout || {};
    const paddings = resolveWrapperPaddings(l);
    let style = toPaddingStyle(paddings.top, paddings.right, paddings.bottom, paddings.left);
    if (l.renderState !== "data" || !l.identityRect || !l.metricsRect) {
      return style;
    }

    if (l.mode === "flat") {
      style += "grid-template-areas:\"identity metrics\";";
      style += "grid-template-columns:" + joinTrackSizes([l.identityRect.w, l.metricsRect.w]) + ";";
      style += "grid-template-rows:" + joinTrackSizes([l.contentRect ? l.contentRect.h : 1]) + ";";
      style += "column-gap:" + toPx(resolveRectGap(l.identityRect, l.metricsRect, "x")) + ";";
      style += "row-gap:0px;";
      return style;
    }

    style += "grid-template-areas:\"identity\" \"metrics\";";
    style += "grid-template-columns:" + joinTrackSizes([l.contentRect ? l.contentRect.w : 1]) + ";";
    style += "grid-template-rows:" + joinTrackSizes([l.identityRect.h, l.metricsRect.h]) + ";";
    style += "row-gap:" + toPx(resolveRectGap(l.identityRect, l.metricsRect, "y")) + ";";
    style += "column-gap:0px;";
    return style;
  }

  /** @param {DyniAisTargetGeometryLayout | undefined} layout @returns {string} */
  function buildIdentityStyle(layout) {
    const l = layout || {};
    if (!l.identityRect || !l.nameRect || !l.frontRect) {
      return "";
    }
    return ""
      + "grid-template-rows:" + joinTrackSizes([l.nameRect.h, l.frontRect.h]) + ";"
      + "row-gap:" + toPx(resolveRectGap(l.nameRect, l.frontRect, "y")) + ";";
  }

  /** @param {DyniAisTargetGeometryLayout | undefined} layout @returns {string} */
  function buildMetricsStyle(layout) {
    const l = layout || {};
    const boxes = l.metricBoxes || {};
    const dst = boxes.dst;
    const cpa = boxes.cpa;
    const tcpa = boxes.tcpa;
    const brg = boxes.brg;
    if (!dst || !cpa || !tcpa || !brg) {
      return "";
    }

    if (l.mode === "flat") {
      return ""
        + "grid-template-columns:" + joinTrackSizes([dst.w, cpa.w, tcpa.w, brg.w]) + ";"
        + "grid-template-rows:" + joinTrackSizes([dst.h]) + ";"
        + "column-gap:" + toPx(resolveRectGap(dst, cpa, "x")) + ";"
        + "row-gap:0px;";
    }

    if (l.mode === "normal") {
      return ""
        + "grid-template-columns:" + joinTrackSizes([dst.w, cpa.w]) + ";"
        + "grid-template-rows:" + joinTrackSizes([dst.h, tcpa.h]) + ";"
        + "column-gap:" + toPx(resolveRectGap(dst, cpa, "x")) + ";"
        + "row-gap:" + toPx(resolveRectGap(dst, tcpa, "y")) + ";";
    }

    return ""
      + "grid-template-columns:" + joinTrackSizes([dst.w]) + ";"
      + "grid-template-rows:" + joinTrackSizes([dst.h, cpa.h, tcpa.h, brg.h]) + ";"
      + "row-gap:" + toPx(resolveRectGap(dst, cpa, "y")) + ";"
      + "column-gap:0px;";
  }

  /** @param {DyniAisTargetMetricBox | null | undefined} box @returns {string} */
  function buildStackedMetricStyle(box) {
    const tile = box || null;
    if (!tile || !tile.captionRect || !tile.valueRect || !tile.unitRect) {
      return "";
    }
    const left = Math.max(0, tile.captionRect.x - tile.x);
    const right = Math.max(0, tile.x + tile.w - tile.captionRect.x - tile.captionRect.w);
    const top = Math.max(0, tile.captionRect.y - tile.y);
    const bottom = Math.max(0, tile.y + tile.h - tile.unitRect.y - tile.unitRect.h);
    const rowGap = Math.max(0, tile.valueRect.y - tile.captionRect.y - tile.captionRect.h);
    return ""
      + toPaddingStyle(top, right, bottom, left)
      + "grid-template-columns:" + joinTrackSizes([tile.captionRect.w]) + ";"
      + "grid-template-rows:" + joinTrackSizes([tile.captionRect.h, tile.valueRect.h, tile.unitRect.h]) + ";"
      + "row-gap:" + toPx(rowGap) + ";"
      + "column-gap:0px;";
  }

  /** @param {DyniAisTargetMetricBox | null | undefined} box @returns {string} */
  function buildInlineMetricStyle(box) {
    const tile = box || null;
    if (!tile || !tile.labelRect || !tile.valueRect || !tile.unitRect) {
      return "";
    }
    const left = Math.max(0, tile.labelRect.x - tile.x);
    const right = Math.max(0, tile.x + tile.w - tile.valueRect.x - tile.valueRect.w);
    const top = Math.max(0, tile.labelRect.y - tile.y);
    const bottom = Math.max(0, tile.y + tile.h - tile.labelRect.y - tile.labelRect.h);
    const colGap = Math.max(0, tile.valueRect.x - tile.labelRect.x - tile.labelRect.w);
    return ""
      + toPaddingStyle(top, right, bottom, left)
      + "grid-template-columns:" + joinTrackSizes([tile.labelRect.w, tile.valueRect.w]) + ";"
      + "grid-template-rows:" + joinTrackSizes([tile.labelRect.h]) + ";"
      + "column-gap:" + toPx(colGap) + ";"
      + "row-gap:0px;";
  }

  /** @param {DyniAisTargetMetricBox | null | undefined} box @returns {string} */
  function buildInlineValueRowStyle(box) {
    const tile = box || null;
    if (!tile || !tile.valueTextRect || !tile.unitRect) {
      return "";
    }
    const colGap = Math.max(0, tile.unitRect.x - tile.valueTextRect.x - tile.valueTextRect.w);
    return ""
      + "grid-template-columns:" + joinTrackSizes([tile.valueTextRect.w, tile.unitRect.w]) + ";"
      + "column-gap:" + toPx(colGap) + ";";
  }

  /** @param {DyniAisTargetGeometryLayout | undefined} layout @returns {Record<string, DyniAisTargetMetricGeometry>} */
  function buildMetricStyles(layout) {
    const l = layout || {};
    const ids = l.metricOrder || [];
    const boxes = l.metricBoxes || {};
    const out = Object.create(null);
    for (let i = 0; i < ids.length; i += 1) {
      const id = ids[i];
      const box = boxes[id];
      if (!box) {
        continue;
      }
      out[id] = {
        metricStyle: l.mode === "flat"
          ? buildStackedMetricStyle(box)
          : buildInlineMetricStyle(box),
        valueRowStyle: l.mode === "flat" ? "" : buildInlineValueRowStyle(box)
      };
    }
    return out;
  }

  /** @param {DyniAisTargetGeometryLayout | undefined} layout @returns {string} */
  function buildAccentStyle(layout) {
    const l = layout || {};
    const accent = l.accentRect;
    if (!accent || l.hasAccent !== true) {
      return "";
    }
    const shellH = Math.max(1, Math.floor(Number(l.effectiveLayoutHeight) || 1));
    const bottom = Math.max(0, shellH - accent.y - accent.h);
    return ""
      + "left:" + toPx(accent.x) + ";"
      + "top:" + toPx(accent.y) + ";"
      + "bottom:" + toPx(bottom) + ";"
      + "width:" + toPx(accent.w) + ";"
      + "border-radius:" + toPx(accent.w) + ";";
  }

  /** @param {DyniAisTargetGeometryLayout | undefined} layout @returns {DyniAisTargetInlineGeometry} */
  function computeInlineGeometry(layout) {
    const l = layout || {};
    return {
      wrapperStyle: buildWrapperStyle(l),
      identityStyle: buildIdentityStyle(l),
      metricsStyle: buildMetricsStyle(l),
      accentStyle: buildAccentStyle(l),
      metricStyles: buildMetricStyles(l)
    };
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniAisTargetLayoutGeometryStylesApi}
   */
  function create(def, componentContext) {
    toPx = componentContext.components.require("HtmlWidgetUtils").toPx;
    return {
      id: "AisTargetLayoutGeometryStyles",
      computeInlineGeometry: computeInlineGeometry
    };
  }

  return { id: "AisTargetLayoutGeometryStyles", create: create };
}));
