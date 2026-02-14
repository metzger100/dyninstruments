/*!
 * WindDial (UMD) — compact dial for AWA/AWS and TWA/TWS
 *
 * Updated: uses GaugeUtils.draw shared primitives instead of PolarCore.
 *
 * Modes:
 *  - Flat:   Angle caption (left top), value+unit (left bottom), dial centered,
 *            Speed caption (right top), value+unit (right bottom).
 *            The dial stays maximal. In flat mode the side boxes:
 *              1) maximize Value+Unit up to the dial edge (width-constrained),
 *              2) maximize Caption in its own top box (width/height-constrained),
 *                 additionally capped at (ValuePx * captionUnitScale) to keep relation.
 *            Value/Unit never downscale due to dial; only captions adjust if needed.
 *  - Normal: Dial centered; inside the dial each side shows THREE rows:
 *            caption (top), value (middle), unit (bottom).
 *  - High:   One-row blocks at top and bottom (caption + value + unit).
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniWindDial = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const GU = Helpers.getModule("GaugeUtils").create(def, Helpers);
    const draw = GU.draw;
    const T = GU.text;
    const V = GU.value;

    // --------- util ----------------------------------------------------------
    function formatAngle180(v, leadingZero){
      const n = Number(v); if (!isFinite(n)) return '---';
      let a = ((n + 180) % 360 + 360) % 360 - 180; if (a === 180) a = -180;
      const r = Math.round(Math.abs(a));
      let s = String(r); if (leadingZero) s = s.padStart(3, '0');
      if (a < 0) s = '-' + s;
      return s;
    }

    function formatSpeed(v, unit){
      if (window.avnav && avnav.api && avnav.api.formatter && typeof avnav.api.formatter.formatSpeed === 'function'){
        try { return avnav.api.formatter.formatSpeed(v, unit || 'kn'); } catch(e){}
      }
      const n = Number(v); if (!isFinite(n)) return '---';
      return n.toFixed(1) + ' ' + (unit || 'kn');
    }

    function renderCanvas(canvas, props){
      const { ctx, W, H } = Helpers.setupCanvas(canvas);
      if (!W || !H) return;
      ctx.clearRect(0,0,W,H);

      const family = Helpers.resolveFontFamily(canvas);
      const color  = Helpers.resolveTextColor(canvas);
      ctx.fillStyle = color; ctx.strokeStyle = color;

      // Mode thresholds (owned by WindDial)
      const ratio = W / Math.max(1, H);
      const tN = Number(props.dialRatioThresholdNormal ?? 0.7);
      const tF = Number(props.dialRatioThresholdFlat ?? 2.0);
      let mode; // 'flat'|'normal'|'high'
      if (ratio < tN) mode = 'high';
      else if (ratio > tF) mode = 'flat';
      else mode = 'normal';

      const pad = Math.max(6, Math.floor(Math.min(W,H) * 0.04));

      // Compute maximum dial first; texts must adapt to it.
      const D = Math.min(W - 2*pad, H - 2*pad); // diameter
      const R = Math.max(14, Math.floor(D / 2));
      const cx = Math.floor(W/2);
      const cy = Math.floor(H/2);
      const ringW = Math.max(6, Math.floor(R * 0.12));
      const rOuter = R;
      const tickR  = rOuter;
      const needleDepth = Math.max(8, Math.floor(ringW * 0.9));

      // Strips for flat mode — fill exactly up to dial edge
      const leftStrip   = Math.max(0, Math.floor((W - 2*pad - 2*R) / 2));
      const rightStrip  = leftStrip;
      const topStrip    = Math.max(0, Math.floor((H - 2*pad - 2*R) / 2));
      const bottomStrip = topStrip;

      const g = {
        leftTop: null, leftBottom: null, rightTop: null, rightBottom: null,
        top: null, bottom: null
      };

      if (mode === 'flat'){
        const lh = 2*R;
        const leftX  = pad;
        const rightX = W - pad - rightStrip;
        if (leftStrip > 0){
          g.leftTop     = { x: leftX,  y: cy - R, w: leftStrip,  h: Math.floor(lh/2) };
          g.leftBottom  = { x: leftX,  y: cy,     w: leftStrip,  h: Math.floor(lh/2) };
        }
        if (rightStrip > 0){
          g.rightTop    = { x: rightX, y: cy - R, w: rightStrip, h: Math.floor(lh/2) };
          g.rightBottom = { x: rightX, y: cy,     w: rightStrip, h: Math.floor(lh/2) };
        }
      }
      else if (mode === 'high'){
        const availTop = pad + topStrip;
        const availBot = pad + bottomStrip;
        const th = Math.max(10, Math.floor(availTop * 0.85));
        const bh = Math.max(10, Math.floor(availBot * 0.85));
        g.top    = { x: pad, y: pad,          w: W - 2*pad, h: th };
        g.bottom = { x: pad, y: H - pad - bh, w: W - 2*pad, h: bh };
      }

      // Laylines (symmetric)
      const layEnabled = (props.layEnabled !== false);
      const layMin = V.clamp(props.layMin, 0, 180);
      const layMax = V.clamp(props.layMax, 0, 180);

      // Dial frame & sectors first
      ctx.save();
      // ring
      draw.drawRing(ctx, cx, cy, rOuter, { lineWidth: 1 });

      // sectors (annular)
      if (layEnabled && layMax > layMin){
        draw.drawAnnularSector(ctx, cx, cy, rOuter, {
          startDeg:  layMin,
          endDeg:    layMax,
          thickness: ringW,
          fillStyle: "#82b683",
          alpha: 1
        });
        draw.drawAnnularSector(ctx, cx, cy, rOuter, {
          startDeg: -layMax,
          endDeg:   -layMin,
          thickness: ringW,
          fillStyle: "#ff7a76",
          alpha: 1
        });
      }

      // red wind pointer (tip outward) BEFORE labels so labels stay on top
      if (V.isFiniteNumber(props.angle)) {
        draw.drawPointerAtRim(ctx, cx, cy, rOuter, props.angle, {
          depth: needleDepth,
          color: "#ff2b2b",
          variant: "long",
          sideFactor: 0.25,
          lengthFactor: 2
        });
      }

      // ticks
      draw.drawTicks(ctx, cx, cy, tickR, {
        startDeg: -180, endDeg: 180,
        stepMajor: 30, stepMinor: 10,
        includeEnd: true,
        major: { len: 9, width: 2 },
        minor: { len: 5, width: 1 }
      });

      // labels (skip endpoints)
      const labelInsetVal = Math.max(18, Math.floor(ringW * 1.8));
      draw.drawLabels(ctx, cx, cy, tickR, {
        startDeg: -180, endDeg: 180,
        step: 30,
        includeEnd: true,
        radiusOffset: labelInsetVal,
        fontPx: Math.max(10, Math.floor(R * 0.14)),
        bold: true,
        family,
        labelFormatter: (deg) => String(deg),
        labelFilter: (deg) => deg !== -180 && deg !== 180
      });

      ctx.restore();

      const secScale  = V.clamp(props.captionUnitScale ?? 0.8, 0.3, 3.0);
      const angleUnit = (props.angleUnit || '°').trim();
      const speedUnit = (props.speedUnit || 'kn').trim();
      const angleText = formatAngle180(props.angle, !!props.leadingZero);
      const speedText = formatSpeed(props.speed, speedUnit);
      const angleCap  = (props.angleCaption || '').trim();
      const speedCap  = (props.speedCaption || '').trim();

      // -------- FLAT MODE: maximize side boxes with explicit measure/draw ----
      if (mode === 'flat'){
        if (g.leftBottom && g.leftTop){
          const fitL = T.measureValueUnitFit(ctx, family, angleText, angleUnit, g.leftBottom.w, g.leftBottom.h, secScale);
          T.drawCaptionMax(ctx, family, g.leftTop.x, g.leftTop.y, g.leftTop.w, g.leftTop.h, angleCap, Math.floor(fitL.vPx * secScale), "left");
          T.drawValueUnitWithFit(ctx, family, g.leftBottom.x, g.leftBottom.y, g.leftBottom.w, g.leftBottom.h, angleText, angleUnit, fitL, "left");
        }
        if (g.rightBottom && g.rightTop){
          const fitR = T.measureValueUnitFit(ctx, family, speedText, speedUnit, g.rightBottom.w, g.rightBottom.h, secScale);
          T.drawCaptionMax(ctx, family, g.rightTop.x, g.rightTop.y, g.rightTop.w, g.rightTop.h, speedCap, Math.floor(fitR.vPx * secScale), "right");
          T.drawValueUnitWithFit(ctx, family, g.rightBottom.x, g.rightBottom.y, g.rightBottom.w, g.rightBottom.h, speedText, speedUnit, fitR, "right");
        }
        return;
      }

      // -------- HIGH MODE ----------------------------------------------------
      if (mode === 'high'){
        const capTop = angleCap, valTop = angleText, uniTop = angleUnit;
        const capBot = speedCap, valBot = speedText, uniBot = speedUnit;

        if (g.top) {
          const fitTop = T.fitInlineCapValUnit(ctx, family, capTop, valTop, uniTop, g.top.w, g.top.h, secScale);
          T.drawInlineCapValUnit(ctx, family, g.top.x, g.top.y, g.top.w, g.top.h, capTop, valTop, uniTop, fitTop);
        }
        if (g.bottom) {
          const fitBottom = T.fitInlineCapValUnit(ctx, family, capBot, valBot, uniBot, g.bottom.w, g.bottom.h, secScale);
          T.drawInlineCapValUnit(ctx, family, g.bottom.x, g.bottom.y, g.bottom.w, g.bottom.h, capBot, valBot, uniBot, fitBottom);
        }
        return;
      }

      // -------- NORMAL MODE --------------------------------------------------
      {
        const extra = Math.max(6, Math.floor(R * 0.06));
        const rSafe = Math.max(10, rOuter - (Math.max(18, Math.floor(ringW * 1.8)) + extra));
        if (rSafe < 12) {
          const innerW = Math.floor(rOuter * 1.00);
          const halfW  = Math.max(10, Math.floor(innerW / 2) - Math.max(4, Math.floor(R * 0.035)));
          const maxH   = Math.floor(rOuter * 0.46);
          const xL     = cx - Math.floor(innerW/2);
          const xR     = cx + Math.floor(innerW/2) - halfW;
          const yTop   = cy - Math.floor(maxH/2);

          const hv     = Math.max(12, Math.floor(maxH / (1 + 2*secScale)));
          const hc     = Math.floor(hv * secScale);
          const hu     = Math.floor(hv * secScale);

          const vPxA = T.fitTextPx(ctx, angleText, halfW, hv, family, true);
          const vPxS = T.fitTextPx(ctx, speedText, halfW, hv, family, true);
          const vPx  = Math.min(vPxA, vPxS);
          const cPx  = Math.min(T.fitTextPx(ctx, angleCap, halfW, hc, family, true),
                                T.fitTextPx(ctx, speedCap, halfW, hc, family, true));
          const uPx  = Math.min(T.fitTextPx(ctx, angleUnit, halfW, hu, family, true),
                                T.fitTextPx(ctx, speedUnit, halfW, hu, family, true));
          const sizes = { cPx, vPx, uPx, hCap: hc, hVal: hv, hUnit: hu };
          T.drawThreeRowsBlock(ctx, family, xL, yTop, halfW, maxH, angleCap, angleText, angleUnit, secScale, "right", sizes);
          T.drawThreeRowsBlock(ctx, family, xR, yTop, halfW, maxH, speedCap, speedText, speedUnit, secScale, "left", sizes);
          return;
        }

        const colGap   = Math.max(6, Math.floor(R * 0.05));
        const innerMar = Math.max(4, Math.floor(R * 0.03));

        let best = null;
        const mhMax = Math.floor(2 * (rSafe - innerMar));
        const mhMin = Math.floor(mhMax * 0.45);
        for (let mh = mhMax; mh >= mhMin; mh -= 1){
          const halfDiagY = mh / 2;
          const halfWMax = Math.floor(
            Math.sqrt(Math.max(0, (rSafe - innerMar) * (rSafe - innerMar) - halfDiagY * halfDiagY))
            - Math.floor(colGap / 2)
          );
          if (halfWMax <= 10) continue;

          const hv = Math.max(12, Math.floor(mh / (1 + 2*secScale)));
          const vPxA = T.fitTextPx(ctx, angleText, halfWMax, hv, family, true);
          const vPxS = T.fitTextPx(ctx, speedText, halfWMax, hv, family, true);
          const vPx  = Math.min(vPxA, vPxS);

          const score = vPx * 10000 + halfWMax * 10 + mh;
          if (!best || score > best.score){
            best = { mh, halfW: halfWMax, hv, vPx, score };
          }
        }

        const maxH   = best ? best.mh : Math.floor(rSafe * 0.9);
        const halfW  = best ? best.halfW : Math.floor(rSafe * 0.6);
        const hv     = best ? best.hv : Math.max(12, Math.floor(maxH / (1 + 2*secScale)));
        const hc     = Math.floor(hv * secScale);
        const hu     = Math.floor(hv * secScale);

        const cPx  = Math.min(T.fitTextPx(ctx, angleCap,  halfW, hc, family, true),
                              T.fitTextPx(ctx, speedCap,  halfW, hc, family, true));
        const uPx  = Math.min(T.fitTextPx(ctx, angleUnit, halfW, hu, family, true),
                              T.fitTextPx(ctx, speedUnit, halfW, hu, family, true));
        const vPx  = best ? best.vPx : Math.min(
          T.fitTextPx(ctx, angleText, halfW, hv, family, true),
          T.fitTextPx(ctx, speedText, halfW, hv, family, true)
        );

        const sizes = { cPx, vPx, uPx, hCap: hc, hVal: hv, hUnit: hu };

        const innerW = 2 * halfW + colGap;
        const xL     = cx - Math.floor(innerW/2);
        const xR     = cx + Math.floor(innerW/2) - halfW;
        const yTop   = cy - Math.floor(maxH/2);

        T.drawThreeRowsBlock(ctx, family, xL, yTop, halfW, maxH, angleCap, angleText, angleUnit, secScale, "right", sizes);
        T.drawThreeRowsBlock(ctx, family, xR, yTop, halfW, maxH, speedCap, speedText, speedUnit, secScale, "left", sizes);
      }
    }

    function translateFunction(){ return {}; }

    return {
      id: "WindDial",
      version: "1.8.0",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "WindDial", create };
}))
