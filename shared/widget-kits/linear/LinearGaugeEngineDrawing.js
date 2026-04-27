/**
 * Module: LinearGaugeEngineDrawing - Shared drawing helpers for linear gauge static layers and markers
 * Documentation: documentation/linear/linear-shared-api.md
 * Depends: LinearCanvasPrimitives
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniLinearGaugeEngineDrawing = factory(); }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;

  function create() {
    function drawStaticLayer(layerCtx, state, ticks, showEndLabels, sectors, labelFormatter) {
      const layout = state.layout;
      const theme = state.theme;
      const primitives = state.primitives;
      const textLayout = state.textLayout;
      const math = state.math;
      const mapValueToX = state.mapValueToX;
      const majorStyle = { lineWidth: layout.majorTickWidth, strokeStyle: state.color };
      const minorStyle = { lineWidth: layout.minorTickWidth, strokeStyle: state.color };

      primitives.drawTrack(layerCtx, state.layout.scaleX0, state.layout.scaleX1, state.layout.trackY, {
        lineWidth: layout.trackLineWidth,
        strokeStyle: state.color
      });

      for (let i = 0; i < sectors.length; i++) {
        const sector = sectors[i];
        if (!sector) continue;
        const from = Number(sector.from);
        const to = Number(sector.to);
        if (!isFinite(from) || !isFinite(to) || to <= from) continue;
        const x0 = mapValueToX(from, true);
        const x1 = mapValueToX(to, true);
        if (!isFinite(x0) || !isFinite(x1) || Math.abs(x1 - x0) <= 1) continue;
        primitives.drawBand(layerCtx, x0, x1, state.sectorBandY, state.trackThickness, { fillStyle: sector.color });
      }

      for (let i = 0; i < ticks.minor.length; i++) {
        const x = mapValueToX(ticks.minor[i], true);
        if (isFinite(x)) primitives.drawTick(layerCtx, Math.round(x), state.layout.trackY, layout.minorTickLen, minorStyle);
      }
      for (let i = 0; i < ticks.major.length; i++) {
        const x = mapValueToX(ticks.major[i], true);
        if (isFinite(x)) primitives.drawTick(layerCtx, Math.round(x), state.layout.trackY, layout.majorTickLen, majorStyle);
      }

      textLayout.drawTickLabels(layerCtx, state, ticks, showEndLabels, math, labelFormatter);
    }

    function drawPointerAtValue(ctx, state, layout, theme, primitives, mapValueToX, markerValue, pointerDepthBase, markerSizeBase, opts) {
      const pointerNum = Number(markerValue);
      if (!isFinite(pointerNum)) {
        return;
      }
      const pointerX = mapValueToX(pointerNum, true);
      if (!isFinite(pointerX)) {
        return;
      }
      const markerOpts = opts || {};
      const basePointerSize = Number.isFinite(Number(markerOpts.depth)) ? Math.max(1, Math.floor(markerOpts.depth)) : Math.max(1, Math.floor(pointerDepthBase));
      const defaultSide = Number.isFinite(Number(layout.pointerSide))
        ? Math.max(1, Math.floor(layout.pointerSide / 2))
        : Math.max(1, Math.floor(basePointerSize / 2));
      primitives.drawPointer(ctx, Math.round(pointerX), layout.trackY - Math.floor(state.trackThickness / 2) - 1, {
        depth: basePointerSize,
        side: Number.isFinite(Number(markerOpts.side)) ? Math.max(1, Math.floor(markerOpts.side)) : defaultSide,
        fillStyle: hasOwn.call(markerOpts, "fillStyle") ? markerOpts.fillStyle : theme.colors.pointer
      });
    }

    function drawMarkerAtValue(ctx, state, layout, theme, primitives, mapValueToX, markerValue, markerSizeBase, opts) {
      const markerNum = Number(markerValue);
      if (!isFinite(markerNum)) {
        return;
      }
      const markerX = mapValueToX(markerNum, true);
      if (!isFinite(markerX)) {
        return;
      }
      const markerOpts = opts || {};
      const len = Number.isFinite(Number(markerOpts.len)) ? Math.max(1, markerOpts.len) : Math.max(1, Math.floor(markerSizeBase * 0.9));
      const width = Number.isFinite(Number(markerOpts.lineWidth)) ? Math.max(1, markerOpts.lineWidth) : Math.max(1, Math.floor(markerSizeBase * 0.4));
      primitives.drawTick(ctx, Math.round(markerX), layout.trackY + len, len, {
        lineWidth: width,
        lineCap: "butt",
        strokeStyle: hasOwn.call(markerOpts, "strokeStyle") ? markerOpts.strokeStyle : theme.colors.pointer
      });
    }

    return {
      id: "LinearGaugeEngineDrawing",
      version: "0.1.0",
      drawStaticLayer: drawStaticLayer,
      drawPointerAtValue: drawPointerAtValue,
      drawMarkerAtValue: drawMarkerAtValue
    };
  }

  return { id: "LinearGaugeEngineDrawing", create: create };
}));
