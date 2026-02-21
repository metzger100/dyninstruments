/**
 * Module: CompassGaugeWidget - Full-circle rotating compass with upright labels
 * Documentation: documentation/widgets/compass-gauge.md
 * Depends: GaugeToolkit
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniCompassGaugeWidget = factory(); }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;

  function create(def, Helpers) {
    const GU = Helpers.getModule("GaugeToolkit").create(def, Helpers);
    const draw = GU.draw;
    const T = GU.text;
    const V = GU.value;
    const Theme = GU.theme;

    // ---------- utils --------------------------------------------------------
    function renderCanvas(canvas, props){
      const { ctx, W, H } = Helpers.setupCanvas(canvas);
      if (!W || !H) return;
      const theme = Theme.resolve(canvas);
      const valueWeight = theme.font.weight;
      const labelWeight = theme.font.labelWeight;

      ctx.clearRect(0,0,W,H);
      const family = Helpers.resolveFontFamily(canvas);
      const color  = Helpers.resolveTextColor(canvas);
      ctx.fillStyle = color; ctx.strokeStyle = color;

      const heading = props.heading;
      const marker  = props.markerCourse;
      const leadingZero = !!props.leadingZero;

      const ratio = W / Math.max(1, H);
      const tN = V.isFiniteNumber(props.compRatioThresholdNormal) ? props.compRatioThresholdNormal : 0.8;
      const tF = V.isFiniteNumber(props.compRatioThresholdFlat) ? props.compRatioThresholdFlat : 2.2;
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
      const ringW = Math.max(6, Math.floor(R * theme.ring.widthFactor));
      const rOuter = R;
      const lubber = Math.max(10, Math.floor(ringW * 0.9));

      // Left/right/top/bottom strips for flat/high placement
      const leftStrip   = Math.max(0, Math.floor((W - 2*pad - 2*R) / 2));
      const rightStrip  = leftStrip;
      const topStrip    = Math.max(0, Math.floor((H - 2*pad - 2*R) / 2));

      // ---- Dial: rotated ticks + upright labels layering with pointer -------
      const rotationDeg = V.isFiniteNumber(heading) ? -heading : 0;

      // Frame (ring + ticks)
      draw.drawRing(ctx, cx, cy, rOuter, { lineWidth: theme.ring.arcLineWidth });

      draw.drawTicks(ctx, cx, cy, rOuter, {
        rotationDeg,
        startDeg: 0, endDeg: 360,
        stepMajor: 30, stepMinor: 10,
        major: { len: theme.ticks.majorLen, width: theme.ticks.majorWidth },
        minor: { len: theme.ticks.minorLen, width: theme.ticks.minorWidth }
      });

      // Fixed red lubber pointer at 0° (north), behind labels
      draw.drawPointerAtRim(ctx, cx, cy, rOuter, 0, {
        depth: lubber,
        fillStyle: theme.colors.pointer,
        variant: "long",
        sideFactor: theme.pointer.sideFactor,
        lengthFactor: theme.pointer.lengthFactor
      });

      // Optional target marker (bearing/course) relative to rotating card: (marker - heading)
      if (V.isFiniteNumber(marker) && V.isFiniteNumber(heading)){
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
        weight: labelWeight,
        family,
        labelsMap: labels,
        labelFormatter: (deg) => String(deg),
        textRotation: "upright"
      });

      // ---- Texts -------------------------------------------------------------
      const caption = (props.caption || '').trim();
      const unit    = (props.unit || '°').trim();
      const value   = V.isFiniteNumber(heading)
        ? V.formatDirection360(heading, leadingZero)
        : ((props && hasOwn.call(props, "default")) ? props.default : "---");
      const secScale = V.clamp(props.captionUnitScale ?? 0.8, 0.3, 3.0);

      // FLAT: left column next to dial
      if (mode === 'flat'){
        if (leftStrip > 0){
          const lh = 2*R;
          const leftX  = pad;
          const topBox    = { x: leftX,  y: cy - R, w: leftStrip,  h: Math.floor(lh/2) };
          const bottomBox = { x: leftX,  y: cy,     w: leftStrip,  h: Math.floor(lh/2) };

          const fit = T.measureValueUnitFit(ctx, family, value, unit, bottomBox.w, bottomBox.h, secScale, valueWeight, labelWeight);
          T.drawCaptionMax(ctx, family, topBox.x, topBox.y, topBox.w, topBox.h, caption, Math.floor(fit.vPx * secScale), "left", labelWeight);
          T.drawValueUnitWithFit(ctx, family, bottomBox.x, bottomBox.y, bottomBox.w, bottomBox.h, value, unit, fit, "left", valueWeight, labelWeight);
        }
        if (props.disconnect) T.drawDisconnectOverlay(ctx, W, H, family, color, null, labelWeight);
        return;
      }

      // HIGH: one inline row (Caption • Value • Unit), centered above the dial
      if (mode === 'high'){
        const th = Math.max(10, Math.floor((pad + topStrip) * 0.9));
        const band = { x: pad, y: pad, w: W - 2*pad, h: th };

        const fit = T.fitInlineCapValUnit(ctx, family, caption, value, unit, band.w, band.h, secScale, valueWeight, labelWeight);
        T.drawInlineCapValUnit(ctx, family, band.x, band.y, band.w, band.h, caption, value, unit, fit, valueWeight, labelWeight);

        if (props.disconnect) T.drawDisconnectOverlay(ctx, W, H, family, color, null, labelWeight);
        return;
      }

      // NORMAL: centered three-row block inside the safe circle
      {
        const labelInsetVal = Math.max(18, Math.floor(ringW * theme.labels.insetFactor));
        const extra = Math.max(6, Math.floor(R * 0.06));
        const rSafe = Math.max(10, rOuter - (labelInsetVal + extra));

        if (rSafe < 12) {
          const th = Math.max(10, Math.floor((pad + topStrip) * 0.9));
          const fit = T.measureValueUnitFit(ctx, family, value, unit, (W - 2*pad), th, secScale, valueWeight, labelWeight);
          T.drawValueUnitWithFit(ctx, family, pad, pad, (W - 2*pad), th, value, unit, fit, "center", valueWeight, labelWeight);
          if (props.disconnect) T.drawDisconnectOverlay(ctx, W, H, family, color, null, labelWeight);
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
          const vPx = T.fitTextPx(ctx, value, boxW, hv, family, valueWeight);
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

        const cPx  = T.fitTextPx(ctx, caption, boxW, hc, family, labelWeight);
        const uPx  = T.fitTextPx(ctx, unit,    boxW, hu, family, labelWeight);
        const vPx  = best ? best.vPx : T.fitTextPx(ctx, value, boxW, hv, family, valueWeight);

        const sizes = { cPx, vPx, uPx, hCap: hc, hVal: hv, hUnit: hu };

        const xBox  = cx - Math.floor(boxW / 2);
        const yTop  = cy - Math.floor(maxH / 2);

        // Center-aligned text in a centered box
        T.drawThreeRowsBlock(ctx, family, xBox, yTop, boxW, maxH, caption, value, unit, secScale, "center", sizes, valueWeight, labelWeight);

        if (props.disconnect) T.drawDisconnectOverlay(ctx, W, H, family, color, null, labelWeight);
      }
    }

    function translateFunction(){ return {}; }

    return {
      id: "CompassGaugeWidget",
      version: "1.2.0",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "CompassGaugeWidget", create };
}));
