/*!
 * CompassGauge (UMD) — rotating compass card with upright cardinal labels
 *
 * Updated: uses GaugeUtils.draw shared primitives instead of PolarCore.
 *
 * Visual:
 *  - The disc (ticks + cardinal/intercardinal letters) rotates by -heading.
 *  - Cardinal letters are always upright.
 *  - Optional target marker (e.g. BRG/route course) at the rim.
 *
 * Modes (own thresholds):
 *  - Flat:   Left column split into top (Caption) and bottom (Value+Unit) boxes.
 *            Value+Unit are maximized to the dial edge; then Caption is maximized
 *            within its box and additionally capped at (ValuePx * captionUnitScale)
 *            to keep the visual relation. Dial stays maximal.
 *  - Normal: Single three-row block (caption/value/unit) centered inside the safe
 *            circle and center-aligned.
 *  - High:   One inline row above the dial: Caption • Value • Unit — centered,
 *            measured with a binary search so all 3 fit height and width.
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniCompassGauge = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const gaugeUtilsModule = Helpers.getModule("GaugeUtils");
    const GU = gaugeUtilsModule && typeof gaugeUtilsModule.create === "function"
      ? gaugeUtilsModule.create(def, Helpers)
      : null;
    const draw = GU && GU.draw;

    // ---------- utils --------------------------------------------------------
    function setFont(ctx, px, bold, family){ ctx.font = (bold ? '700 ' : '400 ') + px + 'px ' + family; }
    function clamp(n, lo, hi){ n = Number(n); if (!isFinite(n)) return lo; return Math.max(lo, Math.min(hi, n)); }
    function isFiniteN(n){ return typeof n === 'number' && isFinite(n); }

    function formatDirection360(v, leadingZero){
      const n = Number(v); if (!isFinite(n)) return '---';
      let a = n % 360; if (a < 0) a += 360;
      const r = Math.round(a) % 360;
      let s = String(r);
      if (leadingZero) s = s.padStart(3, '0');
      return s;
    }

    function drawDisconnectOverlay(ctx, W, H, family, color){
      ctx.save();
      ctx.globalAlpha = 0.20;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      const px = Math.max(12, Math.floor(Math.min(W, H) * 0.18));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      setFont(ctx, px, true, family);
      ctx.fillText('NO DATA', Math.floor(W/2), Math.floor(H/2));
      ctx.restore();
    }

    function fitTextPx(ctx, text, maxW, maxH, family, bold){
      if (!text) return Math.max(6, Math.floor(maxH));
      let px = Math.max(6, Math.floor(maxH));
      setFont(ctx, px, !!bold, family);
      const w = ctx.measureText(text).width;
      if (w <= maxW + 0.5) return px;
      const scale = Math.max(0.1, maxW / Math.max(1, w));
      px = Math.floor(px * scale);
      return Math.max(6, Math.min(px, Math.floor(maxH)));
    }

    // --------- Flat-mode helpers (Value/Unit first, Caption capped to relation)
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

    function drawCaptionMax(ctx, family, x, y, w, h, caption, capMaxPx){
      if (w <= 0 || h <= 0 || !caption) return;
      let cPx = fitTextPx(ctx, caption, w, h, family, true);
      if (isFinite(capMaxPx)) cPx = Math.min(cPx, capMaxPx);
      setFont(ctx, cPx, true, family);
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(caption, x, y);
    }

    // --------- One-line inline fitter: Caption • Value • Unit ---------------
    function fitInlineCapValUnit(ctx, family, caption, value, unit, maxW, maxH, secScale){
      if (!value) return { cPx: 0, vPx: 0, uPx: 0, g1: 0, g2: 0, total: 0 };
      let lo = 6, hi = Math.max(8, Math.floor(maxH));
      let best = { cPx: 6, vPx: 6, uPx: 6, g1: 6, g2: 6, total: 0 };
      function widthFor(vp){
        vp = Math.min(vp, maxH);
        const cp = Math.min(Math.floor(Math.max(6, vp * secScale)), maxH);
        const up = Math.min(Math.floor(Math.max(6, vp * secScale)), maxH);
        const gap = Math.max(6, Math.floor(vp * 0.25));
        setFont(ctx, cp, true, family); const cW = caption ? ctx.measureText(caption).width : 0;
        setFont(ctx, vp, true, family); const vW = ctx.measureText(value).width;
        setFont(ctx, up, true, family); const uW = unit ? ctx.measureText(unit).width : 0;
        const g1 = caption ? gap : 0;
        const g2 = unit ? gap : 0;
        return { cp, vp, up, width: cW + g1 + vW + g2 + (unit ? uW : 0), g1, g2 };
      }
      for (let i=0;i<18;i++){
        const mid = (lo + hi) / 2;
        const t = widthFor(Math.floor(mid));
        const okW = t.width <= maxW + 0.5;
        const okH = t.cp <= maxH && t.vp <= maxH && t.up <= maxH;
        if (okW && okH){
          best = { cPx: t.cp, vPx: t.vp, uPx: t.up, g1: t.g1, g2: t.g2, total: t.width };
          lo = mid;
        }
        else hi = mid;
      }
      return best;
    }

    // --------- Three-row block helper (center/left/right) -------------------
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

      const heading = Number(props.heading);
      const marker  = Number(props.markerCourse);
      const leadingZero = !!props.leadingZero;

      const ratio = W / Math.max(1, H);
      const tN = Number(props.compRatioThresholdNormal ?? 0.8);
      const tF = Number(props.compRatioThresholdFlat   ?? 2.2);
      let mode; // 'flat'|'normal'|'high'
      if (ratio < tN) mode = 'high';
      else if (ratio > tF) mode = 'flat';
      else mode = 'normal';

      const pad = Math.max(6, Math.floor(Math.min(W,H) * 0.04));

      // Dial geometry (maximal)
      const D = Math.min(W - 2*pad, H - 2*pad);
      const R = Math.max(14, Math.floor(D / 2));
      const cx = Math.floor(W/2);
      const cy = Math.floor(H/2);
      const ringW = Math.max(6, Math.floor(R * 0.12));
      const rOuter = R;
      const lubber = Math.max(10, Math.floor(ringW * 0.9));

      // Left/right/top/bottom strips for flat/high placement
      const leftStrip   = Math.max(0, Math.floor((W - 2*pad - 2*R) / 2));
      const rightStrip  = leftStrip;
      const topStrip    = Math.max(0, Math.floor((H - 2*pad - 2*R) / 2));

      // ---- Dial: rotated ticks + upright labels layering with pointer -------
      if (draw){
        const rotationDeg = isFiniteN(heading) ? -heading : 0;

        // Frame (ring + ticks)
        draw.drawRing(ctx, cx, cy, rOuter, { lineWidth: 1 });

        draw.drawTicks(ctx, cx, cy, rOuter, {
          rotationDeg,
          startDeg: 0, endDeg: 360,
          stepMajor: 30, stepMinor: 10,
          major: { len: 9, width: 2 },
          minor: { len: 5, width: 1 }
        });

        // Fixed red lubber pointer at 0° (north), behind labels
        draw.drawPointerAtRim(ctx, cx, cy, rOuter, 0, {
          depth: lubber,
          color: "#ff2b2b",
          variant: "long",
          sideFactor: 0.25,
          lengthFactor: 2
        });

        // Optional target marker (bearing/course) relative to rotating card: (marker - heading)
        if (isFiniteN(marker) && isFiniteN(heading)){
          draw.drawRimMarker(ctx, cx, cy, rOuter, (marker - heading), {
            len: Math.max(12, Math.floor(ringW * 0.9)),
            width: Math.max(3, Math.floor(ringW * 0.40))
          });
        }

        // Labels last → always readable above pointer/marker.
        // Because we pass rotationDeg, label positions rotate with the card,
        // but the text remains upright (default).
        const labels = { 0:"N",45:"NE",90:"E",135:"SE",180:"S",225:"SW",270:"W",315:"NW" };
        const labelPx = Math.max(10, Math.floor(R * 0.16));
        draw.drawLabels(ctx, cx, cy, rOuter, {
          rotationDeg,
          startDeg: 0, endDeg: 360,
          step: 45,
          radiusOffset: Math.max(16, Math.floor(ringW * 1.6)),
          fontPx: labelPx,
          bold: true,
          family,
          labelsMap: labels,
          labelFormatter: (deg) => String(deg),
          textRotation: "upright"
        });
      }

      // ---- Texts -------------------------------------------------------------
      const caption = (props.caption || '').trim();
      const unit    = (props.unit || '°').trim();
      const value   = isFiniteN(heading) ? formatDirection360(heading, leadingZero) : (props.default || '---');
      const secScale = clamp(props.captionUnitScale ?? 0.8, 0.3, 3.0);

      // FLAT: left column next to dial
      if (mode === 'flat'){
        if (leftStrip > 0){
          const lh = 2*R;
          const leftX  = pad;
          const topBox    = { x: leftX,  y: cy - R, w: leftStrip,  h: Math.floor(lh/2) };
          const bottomBox = { x: leftX,  y: cy,     w: leftStrip,  h: Math.floor(lh/2) };

          const fit = measureValueUnitFit(ctx, family, value, unit, bottomBox.w, bottomBox.h, secScale);
          drawCaptionMax(ctx, family, topBox.x, topBox.y, topBox.w, topBox.h, caption, Math.floor(fit.vPx * secScale));

          (function drawValueUnit(){
            const vPx = fit.vPx, uPx = fit.uPx;
            setFont(ctx, vPx, true, family); const vW = ctx.measureText(value).width;
            const xStart = bottomBox.x;
            const yBase = bottomBox.y + Math.floor((bottomBox.h - vPx)/2);
            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            setFont(ctx, vPx, true, family); ctx.fillText(value, xStart, yBase);
            if (unit){
              setFont(ctx, uPx, true, family);
              ctx.fillText(unit, xStart + vW + fit.gap, yBase + Math.max(0, Math.floor(vPx*0.08)));
            }
          })();
        }
        if (props.disconnect) drawDisconnectOverlay(ctx, W, H, family, color);
        return;
      }

      // HIGH: one inline row (Caption • Value • Unit), centered above the dial
      if (mode === 'high'){
        const th = Math.max(10, Math.floor((pad + topStrip) * 0.9));
        const band = { x: pad, y: pad, w: W - 2*pad, h: th };

        const fit = fitInlineCapValUnit(ctx, family, caption, value, unit, band.w, band.h, secScale);

        const total = (function(){
          setFont(ctx, fit.cPx, true, family); const cW = caption ? ctx.measureText(caption).width : 0;
          setFont(ctx, fit.vPx, true, family); const vW = ctx.measureText(value).width;
          setFont(ctx, fit.uPx, true, family); const uW = unit ? ctx.measureText(unit).width : 0;
          return cW + (caption ? fit.g1 : 0) + vW + (unit ? fit.g2 + uW : 0);
        })();

        let xStart = band.x + Math.floor((band.w - total) / 2);
        const yMid = band.y + Math.floor(band.h / 2);

        ctx.textBaseline = 'middle'; ctx.textAlign = 'left';

        if (caption){
          setFont(ctx, fit.cPx, true, family);
          ctx.fillText(caption, xStart, yMid);
          xStart += Math.floor(ctx.measureText(caption).width + fit.g1);
        }

        setFont(ctx, fit.vPx, true, family);
        ctx.fillText(value, xStart, yMid);
        xStart += Math.floor(ctx.measureText(value).width);

        if (unit){
          xStart += fit.g2;
          setFont(ctx, fit.uPx, true, family);
          ctx.fillText(unit, xStart, yMid);
        }

        if (props.disconnect) drawDisconnectOverlay(ctx, W, H, family, color);
        return;
      }

      // NORMAL: centered three-row block inside the safe circle
      {
        const labelInsetVal = Math.max(18, Math.floor(ringW * 1.8));
        const extra = Math.max(6, Math.floor(R * 0.06));
        const rSafe = Math.max(10, rOuter - (labelInsetVal + extra));

        if (rSafe < 12) {
          const th = Math.max(10, Math.floor((pad + topStrip) * 0.9));
          const fit = measureValueUnitFit(ctx, family, value, unit, (W - 2*pad), th, secScale);
          const total = (function(){
            setFont(ctx, fit.vPx, true, family); const vW = ctx.measureText(value).width;
            setFont(ctx, fit.uPx, true, family); const uW = unit ? ctx.measureText(unit).width : 0;
            return vW + (unit ? fit.gap + uW : 0);
          })();
          let xStart = pad + Math.floor(((W - 2*pad) - total)/2);
          const yBase = pad + Math.floor((th - fit.vPx)/2);
          ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          setFont(ctx, fit.vPx, true, family); ctx.fillText(value, xStart, yBase);
          if (unit){
            setFont(ctx, fit.uPx, true, family);
            ctx.fillText(unit, xStart + ctx.measureText(value).width + fit.gap, yBase + Math.max(0, Math.floor(fit.vPx*0.08)));
          }
          if (props.disconnect) drawDisconnectOverlay(ctx, W, H, family, color);
          return;
        }

        const innerMar = Math.max(4, Math.floor(R * 0.03));

        let best = null;
        const rEff = rSafe - innerMar;
        const mhMax = Math.floor(2 * rEff);
        const mhMin = Math.floor(mhMax * 0.45);
        for (let mh = mhMax; mh >= mhMin; mh--){
          const halfDiagY = mh / 2;
          const halfWMax = Math.floor(Math.sqrt(Math.max(0, rEff * rEff - halfDiagY * halfDiagY)));
          const boxW = Math.max(10, 2 * halfWMax);
          if (boxW <= 10) continue;

          const hv = Math.max(12, Math.floor(mh / (1 + 2*secScale)));
          const vPx = fitTextPx(ctx, value, boxW, hv, family, true);
          const score = vPx * 10000 + boxW * 10 + mh;
          if (!best || score > best.score){
            best = { mh, boxW, hv, vPx, score };
          }
        }

        const maxH = best ? best.mh : Math.floor(rEff * 0.9);
        const boxW = best ? best.boxW : Math.floor(rEff * 1.6);
        const hv   = best ? best.hv   : Math.max(12, Math.floor(maxH / (1 + 2*secScale)));
        const hc   = Math.floor(hv * secScale);
        const hu   = Math.floor(hv * secScale);

        const cPx  = fitTextPx(ctx, caption, boxW, hc, family, true);
        const uPx  = fitTextPx(ctx, unit,    boxW, hu, family, true);
        const vPx  = best ? best.vPx : fitTextPx(ctx, value, boxW, hv, family, true);

        const sizes = { cPx, vPx, uPx, hCap: hc, hVal: hv, hUnit: hu };

        const xBox  = cx - Math.floor(boxW / 2);
        const yTop  = cy - Math.floor(maxH / 2);

        // Center-aligned text in a centered box
        drawThreeRowsBlock(ctx, family, xBox, yTop, boxW, maxH, 'center', caption, value, unit, sizes);

        if (props.disconnect) drawDisconnectOverlay(ctx, W, H, family, color);
      }
    }

    function translateFunction(){ return {}; }

    return {
      id: "CompassGauge",
      version: "1.2.0",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "CompassGauge", create };
}));
