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
    const A = GU.angle;
    const Theme = GU.theme;
    const COMPASS_LABELS = { 0: "N", 45: "NE", 90: "E", 135: "SE", 180: "S", 225: "SW", 270: "W", 315: "NW" };
    const COMPASS_LABEL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
    const backgroundCache = { key: null, faceCanvas: null, faceCtx: null, labelSprites: [], labelRadius: 0 };

    const buildCompassBackgroundKey = (data) => JSON.stringify(data);

    const ensureCompassLayer = (canvas, existing, width, height) => {
      if (existing && existing.width === width && existing.height === height) return existing;
      const layer = canvas.ownerDocument.createElement("canvas");
      layer.width = width;
      layer.height = height;
      return layer;
    };

    const buildCompassLabelSprites = (canvas, state) => {
      const sprites = [];
      const font = state.labelWeight + " " + state.labelPx + "px " + state.family;
      for (let i = 0; i < COMPASS_LABEL_ANGLES.length; i++) {
        const angleDeg = COMPASS_LABEL_ANGLES[i];
        const text = COMPASS_LABELS[angleDeg];
        const sprite = ensureCompassLayer(canvas, null, 1, 1);
        const spriteCtx = sprite.getContext("2d");
        if (!spriteCtx) continue;
        spriteCtx.setTransform(1, 0, 0, 1, 0, 0);
        spriteCtx.font = font;
        const width = Math.max(1, Math.ceil(spriteCtx.measureText(text).width + 6));
        const height = Math.max(1, Math.ceil(state.labelPx * 1.6));
        sprite.width = width;
        sprite.height = height;
        const drawCtx = sprite.getContext("2d");
        if (!drawCtx) continue;
        drawCtx.setTransform(1, 0, 0, 1, 0, 0);
        drawCtx.clearRect(0, 0, width, height);
        drawCtx.fillStyle = state.color;
        drawCtx.strokeStyle = state.color;
        drawCtx.font = font;
        drawCtx.textAlign = "center";
        drawCtx.textBaseline = "middle";
        drawCtx.fillText(text, width / 2, height / 2);
        sprites.push({ angleDeg: angleDeg, canvas: sprite, width: width, height: height });
      }
      return sprites;
    };

    const rebuildCompassBackground = (canvas, state) => {
      backgroundCache.faceCanvas = ensureCompassLayer(canvas, backgroundCache.faceCanvas, state.bufferW, state.bufferH);
      backgroundCache.faceCtx = backgroundCache.faceCanvas.getContext("2d");
      if (!backgroundCache.faceCtx) return;
      const face = backgroundCache.faceCtx;
      face.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      face.clearRect(0, 0, state.W, state.H);
      face.fillStyle = state.color;
      face.strokeStyle = state.color;
      draw.drawRing(face, state.cx, state.cy, state.rOuter, { lineWidth: state.theme.ring.arcLineWidth });
      draw.drawTicks(face, state.cx, state.cy, state.rOuter, {
        rotationDeg: 0,
        startDeg: 0,
        endDeg: 360,
        stepMajor: 30,
        stepMinor: 10,
        major: { len: state.theme.ticks.majorLen, width: state.theme.ticks.majorWidth },
        minor: { len: state.theme.ticks.minorLen, width: state.theme.ticks.minorWidth }
      });
      backgroundCache.labelSprites = buildCompassLabelSprites(canvas, state);
      backgroundCache.labelRadius = state.labelRadius;
      backgroundCache.key = state.key;
    };

    const blitCompassFace = (ctx, face, cx, cy, rotationDeg, W, H) => {
      if (!face) return;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((rotationDeg * Math.PI) / 180);
      ctx.translate(-cx, -cy);
      ctx.drawImage(face, 0, 0, face.width, face.height, 0, 0, W, H);
      ctx.restore();
    };

    const drawCompassCachedLabels = (ctx, cx, cy, labelRadius, rotationDeg) => {
      if (!backgroundCache.labelSprites || !backgroundCache.labelSprites.length) return;
      for (let i = 0; i < backgroundCache.labelSprites.length; i++) {
        const sprite = backgroundCache.labelSprites[i];
        const t = A.degToCanvasRad(sprite.angleDeg, null, rotationDeg);
        const x = cx + Math.cos(t) * labelRadius;
        const y = cy + Math.sin(t) * labelRadius;
        ctx.drawImage(sprite.canvas, x - (sprite.width / 2), y - (sprite.height / 2));
      }
    };

    function renderCanvas(canvas, props){
      const p = props || {};
      const { ctx, W, H } = Helpers.setupCanvas(canvas);
      if (!W || !H) return;
      const theme = Theme.resolve(canvas);
      const valueWeight = theme.font.weight;
      const labelWeight = theme.font.labelWeight;

      ctx.clearRect(0,0,W,H);
      const family = Helpers.resolveFontFamily(canvas);
      const color  = Helpers.resolveTextColor(canvas);
      ctx.fillStyle = color; ctx.strokeStyle = color;

      const heading = p.heading;
      const marker  = p.markerCourse;
      const leadingZero = !!p.leadingZero;

      const ratio = W / Math.max(1, H);
      const tN = V.isFiniteNumber(p.compRatioThresholdNormal) ? p.compRatioThresholdNormal : 0.8;
      const tF = V.isFiniteNumber(p.compRatioThresholdFlat) ? p.compRatioThresholdFlat : 2.2;
      let mode;
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
      const labelPx = Math.max(10, Math.floor(R * 0.16));
      const labelRadius = rOuter - Math.max(16, Math.floor(ringW * 1.6));
      const rotationDeg = V.isFiniteNumber(heading) ? -heading : 0;
      const bufferW = Math.max(1, Math.round(canvas.width || W));
      const bufferH = Math.max(1, Math.round(canvas.height || H));
      const dpr = Math.max(1, bufferW / Math.max(1, W));
      const backgroundKey = buildCompassBackgroundKey({
        bufferW: bufferW,
        bufferH: bufferH,
        W: W,
        H: H,
        dpr: dpr,
        cx: cx,
        cy: cy,
        rOuter: rOuter,
        ringW: ringW,
        labelPx: labelPx,
        labelRadius: labelRadius,
        ringLineWidth: theme.ring.arcLineWidth,
        ticksMajorLen: theme.ticks.majorLen,
        ticksMajorWidth: theme.ticks.majorWidth,
        ticksMinorLen: theme.ticks.minorLen,
        ticksMinorWidth: theme.ticks.minorWidth,
        family: family,
        labelWeight: labelWeight,
        color: color,
        labelsSig: "N|NE|E|SE|S|SW|W|NW"
      });

      if (backgroundCache.key !== backgroundKey) {
        rebuildCompassBackground(canvas, {
          key: backgroundKey,
          bufferW: bufferW,
          bufferH: bufferH,
          dpr: dpr,
          W: W,
          H: H,
          cx: cx,
          cy: cy,
          rOuter: rOuter,
          ringW: ringW,
          labelPx: labelPx,
          labelRadius: labelRadius,
          theme: theme,
          family: family,
          labelWeight: labelWeight,
          color: color
        });
      }
      blitCompassFace(ctx, backgroundCache.faceCanvas, cx, cy, rotationDeg, W, H);

      draw.drawPointerAtRim(ctx, cx, cy, rOuter, 0, {
        depth: lubber,
        fillStyle: theme.colors.pointer,
        variant: "long",
        sideFactor: theme.pointer.sideFactor,
        lengthFactor: theme.pointer.lengthFactor
      });

      if (V.isFiniteNumber(marker) && V.isFiniteNumber(heading)){
        draw.drawRimMarker(ctx, cx, cy, rOuter, (marker - heading), {
          len: Math.max(12, Math.floor(ringW * 0.9)),
          width: Math.max(3, Math.floor(ringW * 0.40))
        });
      }
      drawCompassCachedLabels(ctx, cx, cy, backgroundCache.labelRadius || labelRadius, rotationDeg);

      const caption = (p.caption || '').trim();
      const unit    = (p.unit || '°').trim();
      const value   = V.isFiniteNumber(heading)
        ? V.formatDirection360(heading, leadingZero)
        : (hasOwn.call(p, "default") ? p.default : "---");
      const secScale = V.clamp(p.captionUnitScale ?? 0.8, 0.3, 3.0);

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
        if (p.disconnect) T.drawDisconnectOverlay(ctx, W, H, family, color, null, labelWeight);
        return;
      }

      if (mode === 'high'){
        const th = Math.max(10, Math.floor((pad + topStrip) * 0.9));
        const band = { x: pad, y: pad, w: W - 2*pad, h: th };

        const fit = T.fitInlineCapValUnit(ctx, family, caption, value, unit, band.w, band.h, secScale, valueWeight, labelWeight);
        T.drawInlineCapValUnit(ctx, family, band.x, band.y, band.w, band.h, caption, value, unit, fit, valueWeight, labelWeight);

        if (p.disconnect) T.drawDisconnectOverlay(ctx, W, H, family, color, null, labelWeight);
        return;
      }

      {
        const labelInsetVal = Math.max(18, Math.floor(ringW * theme.labels.insetFactor));
        const extra = Math.max(6, Math.floor(R * 0.06));
        const rSafe = Math.max(10, rOuter - (labelInsetVal + extra));

        if (rSafe < 12) {
          const th = Math.max(10, Math.floor((pad + topStrip) * 0.9));
          const fit = T.measureValueUnitFit(ctx, family, value, unit, (W - 2*pad), th, secScale, valueWeight, labelWeight);
          T.drawValueUnitWithFit(ctx, family, pad, pad, (W - 2*pad), th, value, unit, fit, "center", valueWeight, labelWeight);
          if (p.disconnect) T.drawDisconnectOverlay(ctx, W, H, family, color, null, labelWeight);
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

        T.drawThreeRowsBlock(ctx, family, xBox, yTop, boxW, maxH, caption, value, unit, secScale, "center", sizes, valueWeight, labelWeight);

        if (p.disconnect) T.drawDisconnectOverlay(ctx, W, H, family, color, null, labelWeight);
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
