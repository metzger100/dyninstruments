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

  function create() {
    function clamp(value, lo, hi) {
      return Math.max(lo, Math.min(hi, value));
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
        const dtwW = Math.max(24, Math.floor(innerW * 0.34));
        const xteW = Math.max(24, innerW - dtwW - gap);

        return {
          mode: mode,
          highway: { x: innerX, y: highwayY, w: innerW, h: highwayH },
          nameRect: { x: innerX + Math.floor(innerW * 0.18), y: innerY, w: Math.floor(innerW * 0.64), h: topH },
          metricRects: {
            cog: { x: innerX, y: innerY, w: topHalfW, h: topH },
            btw: { x: innerX + topHalfW + gap, y: innerY, w: topHalfW, h: topH },
            xte: { x: innerX, y: bottomY, w: xteW, h: bottomH },
            dtw: { x: innerX + xteW + gap, y: bottomY, w: dtwW, h: bottomH }
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

    function drawStaticHighway(ctx, geom, colors, textColor, mode) {
      const cx = geom.cx;
      const horizonY = geom.horizonY;
      const baseY = geom.baseY;
      const nearHalf = geom.nearHalf;
      const farHalf = geom.farHalf;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.fillStyle = colors.warning;
      ctx.globalAlpha = 0.07;
      ctx.beginPath();
      ctx.moveTo(cx - farHalf, horizonY);
      ctx.lineTo(cx - nearHalf, baseY);
      ctx.lineTo(cx - nearHalf * 0.86, baseY);
      ctx.lineTo(cx - farHalf * 0.7, horizonY);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx + farHalf, horizonY);
      ctx.lineTo(cx + nearHalf, baseY);
      ctx.lineTo(cx + nearHalf * 0.86, baseY);
      ctx.lineTo(cx + farHalf * 0.7, horizonY);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 0.08;
      ctx.fillStyle = colors.laylinePort;
      ctx.beginPath();
      ctx.moveTo(cx - farHalf, horizonY);
      ctx.lineTo(cx, horizonY);
      ctx.lineTo(cx, baseY);
      ctx.lineTo(cx - nearHalf, baseY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = colors.laylineStb;
      ctx.beginPath();
      ctx.moveTo(cx + farHalf, horizonY);
      ctx.lineTo(cx, horizonY);
      ctx.lineTo(cx, baseY);
      ctx.lineTo(cx + nearHalf, baseY);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = textColor;
      ctx.lineWidth = Math.max(1.2, nearHalf * 0.01);
      ctx.beginPath();
      ctx.moveTo(cx - farHalf, horizonY);
      ctx.lineTo(cx - nearHalf, baseY);
      ctx.moveTo(cx + farHalf, horizonY);
      ctx.lineTo(cx + nearHalf, baseY);
      ctx.stroke();

      const stripeCount = mode === "high" ? 12 : 10;
      for (let i = 0; i <= stripeCount; i += 1) {
        const t = i / stripeCount;
        const p = t * t;
        const y = horizonY + (baseY - horizonY) * p;
        const half = farHalf + (nearHalf - farHalf) * p;

        ctx.globalAlpha = 0.35 + p * 0.35;
        ctx.lineWidth = Math.max(1, 0.8 + p * 1.8);
        ctx.beginPath();
        ctx.moveTo(cx - half, y);
        ctx.lineTo(cx + half, y);
        ctx.stroke();

        const laneHalf = half * 0.42;
        ctx.globalAlpha = 0.28;
        ctx.beginPath();
        ctx.moveTo(cx - laneHalf, y);
        ctx.lineTo(cx - laneHalf * 0.9, y + 0.01);
        ctx.moveTo(cx + laneHalf, y);
        ctx.lineTo(cx + laneHalf * 0.9, y + 0.01);
        ctx.stroke();
      }

      ctx.globalAlpha = 0.8;
      ctx.lineWidth = Math.max(1.2, nearHalf * 0.013);
      ctx.beginPath();
      ctx.moveTo(cx - farHalf, horizonY);
      ctx.lineTo(cx + farHalf, horizonY);
      ctx.stroke();
      ctx.restore();
    }

    function drawDynamicHighway(ctx, geom, colors, xteNormalized, overflow) {
      const cx = geom.cx;
      const horizonY = geom.horizonY;
      const baseY = geom.baseY;
      const nearHalf = geom.nearHalf;
      const safeNorm = clamp(xteNormalized, -1.1, 1.1);
      const markerX = cx + safeNorm * nearHalf * 0.82;
      const markerY = baseY - (baseY - horizonY) * 0.12;
      const markerSize = Math.max(8, nearHalf * 0.08);

      ctx.save();
      ctx.strokeStyle = colors.pointer;
      ctx.lineWidth = Math.max(1.4, nearHalf * 0.018);
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(cx, horizonY);
      ctx.lineTo(cx, baseY);
      ctx.stroke();

      ctx.globalAlpha = 0.95;
      ctx.fillStyle = colors.pointer;
      ctx.beginPath();
      ctx.moveTo(markerX, markerY - markerSize);
      ctx.lineTo(markerX - markerSize * 0.7, markerY + markerSize * 0.8);
      ctx.lineTo(markerX + markerSize * 0.7, markerY + markerSize * 0.8);
      ctx.closePath();
      ctx.fill();

      if (overflow) {
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = colors.alarm;
        const edgeX = cx + (safeNorm >= 0 ? 1 : -1) * nearHalf * 0.93;
        const edgeR = Math.max(3, markerSize * 0.35);
        ctx.beginPath();
        ctx.arc(edgeX, markerY - markerSize * 0.2, edgeR, 0, Math.PI * 2);
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
