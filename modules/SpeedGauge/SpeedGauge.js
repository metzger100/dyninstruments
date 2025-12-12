/*!
 * SpeedGauge (UMD) — n-shaped semicircle speedometer with warning/alarm sectors
 *
 * This revision:
 *  - Arc is FIXED (no editor options):
 *      startAngleDeg = 270
 *      endAngleDeg   = 450
 *  - Sectors "to" values are FIXED (no editor options):
 *      warningTo = alarmFrom (if valid and > warningFrom) else maxValue
 *      alarmTo   = maxValue
 *  - Gauge size/position are fixed:
 *      gauge always uses maximal available size and is centered; text scales down.
 *  - Pointer uses the SAME numeric value that is displayed (unit-aware via avnav formatter).
 *
 * Props:
 *  - value (or speed): raw speed
 *  - caption, unit
 *  - minValue, maxValue (DISPLAY units, e.g. kn)
 *  - tickMajor, tickMinor (DISPLAY units)
 *  - warningFrom, alarmFrom (DISPLAY units)
 *  - showEndLabels (bool)
 *  - speedRatioThresholdNormal, speedRatioThresholdFlat, captionUnitScale
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniSpeedGauge = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const IC = Helpers.getModule('InstrumentComponents') && Helpers.getModule('InstrumentComponents').create();

    // ---------- utils --------------------------------------------------------
    function setFont(ctx, px, bold, family){ ctx.font = (bold ? '700 ' : '400 ') + px + 'px ' + family; }
    function clamp(n, lo, hi){ n = Number(n); if (!isFinite(n)) return lo; return Math.max(lo, Math.min(hi, n)); }
    function isFiniteN(n){ return typeof n === 'number' && isFinite(n); }

    function deg2rad(d){ return (d * Math.PI) / 180; }
    // 0° at North (up), clockwise positive; supports >360
    function toCanvasAngleRad(deg){ return deg2rad(Number(deg) - 90); }

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

    function niceTickSteps(range){
      if (!isFinite(range) || range <= 0) return { major: 10, minor: 2 };
      if (range <= 6)   return { major: 1,  minor: 0.5 };
      if (range <= 12)  return { major: 2,  minor: 1 };
      if (range <= 30)  return { major: 5,  minor: 1 };
      if (range <= 60)  return { major: 10, minor: 2 };
      if (range <= 120) return { major: 20, minor: 5 };
      return { major: 50, minor: 10 };
    }

    function almostInt(x, eps){ return Math.abs(x - Math.round(x)) <= (eps || 1e-6); }

    // --- Speed formatting / conversion --------------------------------------
    function formatSpeedString(raw, unit){
      const n = Number(raw);
      if (!isFinite(n)) return '---';
      if (window.avnav && avnav.api && avnav.api.formatter && typeof avnav.api.formatter.formatSpeed === 'function'){
        try { return String(avnav.api.formatter.formatSpeed(n, unit || 'kn')); } catch(e){}
      }
      return n.toFixed(1) + ' ' + (unit || 'kn');
    }

    function extractNumberText(s){
      const m = String(s).match(/-?\d+(?:\.\d+)?/);
      return m ? m[0] : '';
    }

    function displaySpeedFromRaw(raw, unit){
      // { num, text } where num matches text; num is in DISPLAY units
      const s = formatSpeedString(raw, unit);
      const t = extractNumberText(s);
      const num = t ? Number(t) : NaN;
      if (isFinite(num)) return { num, text: t };
      const n = Number(raw);
      if (isFinite(n)) return { num: n, text: n.toFixed(1) };
      return { num: NaN, text: '---' };
    }

    // --- Drawing primitives (WindDial-like style) ----------------------------
    function drawArcRing(ctx, cx, cy, r, startDeg, endDeg, lineWidth){
      ctx.save();
      ctx.lineWidth = lineWidth || 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, toCanvasAngleRad(startDeg), toCanvasAngleRad(endDeg), false);
      ctx.stroke();
      ctx.restore();
    }

    function drawAnnularSector(ctx, cx, cy, rOuter, thickness, startDeg, endDeg, fillStyle){
      const rInner = Math.max(1, rOuter - thickness);
      ctx.save();
      ctx.fillStyle = fillStyle;
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, toCanvasAngleRad(startDeg), toCanvasAngleRad(endDeg), false);
      ctx.arc(cx, cy, rInner, toCanvasAngleRad(endDeg), toCanvasAngleRad(startDeg), true);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawTicksFromAngles(ctx, cx, cy, r, majorsDeg, minorsDeg, majorStyle, minorStyle){
      const maj = Object.assign({ len: 9, width: 2 }, majorStyle || {});
      const min = Object.assign({ len: 5, width: 1 }, minorStyle || {});
      ctx.save();
      ctx.translate(cx, cy);
      ctx.lineCap = 'butt';

      ctx.beginPath();
      ctx.lineWidth = min.width;
      for (let i=0;i<minorsDeg.length;i++){
        const a = toCanvasAngleRad(minorsDeg[i]);
        const x1 = Math.cos(a) * (r - min.len);
        const y1 = Math.sin(a) * (r - min.len);
        const x2 = Math.cos(a) * r;
        const y2 = Math.sin(a) * r;
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.lineWidth = maj.width;
      for (let i=0;i<majorsDeg.length;i++){
        const a = toCanvasAngleRad(majorsDeg[i]);
        const x1 = Math.cos(a) * (r - maj.len);
        const y1 = Math.sin(a) * (r - maj.len);
        const x2 = Math.cos(a) * r;
        const y2 = Math.sin(a) * r;
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      }
      ctx.stroke();

      ctx.restore();
    }

    function drawLabelsForMajorValues(ctx, cx, cy, r, family, fontPx, labelInset, minV, maxV, majorStep, arc, showEndLabels){
      if (!isFinite(minV) || !isFinite(maxV) || maxV <= minV) return;
      majorStep = Math.abs(Number(majorStep));
      if (!isFinite(majorStep) || majorStep <= 0) return;

      const s = arc.startDeg, e = arc.endDeg;
      const rr = Math.max(1, r - labelInset);

      ctx.save();
      ctx.font = '700 ' + fontPx + 'px ' + family;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const count = Math.max(1, Math.round((maxV - minV) / majorStep));
      for (let i=0;i<=count;i++){
        let v = minV + i * majorStep;
        if (v > maxV) v = maxV;

        if (!showEndLabels && (i === 0 || v === maxV)) {
          if (v === maxV) break;
          continue;
        }

        const aDeg = s + (e - s) * ((v - minV) / (maxV - minV));
        const a = toCanvasAngleRad(aDeg);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;

        const label = almostInt(v, 1e-6) ? String(Math.round(v)) : String(v);
        ctx.fillText(label, x, y);

        if (v === maxV) break;
      }

      ctx.restore();
    }

    function buildValueTickAngles(minV, maxV, majorStep, minorStep, arc){
      const majors = [], minors = [];
      const s = arc.startDeg, e = arc.endDeg;

      if (!isFinite(minV) || !isFinite(maxV) || maxV <= minV) return { majors, minors };
      minorStep = Math.abs(Number(minorStep));
      majorStep = Math.abs(Number(majorStep));
      if (!isFinite(minorStep) || minorStep <= 0) minorStep = (maxV - minV) / 20;
      if (!isFinite(majorStep) || majorStep <= 0) majorStep = minorStep * 5;

      const steps = Math.max(1, Math.round((maxV - minV) / minorStep));
      for (let i=0;i<=steps;i++){
        let v = minV + i * minorStep;
        if (v > maxV) v = maxV;

        const rel = (v - minV) / majorStep;
        const isMajor = almostInt(rel, 1e-4);

        const aDeg = s + (e - s) * ((v - minV) / (maxV - minV));
        (isMajor ? majors : minors).push(aDeg);

        if (v === maxV) break;
      }

      if (!majors.length || Math.abs(majors[0] - s) > 1e-6) majors.unshift(s);
      if (Math.abs(majors[majors.length - 1] - e) > 1e-6) majors.push(e);

      return { majors, minors };
    }

    function sectorAngles(from, to, minV, maxV, arc){
      const f = Number(from);
      const t = Number(to);
      if (!isFinite(f) || !isFinite(t)) return null;

      const ff = Math.max(minV, Math.min(maxV, f));
      const tt = Math.max(minV, Math.min(maxV, t));

      if (Math.abs(tt - ff) < 1e-9) return null;

      let a0 = arc.startDeg + (arc.endDeg - arc.startDeg) * ((ff - minV) / (maxV - minV));
      let a1 = arc.startDeg + (arc.endDeg - arc.startDeg) * ((tt - minV) / (maxV - minV));
      if (a1 < a0) { const tmp = a0; a0 = a1; a1 = tmp; }
      if (Math.abs(a1 - a0) < 1e-6) return null;
      return { a0, a1 };
    }

    // --- Text layout helpers -------------------------------------------------
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

    function drawValueUnitWithFit(ctx, family, x, y, w, h, value, unit, fit){
      if (w <= 0 || h <= 0 || !value) return;
      const vPx = fit.vPx, uPx = fit.uPx, gap = fit.gap;
      setFont(ctx, vPx, true, family);
      const vW = ctx.measureText(value).width;

      const yVal = y + Math.floor((h - vPx) * 0.5);

      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      setFont(ctx, vPx, true, family);
      ctx.fillText(value, x, yVal);
      if (unit){
        setFont(ctx, uPx, true, family);
        ctx.fillText(unit, x + vW + gap, yVal + Math.max(0, Math.floor(vPx*0.08)));
      }
    }

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
        } else hi = mid;
      }
      return best;
    }

    function drawThreeRowsBlock(ctx, family, x, y, w, h, caption, value, unit, secScale){
      const hv = Math.max(10, Math.floor(h / (1 + 2*secScale)));
      const hc = Math.max(8,  Math.floor(hv * secScale));
      const hu = Math.max(8,  Math.floor(hv * secScale));

      const cPx = fitTextPx(ctx, caption, w, hc, family, true);
      const vPx = fitTextPx(ctx, value,   w, hv, family, true);
      const uPx = fitTextPx(ctx, unit,    w, hu, family, true);

      const yCap = y;
      const yVal = y + hc;
      const yUni = y + hc + hv;

      ctx.textAlign = 'center'; ctx.textBaseline = 'top';

      if (caption){
        setFont(ctx, cPx, true, family);
        ctx.fillText(caption, x + Math.floor(w/2), yCap);
      }
      if (value){
        setFont(ctx, vPx, true, family);
        ctx.fillText(value, x + Math.floor(w/2), yVal);
      }
      if (unit){
        setFont(ctx, uPx, true, family);
        ctx.fillText(unit, x + Math.floor(w/2), yUni);
      }
    }

    // PointerAtRim
    function drawPointerAtRimFallback(ctx, cx, cy, rOuter, angleDeg, opts){
      const o = Object.assign({
        depth: Math.max(8, Math.floor(rOuter * 0.10)),
        color: "#ff2b2b",
        rotationDeg: 0,
        alpha: 1,
        variant: "normal",
        sideFactor: undefined,
        lengthFactor: undefined
      }, opts || {});

      let depth = Math.max(2, Math.floor(o.depth));
      if (o.variant === "long") depth = Math.floor(depth * 1.4);
      if (isFinite(o.lengthFactor)) depth = Math.floor(depth * o.lengthFactor);

      const sideF = (typeof o.sideFactor === "number")
        ? o.sideFactor
        : (o.variant === "long" ? 0.80 : 0.65);
      const side = Math.max(4, Math.floor(depth * sideF));

      const a = toCanvasAngleRad(angleDeg + (o.rotationDeg || 0));
      const rBase = Math.max(1, rOuter - depth);
      const rTip  = Math.max(1, rOuter - 2);

      const tipX = cx + Math.cos(a) * rTip;
      const tipY = cy + Math.sin(a) * rTip;

      const baseX = cx + Math.cos(a) * rBase;
      const baseY = cy + Math.sin(a) * rBase;

      const n = Math.atan2(tipY - baseY, tipX - baseX);
      const l = n + Math.PI / 2;
      const r = n - Math.PI / 2;

      ctx.save();
      ctx.globalAlpha = (typeof o.alpha === "number") ? o.alpha : 1;
      ctx.fillStyle = o.color;

      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(baseX + Math.cos(l) * side, baseY + Math.sin(l) * side);
      ctx.lineTo(baseX + Math.cos(r) * side, baseY + Math.sin(r) * side);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    const drawPointerAtRim = (IC && typeof IC.drawPointerAtRim === 'function')
      ? function(ctx, cx, cy, rOuter, angleDeg, opts){ return IC.drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts); }
      : drawPointerAtRimFallback;

    // ------------------------------------------------------------------------
    function renderCanvas(canvas, props){
      const { ctx, W, H } = Helpers.setupCanvas(canvas);
      if (!W || !H) return;

      ctx.clearRect(0,0,W,H);
      const family = Helpers.resolveFontFamily(canvas);
      const color  = Helpers.resolveTextColor(canvas);
      ctx.fillStyle = color; ctx.strokeStyle = color;

      const pad = Math.max(6, Math.floor(Math.min(W,H) * 0.04));
      const gap = Math.max(6, Math.floor(Math.min(W,H) * 0.03));

      const availW = Math.max(1, W - 2*pad);
      const availH = Math.max(1, H - 2*pad);

      // Mode thresholds
      const ratio = W / Math.max(1, H);
      const tN = Number(props.speedRatioThresholdNormal ?? 1.1);
      const tF = Number(props.speedRatioThresholdFlat   ?? 3.5);
      let mode; // 'flat'|'normal'|'high'
      if (ratio < tN) mode = 'high';
      else if (ratio > tF) mode = 'flat';
      else mode = 'normal';

      // Caption/unit
      const caption = (props.caption || '').trim();
      const unit    = (props.unit || 'kn').trim();

      // Speed conversion (raw -> display num/text)
      const raw = (typeof props.value !== 'undefined') ? props.value : props.speed;
      const disp = displaySpeedFromRaw(raw, unit);
      const valueText = (disp.text && disp.text.trim()) ? disp.text.trim() : (props.default || '---');
      const valueNum  = isFiniteN(disp.num) ? disp.num : NaN;

      // Range (DISPLAY units)
      let minV = Number(props.minValue ?? 0);
      let maxV = Number(props.maxValue ?? 30);
      if (!isFinite(minV)) minV = 0;
      if (!isFinite(maxV)) maxV = minV + 1;
      if (maxV <= minV) maxV = minV + 1;

      const range = maxV - minV;
      const nice = niceTickSteps(range);
      const tickMajor = Number(props.tickMajor ?? nice.major);
      const tickMinor = Number(props.tickMinor ?? nice.minor);

      const secScale = clamp(props.captionUnitScale ?? 0.8, 0.3, 3.0);

      // FIXED ARC
      const arc = { startDeg: 270, endDeg: 450 };

      // --- Gauge geometry: ALWAYS maximal + centered -------------------------
      const R = Math.max(14, Math.min(Math.floor(availW / 2), Math.floor(availH)));
      const gaugeLeft = pad + Math.floor((availW - 2*R) / 2);
      const gaugeTop  = pad + Math.floor((availH - R) / 2);
      const cx = gaugeLeft + R;
      const cy = gaugeTop + R;

      const rOuter = R;
      const ringW  = Math.max(6, Math.floor(R * 0.12));
      const needleDepth = Math.max(8, Math.floor(ringW * 0.9));

      // Pointer angle (DISPLAY number)
      const vClamped = isFiniteN(valueNum) ? Math.max(minV, Math.min(maxV, valueNum)) : NaN;
      const aNow = isFiniteN(vClamped)
        ? (arc.startDeg + (arc.endDeg - arc.startDeg) * ((vClamped - minV) / (maxV - minV)))
        : NaN;

      // --- Sectors with FIXED "to" rules ------------------------------------
      const warningFrom = Number(props.warningFrom);
      const alarmFrom   = Number(props.alarmFrom);

      const alarmToEff = maxV;

      let warningToEff = maxV;
      if (isFinite(alarmFrom) && isFinite(warningFrom) && alarmFrom > warningFrom) warningToEff = alarmFrom;
      else if (isFinite(alarmFrom) && !isFinite(warningFrom)) warningToEff = maxV; // warning sector absent anyway

      const warn  = (isFinite(warningFrom) ? sectorAngles(warningFrom, warningToEff, minV, maxV, arc) : null);
      const alarm = (isFinite(alarmFrom)   ? sectorAngles(alarmFrom,   alarmToEff,   minV, maxV, arc) : null);

      // Ticks
      const ticks = buildValueTickAngles(minV, maxV, tickMajor, tickMinor, arc);
      const showEndLabels = !!props.showEndLabels;

      // ---- DRAW: gauge first ------------------------------------------------
      drawArcRing(ctx, cx, cy, rOuter, arc.startDeg, arc.endDeg, 1);

      if (warn)  drawAnnularSector(ctx, cx, cy, rOuter, ringW, warn.a0,  warn.a1,  "#e7c66a");
      if (alarm) drawAnnularSector(ctx, cx, cy, rOuter, ringW, alarm.a0, alarm.a1, "#ff7a76");

      if (isFiniteN(aNow)){
        drawPointerAtRim(ctx, cx, cy, rOuter, aNow, {
          depth: needleDepth,
          color: "#ff2b2b",
          variant: "long",
          sideFactor: 0.25,
          lengthFactor: 2
        });
      }

      drawTicksFromAngles(ctx, cx, cy, rOuter, ticks.majors, ticks.minors,
        { len: 9, width: 2 },
        { len: 5, width: 1 }
      );

      const labelInsetVal = Math.max(18, Math.floor(ringW * 1.8));
      const labelPx = Math.max(10, Math.floor(R * 0.14));
      drawLabelsForMajorValues(ctx, cx, cy, rOuter, family, labelPx, labelInsetVal,
        minV, maxV, tickMajor, arc, showEndLabels
      );

      // ---- TEXT -------------------------------------------------------------
      if (mode === 'flat'){
        const rightX = gaugeLeft + 2*R + gap;
        const rightW = Math.max(0, (pad + availW) - rightX);
        const box = { x: rightX, y: gaugeTop, w: rightW, h: R };

        if (box.w > 0 && box.h > 0){
          const topBox    = { x: box.x, y: box.y, w: box.w, h: Math.floor(box.h / 2) };
          const bottomBox = { x: box.x, y: box.y + Math.floor(box.h / 2), w: box.w, h: box.h - Math.floor(box.h / 2) };

          const fit = measureValueUnitFit(ctx, family, valueText, unit, bottomBox.w, bottomBox.h, secScale);
          drawCaptionMax(ctx, family, topBox.x, topBox.y, topBox.w, topBox.h, caption, Math.floor(fit.vPx * secScale));
          drawValueUnitWithFit(ctx, family, bottomBox.x, bottomBox.y, bottomBox.w, bottomBox.h, valueText, unit, fit);
        }

        if (props.disconnect) drawDisconnectOverlay(ctx, W, H, family, color);
        return;
      }

      if (mode === 'high'){
        const bandY = gaugeTop + R + gap;
        const bandH = Math.max(0, (pad + availH) - bandY);
        if (bandH > 0){
          const bandBox = { x: pad, y: bandY, w: W - 2*pad, h: bandH };
          const fit = fitInlineCapValUnit(ctx, family, caption, valueText, unit, bandBox.w, bandBox.h, secScale);

          let xStart = bandBox.x + Math.floor((bandBox.w - fit.total) / 2);
          const yMid = bandBox.y + Math.floor(bandBox.h / 2);

          ctx.textBaseline = 'middle';
          ctx.textAlign = 'left';

          if (caption){
            setFont(ctx, fit.cPx, true, family);
            ctx.fillText(caption, xStart, yMid);
            xStart += Math.floor(ctx.measureText(caption).width + fit.g1);
          }

          setFont(ctx, fit.vPx, true, family);
          ctx.fillText(valueText, xStart, yMid);
          xStart += Math.floor(ctx.measureText(valueText).width);

          if (unit){
            xStart += fit.g2;
            setFont(ctx, fit.uPx, true, family);
            ctx.fillText(unit, xStart, yMid);
          }
        }

        if (props.disconnect) drawDisconnectOverlay(ctx, W, H, family, color);
        return;
      }

      // NORMAL: inside semicircle
      {
        const extra = Math.max(6, Math.floor(R * 0.06));
        const rSafe = Math.max(10, rOuter - (labelInsetVal + extra));

        const innerMargin = Math.max(4, Math.floor(R * 0.04));
        const yBottom = cy - innerMargin;

        let best = null;
        const mhMax = Math.floor(rSafe * 0.92);
        const mhMin = Math.floor(rSafe * 0.55);

        for (let mh = mhMax; mh >= mhMin; mh--){
          const yTop = yBottom - mh;
          const yTopRel = yTop - cy;
          if (Math.abs(yTopRel) >= rSafe) continue;

          const halfW = Math.floor(Math.sqrt(Math.max(0, rSafe * rSafe - yTopRel * yTopRel)));
          const boxW = Math.max(10, 2 * halfW);
          if (boxW <= 10) continue;

          const hv = Math.max(12, Math.floor(mh / (1 + 2*secScale)));
          const vPx = fitTextPx(ctx, valueText, boxW, hv, family, true);
          const score = vPx * 10000 + boxW * 10 + mh;

          if (!best || score > best.score) best = { mh, boxW, score };
        }

        const mh = best ? best.mh : Math.floor(rSafe * 0.75);
        const boxW = best ? best.boxW : Math.floor(rSafe * 1.6);

        const xBox = cx - Math.floor(boxW / 2);
        const yBox = yBottom - mh;

        drawThreeRowsBlock(ctx, family, xBox, yBox, boxW, mh, caption, valueText, unit, secScale);

        if (props.disconnect) drawDisconnectOverlay(ctx, W, H, family, color);
      }
    }

    function translateFunction(){ return {}; }

    return {
      id: "SpeedGauge",
      version: "0.4.0",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "SpeedGauge", create };
}));
