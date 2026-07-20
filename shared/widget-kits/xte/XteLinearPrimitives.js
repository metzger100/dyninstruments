/**
 * @file XteLinearPrimitives - Shared geometry and drawing helpers for the XTE linear bar
 * Documentation: documentation/widgets/xte-display.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniXteLinearPrimitives = factory();
  }
})(this, function () {
  "use strict";

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniXteLinearPrimitivesApi}
   */
  function create(def, componentContext) {
    const toolkit = /** @type {DyniGaugeToolkitApi} */ (componentContext.components.require("GaugeToolkit"));
    const gaugeMath = componentContext.components.require("LinearGaugeMath");
    const geometryScale = componentContext.components.require("GeometryScale");
    const primitives = componentContext.components.require("LinearCanvasPrimitives");

    /** @param {DyniXteLinearLayoutResult} layout @param {DyniXteLinearTheme} theme @returns {DyniXteLinearGeometry} */
    function resolveGeometry(layout, theme) {
      const lt = theme.linear;
      const gb = layout.gaugeBar;
      const primaryDim = Math.max(1, Math.min(gb.w, gb.h));
      const sw = toolkit.value.clampNumber(theme.strokeWeight, 0, Number.MAX_SAFE_INTEGER, 1);
      const pdw = toolkit.value.clampNumber(theme.pointerDepthWeight, 0, Number.MAX_SAFE_INTEGER, 1);
      const psw = toolkit.value.clampNumber(theme.pointerSideWeight, 0, Number.MAX_SAFE_INTEGER, 1);
      const sFloor = geometryScale.strokeFloor(sw);
      const eFloor = geometryScale.extentFloor(sw);
      const trackFactor = toolkit.value.clampNumber(lt.track.widthFactor, 0, Number.MAX_SAFE_INTEGER, 0.16);
      const trackThickness = geometryScale.scale(primaryDim, trackFactor, eFloor);
      const trackLineWidth = geometryScale.scaleStroke(
        primaryDim,
        toolkit.value.clampNumber(lt.track.lineWidthFactor, 0, Number.MAX_SAFE_INTEGER, 0.018),
        sw,
        sFloor
      );
      const majorTickLen = geometryScale.scale(
        primaryDim,
        toolkit.value.clampNumber(lt.ticks.majorLenFactor, 0, Number.MAX_SAFE_INTEGER, 0.109),
        eFloor
      );
      const majorTickWidth = geometryScale.scaleStroke(
        primaryDim,
        toolkit.value.clampNumber(lt.ticks.majorWidthFactor, 0, Number.MAX_SAFE_INTEGER, 0.027),
        sw,
        sFloor
      );
      const minorTickLen = geometryScale.scale(
        primaryDim,
        toolkit.value.clampNumber(lt.ticks.minorLenFactor, 0, Number.MAX_SAFE_INTEGER, 0.064),
        eFloor
      );
      const minorTickWidth = geometryScale.scaleStroke(
        primaryDim,
        toolkit.value.clampNumber(lt.ticks.minorWidthFactor, 0, Number.MAX_SAFE_INTEGER, 0.014),
        sw,
        sFloor
      );
      const pointerDepth = geometryScale.scalePointer(
        primaryDim,
        toolkit.value.clampNumber(lt.pointer.depthFactor, 0, Number.MAX_SAFE_INTEGER, 0.24),
        pdw,
        eFloor
      );
      const pointerSide = geometryScale.scalePointer(
        primaryDim,
        toolkit.value.clampNumber(lt.pointer.sideFactor, 0, Number.MAX_SAFE_INTEGER, 0.12),
        psw,
        eFloor
      );
      const inset = Math.max(1, geometryScale.scale(primaryDim, trackFactor, eFloor));
      const x0 = gb.x + inset;
      const x1 = Math.max(x0 + 1, gb.x + gb.w - inset);
      const trackY = gb.y + Math.floor(gb.h / 2);
      const labelFontPx = Math.max(
        1,
        Math.min(
          gb.h,
          Math.floor(
            primaryDim *
              toolkit.value.clampNumber(lt.labels.fontFactor, 0, Number.MAX_SAFE_INTEGER, 0.14) *
              (layout.responsive.textFillScale || 1)
          )
        )
      );
      const labelInset = Math.max(
        1,
        Math.floor(
          labelFontPx * toolkit.value.clampNumber(lt.labels.insetFactor, 0, Number.MAX_SAFE_INTEGER, 1.8) * 0.2
        )
      );
      return {
        primaryDim: primaryDim,
        trackThickness: trackThickness,
        trackLineWidth: trackLineWidth,
        majorTickLen: majorTickLen,
        majorTickWidth: majorTickWidth,
        minorTickLen: minorTickLen,
        minorTickWidth: minorTickWidth,
        pointerDepth: pointerDepth,
        pointerSide: pointerSide,
        x0: x0,
        x1: x1,
        trackY: trackY,
        labelFontPx: labelFontPx,
        labelInset: labelInset
      };
    }

    /** @param {DyniXteLinearEndLabelOptions} options @returns {void} */
    function drawEndLabels(options) {
      const { ctx, theme, geom, ticks, showEndLabels, family, labelWeight } = options;
      if (!showEndLabels || ticks.major.length < 2) {
        return;
      }
      const first = ticks.major[0];
      const last = ticks.major[ticks.major.length - 1];
      const firstX = gaugeMath.mapValueToX(first, first, last, geom.x0, geom.x1, true);
      const lastX = gaugeMath.mapValueToX(last, first, last, geom.x0, geom.x1, true);
      const labelY =
        geom.trackY +
        Math.floor(geom.trackThickness / 2) +
        geom.pointerDepth +
        geom.labelInset +
        Math.floor(geom.labelFontPx / 2);
      ctx.save();
      ctx.fillStyle = theme.surface.fg;
      ctx.textBaseline = "middle";
      toolkit.text.setFont(ctx, geom.labelFontPx, labelWeight, family);
      ctx.textAlign = "left";
      ctx.fillText(gaugeMath.formatTickLabel(first), Math.round(firstX), labelY);
      ctx.textAlign = "right";
      ctx.fillText(gaugeMath.formatTickLabel(last), Math.round(lastX), labelY);
      ctx.restore();
    }

    /** @param {CanvasRenderingContext2D} ctx @param {number} x @param {DyniXteLinearGeometry} geom @param {string} color @returns {void} */
    function drawPointerUpward(ctx, x, geom, color) {
      const tipY = geom.trackY + Math.floor(geom.trackThickness / 2) + 1;
      const side = Math.max(1, Math.floor(geom.pointerSide));
      const depth = Math.max(1, Math.floor(geom.pointerDepth));
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, tipY);
      ctx.lineTo(x - side, tipY + depth);
      ctx.lineTo(x + side, tipY + depth);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    /** @param {CanvasRenderingContext2D} ctx @param {DyniXteLinearGeometry} geom @param {string} color @returns {void} */
    function drawTrackLayer(ctx, geom, color) {
      primitives.drawTrack(ctx, geom.x0, geom.x1, geom.trackY, { lineWidth: geom.trackLineWidth, strokeStyle: color });
    }

    /** @param {CanvasRenderingContext2D} ctx @param {DyniXteLinearGeometry} geom @param {DyniLinearTicks} ticks @param {number} xteScale @param {string} color @returns {void} */
    function drawTicksLayer(ctx, geom, ticks, xteScale, color) {
      const minorStyle = { lineWidth: geom.minorTickWidth, strokeStyle: color };
      const majorStyle = { lineWidth: geom.majorTickWidth, strokeStyle: color };
      for (let i = 0; i < ticks.minor.length; i++) {
        const x = gaugeMath.mapValueToX(ticks.minor[i], -xteScale, xteScale, geom.x0, geom.x1, true);
        if (Number.isFinite(x)) primitives.drawTick(ctx, Math.round(x), geom.trackY, geom.minorTickLen, minorStyle);
      }
      for (let i = 0; i < ticks.major.length; i++) {
        const x = gaugeMath.mapValueToX(ticks.major[i], -xteScale, xteScale, geom.x0, geom.x1, true);
        if (Number.isFinite(x)) primitives.drawTick(ctx, Math.round(x), geom.trackY, geom.majorTickLen, majorStyle);
      }
    }

    return {
      resolveGeometry: resolveGeometry,
      drawEndLabels: drawEndLabels,
      drawPointerUpward: drawPointerUpward,
      drawTrackLayer: drawTrackLayer,
      drawTicksLayer: drawTicksLayer
    };
  }

  return { id: "XteLinearPrimitives", create: create };
});
