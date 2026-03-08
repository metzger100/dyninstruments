/**
 * Module: XteHighwayPrimitives - Shared geometry and drawing helpers for XTE highway visuals
 * Documentation: documentation/widgets/xte-display.md
 * Depends: CanvasRenderingContext2D
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniXteHighwayPrimitives = factory(); }
}(this, function () {
  "use strict";
  const DEFAULT_STYLE = { lineWidthFactor: 1, boatSizeFactor: 1 };

  function create() {
    function clamp(value, lo, hi) {
      return Math.max(lo, Math.min(hi, value));
    }

    function lerp(from, to, t) {
      return from + (to - from) * t;
    }

    function snapCoord(value, lineWidth) {
      const width = Math.max(1, Math.round(Number.isFinite(lineWidth) ? lineWidth : 1));
      return Math.round(value) + (width % 2 ? 0.5 : 0);
    }

    function highwayGeometry(rect, mode, options) {
      const opts = options || {};
      const cx = rect.x + rect.w * 0.5;
      let topFactor = mode === "high" ? 0.18 : 0.3;
      if (opts.compactTop === true) {
        if (mode === "flat") {
          topFactor = 0.14;
        } else if (mode === "high") {
          topFactor = 0.1;
        } else {
          topFactor = 0.16;
        }
      }
      const horizonY = rect.y + rect.h * topFactor;
      const baseY = rect.y + rect.h * 0.92;
      const nearHalf = rect.w * 0.43;
      const farHalf = rect.w * 0.1;
      return {
        cx: cx,
        horizonY: horizonY,
        baseY: baseY,
        nearHalf: nearHalf,
        farHalf: farHalf
      };
    }

    function resolveLineWidthFactor(style) {
      const source = style || DEFAULT_STYLE;
      const factor = source.lineWidthFactor;
      return factor > 0 ? factor : 1;
    }

    function resolveBoatSizeFactor(style) {
      const source = style || DEFAULT_STYLE;
      const factor = source.boatSizeFactor;
      return factor > 0 ? factor : 1;
    }

    function strokeSegment(ctx, x1, y1, x2, y2, lineWidth) {
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(snapCoord(x1, lineWidth), snapCoord(y1, lineWidth));
      ctx.lineTo(snapCoord(x2, lineWidth), snapCoord(y2, lineWidth));
      ctx.stroke();
    }

    function strokeCrossbar(ctx, cx, y, half, lineWidth) {
      strokeSegment(ctx, cx - half, y, cx + half, y, lineWidth);
    }

    function drawStaticHighway(ctx, geom, colors, mode, style) {
      const cx = geom.cx;
      const horizonY = geom.horizonY;
      const baseY = geom.baseY;
      const nearHalf = geom.nearHalf;
      const farHalf = geom.farHalf;
      const laneDepth = Math.max(1, baseY - horizonY);
      const lineWidthFactor = resolveLineWidthFactor(style);
      const railWidth = Math.max(1.2, nearHalf * 0.012) * lineWidthFactor;
      const crossbarWidth = Math.max(1, nearHalf * 0.009) * lineWidthFactor;
      const seamWidth = Math.max(1, crossbarWidth * 0.7);
      const horizonWidth = Math.max(1, railWidth * 0.9);
      const stripeCount = mode === "high" ? 8 : (mode === "flat" ? 6 : 7);

      ctx.save();
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";
      ctx.strokeStyle = colors.roadLine;
      strokeSegment(ctx, cx - farHalf, horizonY, cx - nearHalf, baseY, railWidth);
      strokeSegment(ctx, cx + farHalf, horizonY, cx + nearHalf, baseY, railWidth);
      strokeCrossbar(ctx, cx, horizonY, farHalf, horizonWidth);

      ctx.strokeStyle = colors.stripeLine;
      for (let i = 1; i <= stripeCount; i += 1) {
        const p = Math.pow(i / (stripeCount + 1), 1.65);
        const y = lerp(horizonY, baseY, p);
        const half = lerp(farHalf, nearHalf, p);
        const crossbarHalf = Math.max(half * 0.72, half - railWidth * 0.45);

        strokeCrossbar(ctx, cx, y, crossbarHalf, crossbarWidth);
        if (i < stripeCount) {
          const nextP = Math.pow((i + 1) / (stripeCount + 1), 1.65);
          const nextY = lerp(horizonY, baseY, nextP);
          const gapMid = (y + nextY) * 0.5;
          const seamLen = clamp((nextY - y) * 0.42, 3, laneDepth * 0.08);
          strokeSegment(ctx, cx, gapMid - seamLen * 0.5, cx, gapMid + seamLen * 0.5, seamWidth);
        }
      }
      ctx.restore();
    }

    function drawBoatMarker(ctx, markerX, markerY, markerLength, markerBeam) {
      const bowY = markerY - markerLength * 0.62;
      const shoulderY = markerY - markerLength * 0.2;
      const midY = markerY + markerLength * 0.18;
      const sternY = markerY + markerLength * 0.56;
      const shoulderX = markerBeam * 0.48;
      const midX = markerBeam * 0.56;
      const sternX = markerBeam * 0.28;
      const notchX = markerBeam * 0.12;
      const notchY = sternY - markerLength * 0.08;

      ctx.beginPath();
      ctx.moveTo(markerX, bowY);
      ctx.lineTo(markerX + shoulderX, shoulderY);
      ctx.lineTo(markerX + midX, midY);
      ctx.lineTo(markerX + sternX, sternY);
      ctx.lineTo(markerX + notchX, notchY);
      ctx.lineTo(markerX - notchX, notchY);
      ctx.lineTo(markerX - sternX, sternY);
      ctx.lineTo(markerX - midX, midY);
      ctx.lineTo(markerX - shoulderX, shoulderY);
      ctx.closePath();
      ctx.fill();
    }

    function drawDynamicHighway(ctx, geom, colors, xteNormalized, overflow, style) {
      const cx = geom.cx;
      const horizonY = geom.horizonY;
      const baseY = geom.baseY;
      const nearHalf = geom.nearHalf;
      const lineWidthFactor = resolveLineWidthFactor(style);
      const boatSizeFactor = resolveBoatSizeFactor(style);
      const safeNorm = clamp(xteNormalized, -1.1, 1.1);
      const markerX = cx + safeNorm * nearHalf * 0.82;
      const markerY = baseY - (baseY - horizonY) * 0.12;
      const laneDepth = Math.max(1, baseY - horizonY);
      const markerBaseLength = clamp(nearHalf * 0.11, 4, laneDepth * 0.24);
      const markerLength = Math.max(4, markerBaseLength * boatSizeFactor);
      const markerBeam = Math.max(3, markerLength * 0.62);
      const centerlineWidth = Math.max(1.4, nearHalf * 0.016) * lineWidthFactor;

      ctx.save();
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";
      ctx.strokeStyle = colors.pointer;
      strokeSegment(ctx, cx, horizonY, cx, baseY, centerlineWidth);

      ctx.fillStyle = colors.pointer;
      drawBoatMarker(ctx, markerX, markerY, markerLength, markerBeam);

      if (overflow) {
        ctx.fillStyle = colors.alarm;
        const edgeX = cx + (safeNorm >= 0 ? 1 : -1) * nearHalf * 0.93;
        const edgeR = Math.max(2.6, markerLength * 0.3);
        ctx.beginPath();
        ctx.arc(edgeX, markerY - markerLength * 0.12, edgeR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    function shouldShowWaypoint(mode, layout, showWpName, name, fit) {
      const rect = layout && layout.nameRect;
      const responsive = layout && layout.responsive;
      if (!showWpName || !name || !rect || !fit) {
        return false;
      }
      const fittedText = typeof fit.text === "string"
        ? fit.text.trim()
        : (fit.text == null ? "" : String(fit.text).trim());
      if (!fittedText) {
        return false;
      }
      const fullText = String(name).trim();
      const coverage = fullText ? fittedText.length / fullText.length : 0;
      const textFill = fit.px / Math.max(1, rect.h);
      const compactness = responsive && Number.isFinite(responsive.t) ? responsive.t : 0;
      if (mode === "flat") {
        return compactness >= 0.22 && coverage >= 0.45 && textFill >= 0.45;
      }
      if (mode === "high") {
        return compactness >= 0.35 && coverage >= 0.5 && textFill >= 0.5;
      }
      return compactness >= 0.18 && coverage >= 0.45 && textFill >= 0.45;
    }

    return {
      clamp: clamp,
      highwayGeometry: highwayGeometry,
      drawStaticHighway: drawStaticHighway,
      drawDynamicHighway: drawDynamicHighway,
      shouldShowWaypoint: shouldShowWaypoint
    };
  }

  return { id: "XteHighwayPrimitives", create: create };
}));
