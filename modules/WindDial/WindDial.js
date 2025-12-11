/*!
 * WindDial (UMD) — compact dial for AWA/AWS and TWA/TWS
 *
 * Modes:
 *  - Flat:   Angle caption (left top), value+unit (left bottom), dial centered,
 *            Speed caption (right top), value+unit (right bottom).
 *            The dial stays maximal. In flat mode the side boxes now:
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
    const PolarModule = Helpers.getModule('PolarCore');
    const Polar = PolarModule && typeof PolarModule.create === 'function'
      ? PolarModule.create(def, Helpers)
      : undefined;

    // --------- util ----------------------------------------------------------
    function setFont(ctx, px, bold, family){ ctx.font = (bold ? '700 ' : '400 ') + px + 'px ' + family; }
    function clamp(n, lo, hi){ n = Number(n); if (!isFinite(n)) return lo; return Math.max(lo, Math.min(hi, n)); }
    function isFiniteN(n){ return typeof n === 'number' && isFinite(n); }

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

    function toCanvasAngle(deg){
      const d = ((deg - 90) % 360 + 360) % 360;
      return (d * Math.PI) / 180;
    }

    function drawRing(ctx, cx, cy, r, lw){
      ctx.beginPath(); ctx.lineWidth = lw; ctx.arc(cx, cy, r, 0, Math.PI*2, false); ctx.stroke();
    }

    function drawSector(ctx, cx, cy, rOuter, thickness, startDeg, endDeg){
      const a0 = toCanvasAngle(startDeg);
      const a1 = toCanvasAngle(endDeg);
      const rInner = Math.max(1, rOuter - thickness);
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, a0, a1, false);
      ctx.arc(cx, cy, rInner, a1, a0, true);
      ctx.closePath();
      ctx.fill();
    }

    function drawTicksLabels(ctx, cx, cy, r, opts){
      const o = Object.assign({
        stepMajor: 30,
        stepMinor: 10,
        majorLen: 9,
        minorLen: 5,
        labelEvery: 30,
        labelInset: 18,
        fontPx: 11,
        bold: true,
        family: 'sans-serif'
      }, opts || {});
      ctx.save();
      ctx.translate(cx, cy);
      ctx.lineCap = 'butt';

      // minor ticks
      ctx.beginPath(); ctx.lineWidth = 1;
      for (let a=-180; a<=180; a+=o.stepMinor){
        if (a % o.stepMajor === 0) continue;
        const t = toCanvasAngle(a);
        const x1 = Math.cos(t) * (r - o.minorLen);
        const y1 = Math.sin(t) * (r - o.minorLen);
        const x2 = Math.cos(t) * r;
        const y2 = Math.sin(t) * r;
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      }
      ctx.stroke();

      // major ticks
      ctx.beginPath(); ctx.lineWidth = 2;
      for (let a=-180; a<=180; a+=o.stepMajor){
        const t = toCanvasAngle(a);
        const x1 = Math.cos(t) * (r - o.majorLen);
        const y1 = Math.sin(t) * (r - o.majorLen);
        const x2 = Math.cos(t) * r;
        const y2 = Math.sin(t) * r;
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      }
      ctx.stroke();

      // labels
      ctx.font = (o.bold ? '700 ' : '400 ') + o.fontPx + 'px ' + o.family;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let a=-180; a<=180; a+=o.labelEvery){
        if (a === -180 || a === 180) continue;
        const t = toCanvasAngle(a);
        const rr = r - o.labelInset;
        const x = Math.cos(t) * rr;
        const y = Math.sin(t) * rr;
        ctx.fillText(String(a), x, y);
      }

      ctx.restore();
    }

    function fitTextPx(ctx, text, maxW, maxH, family, bold){
      if (!text) return Math.max(6, Math.floor(maxH));
      let px = Math.max(6, Math.floor(maxH));
      setFont(ctx, px, !!bold, family);
      const w = ctx.measureText(text).width;
      if (w <= maxW + 0.1) return px;
      const scale = Math.max(0.1, maxW / Math.max(1, w));
      px = Math.floor(px * scale);
      return Math.max(6, Math.min(px, Math.floor(maxH)));
    }

    // --------- Flat-mode helpers: measure & draw with precedence -------------
    function measureValueUnitFit(ctx, family, value, unit, w, h, secScale){
      if (!value) return { vPx: 0, uPx: 0, gap: 0, total: 0 };
      let lo = 6, hi = Math.max(8, Math.floor(h));
      let best = { vPx: 6, uPx: 6, gap: 6, total: 0 };
      function totalWidth(vp){
        vp = Math.min(vp, h);
        const up = Math.min(Math.floor(Math.max(6, vp * secScale)), h);
        setFont(ctx, vp, true, family); const vW = ctx.measureText(value).width;
        setFont(ctx, up, true, family); const uW = unit ? ctx.measureText(unit).width : 0;
        const g = unit ? Math.max(6, Math.floor(vp * 0.25)) : 0;
        return { w: vW + (unit ? (g + uW) : 0), up, gap: g };
      }
      for (let i=0;i<18;i++){
        const mid = (lo + hi) / 2;
        const test = totalWidth(Math.floor(mid));
        const okW = test.w <= w + 0.5;
        if (okW){ best = { vPx: Math.min(Math.floor(mid), h), uPx: test.up, gap: test.gap, total: test.w }; lo = mid; }
        else hi = mid;
      }
      return best;
    }

    function drawValueUnitWithFit(ctx, family, x, y, w, h, align, value, unit, fit){
      if (w <= 0 || h <= 0 || !value) return;
      const vPx = fit.vPx, uPx = fit.uPx, gap = fit.gap;
      setFont(ctx, vPx, true, family);
      const vW = ctx.measureText(value).width;
      setFont(ctx, uPx, true, family);
      const uW = unit ? ctx.measureText(unit).width : 0;
      const total = vW + (unit ? (gap + uW) : 0);

      let xStart = (align === 'left') ? x : (x + w - total);
      const yVal = y + Math.floor((h - vPx) * 0.5);

      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      setFont(ctx, vPx, true, family);
      ctx.fillText(value, xStart, yVal);
      if (unit){
        setFont(ctx, uPx, true, family);
        ctx.fillText(unit, xStart + vW + gap, yVal + Math.max(0, Math.floor(vPx*0.08)));
      }
    }

    function drawCaptionMax(ctx, family, x, y, w, h, align, caption, capMaxPx){
      if (w <= 0 || h <= 0 || !caption) return;
      let cPx = fitTextPx(ctx, caption, w, h, family, true);
      if (isFinite(capMaxPx)) cPx = Math.min(cPx, capMaxPx);
      setFont(ctx, cPx, true, family);
      ctx.textBaseline = 'top';
      if (align === 'left'){ ctx.textAlign = 'left'; ctx.fillText(caption, x, y); }
      else { ctx.textAlign = 'right'; ctx.fillText(caption, x + w, y); }
    }

    // Draw three stacked rows with shared font sizes (Normal mode helper)
    function drawThreeRowsBlock(ctx, family, x, y, w, h, align, caption, value, unit, sizes){
      const { cPx, vPx, uPx, hCap, hVal, hUnit } = sizes;
      const yCap  = y;
      const yVal  = y + hCap;
      const yUnit = y + hCap + hVal;

      if (caption){
        setFont(ctx, cPx, true, family);
        ctx.textAlign = align; ctx.textBaseline = 'top';
        const xCap = (align === 'left') ? x : (align === 'right' ? x + w : x + Math.floor(w/2));
        ctx.fillText(caption, xCap, yCap);
      }
      if (value){
        setFont(ctx, vPx, true, family);
        ctx.textAlign = align; ctx.textBaseline = 'top';
        const xVal = (align === 'left') ? x : (align === 'right' ? x + w : x + Math.floor(w/2));
        ctx.fillText(value, xVal, yVal);
      }
      if (unit){
        setFont(ctx, uPx, true, family);
        ctx.textAlign = align; ctx.textBaseline = 'top';
        const xUnit = (align === 'left') ? x : (align === 'right' ? x + w : x + Math.floor(w/2));
        ctx.fillText(unit, xUnit, yUnit);
      }
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
      const layMin = clamp(props.layMin, 0, 180);
      const layMax = clamp(props.layMax, 0, 180);

      // Dial frame & sectors first
      ctx.save();
      drawRing(ctx, cx, cy, rOuter, 1);
      ctx.globalAlpha = 1.0; ctx.fillStyle = "#82b683";  // green
      if (layMax > layMin) drawSector(ctx, cx, cy, rOuter, ringW,  layMin,  layMax);
      ctx.fillStyle = "#ff7a76";                           // red
      if (layMax > layMin) drawSector(ctx, cx, cy, rOuter, ringW, -layMax, -layMin);
      ctx.globalAlpha = 1.0; ctx.fillStyle = color;

      // Red wind pointer (tip outward) BEFORE labels so labels stay on top
      if (isFiniteN(props.angle)) { ctx.save(); Polar.drawPointerAtRim(ctx, cx, cy, rOuter, props.angle, { depth: needleDepth, color: "#ff2b2b", variant: "long", sideFactor: 0.25, lengthFactor: 2 }); ctx.restore(); }

      // Ticks + labels AFTER pointer → labels above the red pointer
      const labelInsetVal = Math.max(18, Math.floor(ringW * 1.8));
      drawTicksLabels(ctx, cx, cy, tickR, {
        stepMajor: 30, stepMinor: 10, labelEvery: 30,
        labelInset: labelInsetVal,
        fontPx: Math.max(10, Math.floor(R * 0.14)), bold: true, family
      });

      ctx.restore();

      const secScale  = clamp(props.captionUnitScale ?? 0.8, 0.3, 3.0);
      const angleUnit = (props.angleUnit || '°').trim();
      const speedUnit = (props.speedUnit || 'kn').trim();
      const angleText = formatAngle180(props.angle, !!props.leadingZero);
      const speedText = formatSpeed(props.speed, speedUnit);
      const angleCap  = (props.angleCaption || '').trim();
      const speedCap  = (props.speedCaption || '').trim();

      // -------- FLAT MODE: maximize side boxes with explicit measure/draw ----
      if (mode === 'flat'){
        if (g.leftBottom && g.leftTop){
          const fitL = measureValueUnitFit(ctx, family, angleText, angleUnit, g.leftBottom.w, g.leftBottom.h, secScale);
          drawCaptionMax(ctx, family, g.leftTop.x, g.leftTop.y, g.leftTop.w, g.leftTop.h, 'left', angleCap, Math.floor(fitL.vPx * secScale));
          drawValueUnitWithFit(ctx, family, g.leftBottom.x, g.leftBottom.y, g.leftBottom.w, g.leftBottom.h, 'left', angleText, angleUnit, fitL);
        }
        if (g.rightBottom && g.rightTop){
          const fitR = measureValueUnitFit(ctx, family, speedText, speedUnit, g.rightBottom.w, g.rightBottom.h, secScale);
          drawCaptionMax(ctx, family, g.rightTop.x, g.rightTop.y, g.rightTop.w, g.rightTop.h, 'right', speedCap, Math.floor(fitR.vPx * secScale));
          drawValueUnitWithFit(ctx, family, g.rightBottom.x, g.rightBottom.y, g.rightBottom.w, g.rightBottom.h, 'right', speedText, speedUnit, fitR);
        }
        return;
      }

      // -------- HIGH MODE ----------------------------------------------------
      if (mode === 'high'){
        const capTop = angleCap, valTop = angleText, uniTop = angleUnit;
        const capBot = speedCap, valBot = speedText, uniBot = speedUnit;

        function fitInlineCapValUnit(ctx, cap, val, uni, maxW, maxH, secScale, family){
          if (!val) return { cPx: 0, vPx: 0, uPx: 0, g1: 0, g2: 0 };
          let lo = 6, hi = Math.max(8, Math.floor(maxH)), best = { cPx: 6, vPx: 6, uPx: 6, g1: 6, g2: 6 };
          function widthFor(vp){
            const cp = Math.floor(Math.max(6, vp * secScale));
            const up = Math.floor(Math.max(6, vp * secScale));
            const g  = Math.max(6, Math.floor(vp * 0.25));
            setFont(ctx, cp, true, family); const cW = cap ? ctx.measureText(cap).width : 0;
            setFont(ctx, vp, true, family); const vW = val ? ctx.measureText(val).width : 0;
            setFont(ctx, up, true, family); const uW = uni ? ctx.measureText(uni).width : 0;
            const g1 = cap ? g : 0, g2 = uni ? g : 0;
            return { cp, vp, up, width: cW + (cap?g1:0) + vW + (uni?g2:0) + (uni?uW:0), g1, g2 };
          }
          for (let i=0;i<16;i++){
            const mid = (lo + hi) / 2;
            const test = widthFor(Math.floor(mid));
            const okW = test.width <= maxW + 0.5;
            const okH = test.vp <= maxH && test.cp <= maxH && test.up <= maxH;
            if (okW && okH){ best = { cPx: test.cp, vPx: test.vp, uPx: test.up, g1: test.g1, g2: test.g2 }; lo = mid; }
            else { hi = mid; }
          }
          return best;
        }
        function drawInline(x, y, w, h, cap, val, uni, align){
          const fit = fitInlineCapValUnit(ctx, cap, val, uni, w, h, secScale, family);
          const total = (() => {
            setFont(ctx, fit.cPx, true, family); const cW = cap ? ctx.measureText(cap).width : 0;
            setFont(ctx, fit.vPx, true, family); const vW = val ? ctx.measureText(val).width : 0;
            setFont(ctx, fit.uPx, true, family); const uW = uni ? ctx.measureText(uni).width : 0;
            return cW + (cap?fit.g1:0) + vW + (uni?fit.g2:0) + (uni?uW:0);
          })();
          let xStart = x + Math.floor((w - total)/2);
          const yMid = y + Math.floor(h/2);

          if (cap){
            setFont(ctx, fit.cPx, true, family); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText(cap, xStart, yMid);
            xStart += Math.floor(ctx.measureText(cap).width + fit.g1);
          }
          setFont(ctx, fit.vPx, true, family); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(val, xStart, yMid);
          xStart += Math.floor(ctx.measureText(val).width);
          if (uni){
            xStart += fit.g2;
            setFont(ctx, fit.uPx, true, family);
            ctx.fillText(uni, xStart, yMid);
          }
        }

        if (g.top)    drawInline(g.top.x,    g.top.y,    g.top.w,    g.top.h,    capTop, valTop, uniTop, 'left');
        if (g.bottom) drawInline(g.bottom.x, g.bottom.y, g.bottom.w, g.bottom.h, capBot, valBot, uniBot, 'right');
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

          const vPxA = fitTextPx(ctx, angleText, halfW, hv, family, true);
          const vPxS = fitTextPx(ctx, speedText, halfW, hv, family, true);
          const vPx  = Math.min(vPxA, vPxS);
          const cPx  = Math.min(fitTextPx(ctx, angleCap, halfW, hc, family, true),
                                fitTextPx(ctx, speedCap, halfW, hc, family, true));
          const uPx  = Math.min(fitTextPx(ctx, angleUnit, halfW, hu, family, true),
                                fitTextPx(ctx, speedUnit, halfW, hu, family, true));
          const sizes = { cPx, vPx, uPx, hCap: hc, hVal: hv, hUnit: hu };
          drawThreeRowsBlock(ctx, family, xL, yTop, halfW, maxH, 'right', angleCap, angleText, angleUnit, sizes);
          drawThreeRowsBlock(ctx, family, xR, yTop, halfW, maxH, 'left',  speedCap, speedText, speedUnit, sizes);
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
          const vPxA = fitTextPx(ctx, angleText, halfWMax, hv, family, true);
          const vPxS = fitTextPx(ctx, speedText, halfWMax, hv, family, true);
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

        const cPx  = Math.min(fitTextPx(ctx, angleCap,  halfW, hc, family, true),
                              fitTextPx(ctx, speedCap,  halfW, hc, family, true));
        const uPx  = Math.min(fitTextPx(ctx, angleUnit, halfW, hu, family, true),
                              fitTextPx(ctx, speedUnit, halfW, hu, family, true));
        const vPx  = best ? best.vPx : Math.min(
          fitTextPx(ctx, angleText, halfW, hv, family, true),
          fitTextPx(ctx, speedText, halfW, hv, family, true)
        );

        const sizes = { cPx, vPx, uPx, hCap: hc, hVal: hv, hUnit: hu };

        const innerW = 2 * halfW + colGap;
        const xL     = cx - Math.floor(innerW/2);
        const xR     = cx + Math.floor(innerW/2) - halfW;
        const yTop   = cy - Math.floor(maxH/2);

        drawThreeRowsBlock(ctx, family, xL, yTop, halfW, maxH, 'right', angleCap, angleText, angleUnit, sizes);
        drawThreeRowsBlock(ctx, family, xR, yTop, halfW, maxH, 'left',  speedCap,  speedText,  speedUnit, sizes);
      }
    }

    function translateFunction(){ return {}; }

    return {
      id: "WindDial",
      version: "1.7.3",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "WindDial", create };
}))
