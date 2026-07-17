/**
 * @file LinearGaugeLabelFit - Shared label fitting and placement helpers for linear gauges
 * Documentation: documentation/linear/linear-shared-api.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniLinearGaugeLabelFit = factory();
  }
}(this, function () {
  "use strict";

  /**
   * @param {DyniLinearGaugeDrawingState} state
   * @returns {DyniLinearScaleBounds}
   */
  function resolveScaleBounds(state) {
    return {
      left: Math.min(Number(state.layout.scaleX0) || 0, Number(state.layout.scaleX1) || 0),
      right: Math.max(Number(state.layout.scaleX0) || 0, Number(state.layout.scaleX1) || 0)
    };
  }

  /**
   * @param {number} x
   * @param {number} width
   * @param {unknown} isStart
   * @param {unknown} isEnd
   * @param {unknown} isFirst
   * @param {unknown} isLast
   * @param {DyniLinearGaugeDrawingState} state
   * @param {number} fontPx
   * @returns {DyniLinearLabelPlacement}
   */
  function resolveEdgePlacement(x, width, isStart, isEnd, isFirst, isLast, state, fontPx) {
    const scaleBounds = resolveScaleBounds(state);
    const edgePad = Math.max(1, Math.floor(fontPx * 0.08));

    if (isStart && isEnd) {
      return {
        textAlign: "center",
        drawX: Math.round(x),
        left: x - width / 2,
        right: x + width / 2
      };
    }
    if (isStart) {
      const drawX = Math.round(scaleBounds.left + edgePad);
      return {
        textAlign: "left",
        drawX: drawX,
        left: drawX,
        right: drawX + width
      };
    }
    if (isEnd) {
      const drawX = Math.round(scaleBounds.right - edgePad);
      return {
        textAlign: "right",
        drawX: drawX,
        left: drawX - width,
        right: drawX
      };
    }
    if (isFirst && x - width / 2 <= scaleBounds.left) {
      const drawX = Math.round(scaleBounds.left + edgePad);
      return {
        textAlign: "left",
        drawX: drawX,
        left: drawX,
        right: drawX + width
      };
    }
    if (isLast && x + width / 2 >= scaleBounds.right) {
      const drawX = Math.round(scaleBounds.right - edgePad);
      return {
        textAlign: "right",
        drawX: drawX,
        left: drawX - width,
        right: drawX
      };
    }
    return {
      textAlign: "center",
      drawX: Math.round(x),
      left: x - width / 2,
      right: x + width / 2
    };
  }

  /**
   * @param {DyniLinearLabelEntry} entry
   * @param {number} width
   * @param {unknown} isStart
   * @param {unknown} isEnd
   * @param {unknown} isFirst
   * @param {unknown} isLast
   * @param {DyniLinearGaugeDrawingState} state
   * @param {number} fontPx
   * @param {DyniLinearLabelEdgePolicyResolver} resolveLabelEdgePolicy
   * @returns {DyniLinearLabelPlacement}
   */
  function resolveLabelPlacement(entry, width, isStart, isEnd, isFirst, isLast, state, fontPx, resolveLabelEdgePolicy) {
    if (resolveLabelEdgePolicy(state) === "sliding") {
      const x = Number(entry && entry.naturalX);
      return {
        textAlign: "center",
        drawX: Math.round(x),
        left: x - width / 2,
        right: x + width / 2
      };
    }
    return resolveEdgePlacement(
      Number(entry && Number.isFinite(Number(entry.clampedX)) ? entry.clampedX : entry.x),
      width,
      isStart,
      isEnd,
      isFirst,
      isLast,
      state,
      fontPx
    );
  }

  /**
   * @param {DyniLinearGaugeDrawingState} state
   * @param {unknown} labelY
   * @param {number} fontPx
   * @returns {DyniLinearLabelClipRect}
   */
  function resolveLabelClipRect(state, labelY, fontPx) {
    const scaleBounds = resolveScaleBounds(state);
    return {
      left: scaleBounds.left,
      top: Math.max(0, Math.floor(Number(labelY) - 1)),
      width: Math.max(1, scaleBounds.right - scaleBounds.left),
      height: Math.max(1, Math.ceil(Number(fontPx) + 3))
    };
  }

  /**
   * @param {DyniLinearGaugeDrawingState} state
   * @param {DyniLinearTicks} ticks
   * @param {unknown} showEndLabels
   * @param {DyniLinearGaugeMathApi} math
   * @param {DyniLinearTickLabelFormatter | null} labelFormatter
   * @returns {DyniLinearLabelEntry[]}
   */
  function collectLabels(state, ticks, showEndLabels, math, labelFormatter) {
    /** @type {DyniLinearLabelEntry[]} */
    const labels = [];
    if (!math || !state || !ticks || !ticks.major || !ticks.major.length) {
      return labels;
    }
    for (let i = 0; i < ticks.major.length; i++) {
      const tickV = ticks.major[i];
      const isStart = Math.abs(tickV - state.axis.min) <= 1e-6;
      const isEnd = Math.abs(tickV - state.axis.max) <= 1e-6;
      if (!showEndLabels && (isStart || isEnd)) {
        continue;
      }
      const x = math.mapValueToX(
        tickV,
        state.axis.min,
        state.axis.max,
        state.layout.scaleX0,
        state.layout.scaleX1,
        true
      );
      const naturalX = math.mapValueToX(
        tickV,
        state.axis.min,
        state.axis.max,
        state.layout.scaleX0,
        state.layout.scaleX1,
        false
      );
      if (!Number.isFinite(x) || !Number.isFinite(naturalX)) {
        continue;
      }
      const labelRaw = (typeof labelFormatter === "function")
        ? labelFormatter(tickV, state)
        : math.formatTickLabel(tickV);
      if (labelRaw == null) {
        continue;
      }
      const label = String(labelRaw);
      if (!label) {
        continue;
      }
      labels.push({
        x: x,
        naturalX: naturalX,
        clampedX: x,
        label: label,
        isStart: isStart,
        isEnd: isEnd
      });
    }
    return labels;
  }

  /**
   * @param {CanvasRenderingContext2D} layerCtx
   * @param {DyniLinearGaugeDrawingState} state
   * @param {DyniLinearLabelEntry[]} labels
   * @param {number} fontPx
   * @param {DyniCanvasTextFittingApi["setFont"]} setCanvasFont
   * @param {DyniLinearLabelEdgePolicyResolver} resolveLabelEdgePolicy
   * @returns {boolean}
   */
  function labelPassFits(layerCtx, state, labels, fontPx, setCanvasFont, resolveLabelEdgePolicy) {
    if (!labels.length) {
      return true;
    }
    const scaleBounds = resolveScaleBounds(state);
    const minGap = Math.max(2, Math.floor(fontPx * 0.2));
    let lastRight = -Infinity;
    const sliding = resolveLabelEdgePolicy(state) === "sliding";

    setCanvasFont(layerCtx, fontPx, state.labelWeight, state.family);

    for (let i = 0; i < labels.length; i++) {
      const entry = labels[i];
      const width = layerCtx.measureText(entry.label).width;
      const placement = resolveLabelPlacement(
        entry,
        width,
        entry.isStart,
        entry.isEnd,
        i === 0,
        i === labels.length - 1,
        state,
        fontPx,
        resolveLabelEdgePolicy
      );
      if (!sliding && (placement.left < scaleBounds.left || placement.right > scaleBounds.right)) {
        return false;
      }
      if (placement.left <= lastRight + minGap) {
        return false;
      }
      lastRight = placement.right;
    }
    return true;
  }

  /**
   * @param {CanvasRenderingContext2D} layerCtx
   * @param {DyniLinearGaugeDrawingState} state
   * @param {DyniLinearLabelEntry[]} labels
   * @param {DyniCanvasTextFittingApi["setFont"]} setCanvasFont
   * @param {DyniLinearLabelEdgePolicyResolver} resolveLabelEdgePolicy
   * @returns {number}
   */
  function resolveLabelFontPx(layerCtx, state, labels, setCanvasFont, resolveLabelEdgePolicy) {
    const ceilingPx = Math.max(1, Math.floor(Number(state.labelFontPx) || 0));
    let low = 1;
    let high = ceilingPx;
    let best = 1;

    while (low <= high) {
      const candidate = Math.floor((low + high) / 2);
      if (labelPassFits(layerCtx, state, labels, candidate, setCanvasFont, resolveLabelEdgePolicy)) {
        best = candidate;
        low = candidate + 1;
      }
      else {
        high = candidate - 1;
      }
    }

    return best;
  }

  /**
   * @param {DyniLinearGaugeDrawingState} state
   * @param {number} fontPx
   * @returns {number}
   */
  function resolveLabelY(state, fontPx) {
    const tickReach = Math.max(
      Number(state.layout.majorTickLen) || 0,
      Number(state.layout.minorTickLen) || 0
    );
    const baseFontPx = Math.max(1, Math.floor(Number(state.labelFontPx) || 0));
    const insetScale = fontPx / Math.max(1, baseFontPx);
    const labelInsetPx = Math.max(
      2,
      Math.floor((Number(state.labelInsetPx) || 2) * insetScale)
    );
    const trackBottomLimit = Math.round(state.layout.trackBox.y + state.layout.trackBox.h - fontPx - 1);
    const inlineTopLimit = state.layout.inlineBox
      ? Math.round(state.layout.inlineBox.y - fontPx - 2)
      : trackBottomLimit;
    return Math.min(
      Math.round(state.layout.trackY + tickReach + labelInsetPx),
      Math.min(trackBottomLimit, inlineTopLimit)
    );
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniLinearGaugeLabelFitApi}
   */
  function create(def, componentContext) {
    const fitting = componentContext.components.require("CanvasTextFitting");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const setCanvasFont = fitting.setFont;
    const resolveLabelEdgePolicy = htmlUtils.resolveLabelEdgePolicy;

    /**
     * @param {DyniLinearLabelEntry} entry
     * @param {number} width
     * @param {unknown} isStart
     * @param {unknown} isEnd
     * @param {unknown} isFirst
     * @param {unknown} isLast
     * @param {DyniLinearGaugeDrawingState} state
     * @param {number} fontPx
     * @returns {DyniLinearLabelPlacement}
     */
    function resolveLabelPlacementWithPolicy(entry, width, isStart, isEnd, isFirst, isLast, state, fontPx) {
      return resolveLabelPlacement(
        entry,
        width,
        isStart,
        isEnd,
        isFirst,
        isLast,
        state,
        fontPx,
        resolveLabelEdgePolicy
      );
    }

    /**
     * @param {CanvasRenderingContext2D} layerCtx
     * @param {DyniLinearGaugeDrawingState} state
     * @param {DyniLinearLabelEntry[]} labels
     * @returns {number}
     */
    function resolveLabelFontPxWithPolicy(layerCtx, state, labels) {
      return resolveLabelFontPx(layerCtx, state, labels, setCanvasFont, resolveLabelEdgePolicy);
    }

    return {
      id: "LinearGaugeLabelFit",
      setCanvasFont: setCanvasFont,
      resolveScaleBounds: resolveScaleBounds,
      resolveEdgePlacement: resolveEdgePlacement,
      resolveLabelEdgePolicy: resolveLabelEdgePolicy,
      resolveLabelPlacement: resolveLabelPlacementWithPolicy,
      resolveLabelClipRect: resolveLabelClipRect,
      collectLabels: collectLabels,
      resolveLabelFontPx: resolveLabelFontPxWithPolicy,
      resolveLabelY: resolveLabelY
    };
  }

  return { id: "LinearGaugeLabelFit", create: create };
}));
