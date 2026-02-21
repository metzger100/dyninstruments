/**
 * Module: WindDialWidget - Full-circle wind dial for angle and speed pairs
 * Documentation: documentation/widgets/wind-dial.md
 * Depends: GaugeToolkit
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniWindDialWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const GU = Helpers.getModule("GaugeToolkit").create(def, Helpers);
    const draw = GU.draw;
    const T = GU.text;
    const V = GU.value;
    const Theme = GU.theme;
    const backgroundCache = { key: null, backCanvas: null, backCtx: null, frontCanvas: null, frontCtx: null };

    function formatSpeedText(raw, props, speedUnit) {
      const n = Number(raw);
      if (!isFinite(n)) return "---";

      const p = props || {};
      const formatter = (typeof p.formatter !== "undefined") ? p.formatter : "formatSpeed";
      const formatterParameters = (typeof p.formatterParameters !== "undefined") ? p.formatterParameters : [speedUnit || "kn"];
      const formatted = String(Helpers.applyFormatter(n, {
        formatter: formatter,
        formatterParameters: formatterParameters,
        default: "---"
      }));

      return formatted;
    }

    const buildWindBackgroundKey = (data) => JSON.stringify(data);

    const ensureWindLayer = (canvas, existing, width, height) => {
      if (existing && existing.width === width && existing.height === height) return existing;
      const layer = canvas.ownerDocument.createElement("canvas");
      layer.width = width;
      layer.height = height;
      return layer;
    };

    const rebuildWindBackground = (canvas, state) => {
      backgroundCache.backCanvas = ensureWindLayer(canvas, backgroundCache.backCanvas, state.bufferW, state.bufferH);
      backgroundCache.frontCanvas = ensureWindLayer(canvas, backgroundCache.frontCanvas, state.bufferW, state.bufferH);
      backgroundCache.backCtx = backgroundCache.backCanvas.getContext("2d");
      backgroundCache.frontCtx = backgroundCache.frontCanvas.getContext("2d");
      if (!backgroundCache.backCtx || !backgroundCache.frontCtx) return;

      const back = backgroundCache.backCtx;
      const front = backgroundCache.frontCtx;
      back.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      front.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      back.clearRect(0, 0, state.W, state.H);
      front.clearRect(0, 0, state.W, state.H);
      back.fillStyle = back.strokeStyle = state.color;
      front.fillStyle = front.strokeStyle = state.color;

      draw.drawRing(back, state.cx, state.cy, state.rOuter, { lineWidth: state.theme.ring.arcLineWidth });
      if (state.layEnabled && state.layMax > state.layMin) {
        draw.drawAnnularSector(back, state.cx, state.cy, state.rOuter, {
          startDeg: state.layMin,
          endDeg: state.layMax,
          thickness: state.ringW,
          fillStyle: state.theme.colors.laylineStb,
          alpha: 1
        });
        draw.drawAnnularSector(back, state.cx, state.cy, state.rOuter, {
          startDeg: -state.layMax,
          endDeg: -state.layMin,
          thickness: state.ringW,
          fillStyle: state.theme.colors.laylinePort,
          alpha: 1
        });
      }

      draw.drawTicks(front, state.cx, state.cy, state.tickR, {
        startDeg: -180, endDeg: 180, stepMajor: 30, stepMinor: 10, includeEnd: true,
        major: { len: state.theme.ticks.majorLen, width: state.theme.ticks.majorWidth }, minor: { len: state.theme.ticks.minorLen, width: state.theme.ticks.minorWidth }
      });
      draw.drawLabels(front, state.cx, state.cy, state.tickR, {
        startDeg: -180, endDeg: 180, step: 30, includeEnd: true,
        radiusOffset: state.labelInsetVal, fontPx: state.labelPx, weight: state.labelWeight, family: state.family,
        labelFormatter: (deg) => String(deg), labelFilter: (deg) => deg !== -180 && deg !== 180
      });
      backgroundCache.key = state.key;
    };

    const blitWindLayer = (ctx, layer, W, H) => {
      if (!layer) return;
      ctx.drawImage(layer, 0, 0, layer.width, layer.height, 0, 0, W, H);
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

      const ratio = W / Math.max(1, H);
      const tN = V.isFiniteNumber(p.dialRatioThresholdNormal) ? p.dialRatioThresholdNormal : 0.7;
      const tF = V.isFiniteNumber(p.dialRatioThresholdFlat) ? p.dialRatioThresholdFlat : 2.0;
      let mode;
      if (ratio < tN) mode = 'high';
      else if (ratio > tF) mode = 'flat';
      else mode = 'normal';

      const pad = Math.max(6, Math.floor(Math.min(W,H) * 0.04));
      const D = Math.min(W - 2*pad, H - 2*pad);
      const R = Math.max(14, Math.floor(D / 2));
      const cx = Math.floor(W/2);
      const cy = Math.floor(H/2);
      const ringW = Math.max(6, Math.floor(R * theme.ring.widthFactor));
      const rOuter = R;
      const tickR  = rOuter;
      const needleDepth = Math.max(8, Math.floor(ringW * 0.9));

      const leftStrip = Math.max(0, Math.floor((W - 2*pad - 2*R) / 2)), rightStrip = leftStrip;
      const topStrip = Math.max(0, Math.floor((H - 2*pad - 2*R) / 2)), bottomStrip = topStrip;
      const g = { leftTop: null, leftBottom: null, rightTop: null, rightBottom: null, top: null, bottom: null };

      if (mode === 'flat'){
        const lh = 2*R;
        const leftX  = pad;
        const rightX = W - pad - rightStrip;
        if (leftStrip > 0){
          g.leftTop = { x: leftX, y: cy - R, w: leftStrip, h: Math.floor(lh/2) };
          g.leftBottom = { x: leftX, y: cy, w: leftStrip, h: Math.floor(lh/2) };
        }
        if (rightStrip > 0){
          g.rightTop = { x: rightX, y: cy - R, w: rightStrip, h: Math.floor(lh/2) };
          g.rightBottom = { x: rightX, y: cy,     w: rightStrip, h: Math.floor(lh/2) };
        }
      }
      else if (mode === 'high'){
        const availTop = pad + topStrip;
        const availBot = pad + bottomStrip;
        const th = Math.max(10, Math.floor(availTop * 0.85));
        const bh = Math.max(10, Math.floor(availBot * 0.85));
        g.top = { x: pad, y: pad, w: W - 2*pad, h: th };
        g.bottom = { x: pad, y: H - pad - bh, w: W - 2*pad, h: bh };
      }

      const layEnabled = (p.layEnabled !== false);
      const layMin = V.clamp(p.layMin, 0, 180);
      const layMax = V.clamp(p.layMax, 0, 180);
      const labelInsetVal = Math.max(18, Math.floor(ringW * theme.labels.insetFactor));
      const labelPx = Math.max(10, Math.floor(R * theme.labels.fontFactor));
      const bufferW = Math.max(1, Math.round(canvas.width || W));
      const bufferH = Math.max(1, Math.round(canvas.height || H));
      const dpr = Math.max(1, bufferW / Math.max(1, W));
      const backgroundKey = buildWindBackgroundKey({ bufferW, bufferH, W, H, dpr, cx, cy, rOuter, tickR, ringW, labelInsetVal, labelPx, layEnabled, layMin, layMax, ringLineWidth: theme.ring.arcLineWidth, ticksMajorLen: theme.ticks.majorLen, ticksMajorWidth: theme.ticks.majorWidth, ticksMinorLen: theme.ticks.minorLen, ticksMinorWidth: theme.ticks.minorWidth, laylineStb: theme.colors.laylineStb, laylinePort: theme.colors.laylinePort, family, labelWeight, color });

      if (backgroundCache.key !== backgroundKey) {
        rebuildWindBackground(canvas, { key: backgroundKey, bufferW, bufferH, dpr, W, H, cx, cy, rOuter, tickR, ringW, layEnabled, layMin, layMax, theme, family, labelWeight, color, labelInsetVal, labelPx });
      }

      blitWindLayer(ctx, backgroundCache.backCanvas, W, H);

      if (V.isFiniteNumber(p.angle)) {
        draw.drawPointerAtRim(ctx, cx, cy, rOuter, p.angle, {
          depth: needleDepth,
          fillStyle: theme.colors.pointer,
          variant: "long",
          sideFactor: theme.pointer.sideFactor,
          lengthFactor: theme.pointer.lengthFactor
        });
      }
      blitWindLayer(ctx, backgroundCache.frontCanvas, W, H);

      const secScale = V.clamp(p.captionUnitScale ?? 0.8, 0.3, 3.0);
      const angleUnit = (p.angleUnit || '°').trim(), speedUnit = (p.speedUnit || 'kn').trim();
      const angleText = V.formatAngle180(p.angle, !!p.leadingZero);
      const speedText = formatSpeedText(p.speed, p, speedUnit);
      const angleCap = (p.angleCaption || '').trim();
      const speedCap = (p.speedCaption || '').trim();

      if (mode === 'flat'){
        if (g.leftBottom && g.leftTop){
          const fitL = T.measureValueUnitFit(ctx, family, angleText, angleUnit, g.leftBottom.w, g.leftBottom.h, secScale, valueWeight, labelWeight);
          T.drawCaptionMax(ctx, family, g.leftTop.x, g.leftTop.y, g.leftTop.w, g.leftTop.h, angleCap, Math.floor(fitL.vPx * secScale), "left", labelWeight);
          T.drawValueUnitWithFit(ctx, family, g.leftBottom.x, g.leftBottom.y, g.leftBottom.w, g.leftBottom.h, angleText, angleUnit, fitL, "left", valueWeight, labelWeight);
        }
        if (g.rightBottom && g.rightTop){
          const fitR = T.measureValueUnitFit(ctx, family, speedText, speedUnit, g.rightBottom.w, g.rightBottom.h, secScale, valueWeight, labelWeight);
          T.drawCaptionMax(ctx, family, g.rightTop.x, g.rightTop.y, g.rightTop.w, g.rightTop.h, speedCap, Math.floor(fitR.vPx * secScale), "right", labelWeight);
          T.drawValueUnitWithFit(ctx, family, g.rightBottom.x, g.rightBottom.y, g.rightBottom.w, g.rightBottom.h, speedText, speedUnit, fitR, "right", valueWeight, labelWeight);
        }
        return;
      }

      if (mode === 'high'){
        const capTop = angleCap, valTop = angleText, uniTop = angleUnit;
        const capBot = speedCap, valBot = speedText, uniBot = speedUnit;

        if (g.top) {
          const fitTop = T.fitInlineCapValUnit(ctx, family, capTop, valTop, uniTop, g.top.w, g.top.h, secScale, valueWeight, labelWeight);
          T.drawInlineCapValUnit(ctx, family, g.top.x, g.top.y, g.top.w, g.top.h, capTop, valTop, uniTop, fitTop, valueWeight, labelWeight);
        }
        if (g.bottom) {
          const fitBottom = T.fitInlineCapValUnit(ctx, family, capBot, valBot, uniBot, g.bottom.w, g.bottom.h, secScale, valueWeight, labelWeight);
          T.drawInlineCapValUnit(ctx, family, g.bottom.x, g.bottom.y, g.bottom.w, g.bottom.h, capBot, valBot, uniBot, fitBottom, valueWeight, labelWeight);
        }
        return;
      }

      {
        const extra = Math.max(6, Math.floor(R * 0.06));
        const rSafe = Math.max(10, rOuter - (labelInsetVal + extra));
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

          const vPxA = T.fitTextPx(ctx, angleText, halfW, hv, family, valueWeight);
          const vPxS = T.fitTextPx(ctx, speedText, halfW, hv, family, valueWeight);
          const vPx  = Math.min(vPxA, vPxS);
          const cPx  = Math.min(T.fitTextPx(ctx, angleCap, halfW, hc, family, labelWeight),
                                T.fitTextPx(ctx, speedCap, halfW, hc, family, labelWeight));
          const uPx  = Math.min(T.fitTextPx(ctx, angleUnit, halfW, hu, family, labelWeight),
                                T.fitTextPx(ctx, speedUnit, halfW, hu, family, labelWeight));
          const sizes = { cPx, vPx, uPx, hCap: hc, hVal: hv, hUnit: hu };
          T.drawThreeRowsBlock(ctx, family, xL, yTop, halfW, maxH, angleCap, angleText, angleUnit, secScale, "right", sizes, valueWeight, labelWeight);
          T.drawThreeRowsBlock(ctx, family, xR, yTop, halfW, maxH, speedCap, speedText, speedUnit, secScale, "left", sizes, valueWeight, labelWeight);
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
          const vPxA = T.fitTextPx(ctx, angleText, halfWMax, hv, family, valueWeight);
          const vPxS = T.fitTextPx(ctx, speedText, halfWMax, hv, family, valueWeight);
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

        const cPx  = Math.min(T.fitTextPx(ctx, angleCap,  halfW, hc, family, labelWeight),
                              T.fitTextPx(ctx, speedCap,  halfW, hc, family, labelWeight));
        const uPx  = Math.min(T.fitTextPx(ctx, angleUnit, halfW, hu, family, labelWeight),
                              T.fitTextPx(ctx, speedUnit, halfW, hu, family, labelWeight));
        const vPx  = best ? best.vPx : Math.min(
          T.fitTextPx(ctx, angleText, halfW, hv, family, valueWeight),
          T.fitTextPx(ctx, speedText, halfW, hv, family, valueWeight)
        );

        const sizes = { cPx, vPx, uPx, hCap: hc, hVal: hv, hUnit: hu };

        const innerW = 2 * halfW + colGap;
        const xL     = cx - Math.floor(innerW/2);
        const xR     = cx + Math.floor(innerW/2) - halfW;
        const yTop   = cy - Math.floor(maxH/2);

        T.drawThreeRowsBlock(ctx, family, xL, yTop, halfW, maxH, angleCap, angleText, angleUnit, secScale, "right", sizes, valueWeight, labelWeight);
        T.drawThreeRowsBlock(ctx, family, xR, yTop, halfW, maxH, speedCap, speedText, speedUnit, secScale, "left", sizes, valueWeight, labelWeight);
      }
    }

    function translateFunction(){ return {}; }

    return {
      id: "WindDialWidget",
      version: "1.8.0",
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "WindDialWidget", create };
}))
