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
  const DEFAULT_STYLE = { lineWidthFactor: 1 };

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

    function computeMode(W, H, thresholdNormal, thresholdFlat, modeFn) {
      const ratio = W / Math.max(1, H);
      const normal = Number.isFinite(thresholdNormal) ? thresholdNormal : 0.85;
      const flat = Number.isFinite(thresholdFlat) ? thresholdFlat : 2.3;
      if (typeof modeFn === "function") {
        return modeFn(ratio, normal, flat);
      }
      if (ratio < normal) {
        return "high";
      }
      if (ratio > flat) {
        return "flat";
      }
      return "normal";
    }

    function computeLayout(W, H, pad, gap, mode, options) {
      const innerX = pad;
      const innerY = pad;
      const innerW = Math.max(1, W - pad * 2);
      const innerH = Math.max(1, H - pad * 2);
      const opts = options || {};
      const reserveNameSpace = opts.reserveNameSpace !== false;

      if (mode === "flat") {
        const highwayW = Math.max(40, Math.floor(innerW * 0.58));
        const dataW = Math.max(40, innerW - highwayW - gap);
        const dataX = innerX + highwayW + gap;
        const headerH = reserveNameSpace ? Math.max(16, Math.floor(innerH * 0.22)) : 0;
        const reservedNameH = reserveNameSpace ? (headerH + gap) : 0;
        const gridY = innerY + reservedNameH;
        const gridH = Math.max(20, innerH - reservedNameH);
        const rowH = Math.max(10, Math.floor((gridH - gap) / 2));
        const colW = Math.max(12, Math.floor((dataW - gap) / 2));

        return {
          mode: mode,
          highway: { x: innerX, y: innerY, w: highwayW, h: innerH },
          nameRect: { x: dataX, y: innerY, w: dataW, h: headerH },
          metricRects: {
            cog: { x: dataX, y: gridY, w: colW, h: rowH },
            btw: { x: dataX + colW + gap, y: gridY, w: colW, h: rowH },
            xte: { x: dataX, y: gridY + rowH + gap, w: colW, h: rowH },
            dtw: { x: dataX + colW + gap, y: gridY + rowH + gap, w: colW, h: rowH }
          }
        };
      }

      if (mode === "high") {
        const topH = Math.max(16, Math.floor(innerH * 0.14));
        const highwayY = innerY + topH + gap;
        const highwayH = Math.max(24, Math.floor(innerH * 0.68));
        const bottomY = highwayY + highwayH + gap;
        const bottomH = Math.max(18, innerY + innerH - bottomY);
        const topHalfW = Math.max(20, Math.floor((innerW - gap) / 2));
        const bottomHalfW = topHalfW;

        return {
          mode: mode,
          highway: { x: innerX, y: highwayY, w: innerW, h: highwayH },
          nameRect: { x: innerX + Math.floor(innerW * 0.18), y: innerY, w: Math.floor(innerW * 0.64), h: topH },
          metricRects: {
            cog: { x: innerX, y: innerY, w: topHalfW, h: topH },
            btw: { x: innerX + topHalfW + gap, y: innerY, w: topHalfW, h: topH },
            xte: { x: innerX, y: bottomY, w: bottomHalfW, h: bottomH },
            dtw: { x: innerX + bottomHalfW + gap, y: bottomY, w: bottomHalfW, h: bottomH }
          }
        };
      }

      const highwayH = Math.max(24, Math.floor(innerH * 0.64));
      const bandY = innerY + highwayH + gap;
      const bandH = Math.max(20, innerH - highwayH - gap);
      const colW = Math.max(12, Math.floor((innerW - gap * 3) / 4));

      return {
        mode: mode,
        highway: { x: innerX, y: innerY, w: innerW, h: highwayH },
        nameRect: {
          x: innerX + Math.floor(innerW * 0.1),
          y: innerY + Math.max(2, Math.floor(highwayH * 0.04)),
          w: Math.floor(innerW * 0.8),
          h: Math.max(16, Math.floor(highwayH * 0.14))
        },
        metricRects: {
          cog: { x: innerX, y: bandY, w: colW, h: bandH },
          xte: { x: innerX + (colW + gap), y: bandY, w: colW, h: bandH },
          dtw: { x: innerX + (colW + gap) * 2, y: bandY, w: colW, h: bandH },
          btw: { x: innerX + (colW + gap) * 3, y: bandY, w: colW, h: bandH }
        }
      };
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
      const safeNorm = clamp(xteNormalized, -1.1, 1.1);
      const markerX = cx + safeNorm * nearHalf * 0.82;
      const markerY = baseY - (baseY - horizonY) * 0.12;
      const laneDepth = Math.max(1, baseY - horizonY);
      const markerLength = clamp(nearHalf * 0.11, 4, laneDepth * 0.24);
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

    function shouldShowWaypoint(mode, rect, showWpName, name) {
      if (!showWpName || !name) {
        return false;
      }
      if (mode === "flat") {
        return rect.w >= 110 && rect.h >= 16;
      }
      if (mode === "high") {
        return rect.w >= 100 && rect.h >= 14;
      }
      return rect.w >= 120 && rect.h >= 16;
    }

    return {
      clamp: clamp,
      computeMode: computeMode,
      computeLayout: computeLayout,
      highwayGeometry: highwayGeometry,
      drawStaticHighway: drawStaticHighway,
      drawDynamicHighway: drawDynamicHighway,
      shouldShowWaypoint: shouldShowWaypoint
    };
  }

  return { id: "XteHighwayPrimitives", create: create };
}));
