/**
 * Module: ThreeValueTextWidget - Responsive caption/value/unit numeric canvas renderer
 * Documentation: documentation/widgets/three-elements.md
 * Depends: Helpers.applyFormatter, ThemeResolver, GaugeTextLayout, GaugeValueMath
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniThreeValueTextWidget = factory(); }
}(this, function () {
  "use strict";

  // ---- helpers for sizing ---------------------------------------------------

  function fitValueUnitRowPx(ctx, valueText, unitText, baseValuePx, secScale, gap, maxW, maxH, family, valueWeight, labelWeight, setFontFn){
    let vPx = Math.max(1, Math.floor(Math.min(baseValuePx, maxH)));
    let uPx = Math.max(1, Math.floor(Math.min(Math.floor(vPx * secScale), maxH)));

    setFontFn(ctx, vPx, valueWeight, family);
    const vW = valueText ? ctx.measureText(valueText).width : 0;

    setFontFn(ctx, uPx, labelWeight, family);
    const uW = (unitText ? ctx.measureText(unitText).width : 0);

    const totalW = vW + (unitText ? (gap + uW) : 0);

    if (totalW <= maxW + 0.01) {
      return { vPx, uPx };
    }
    const scale = Math.max(0.1, (maxW / Math.max(1, totalW)));
    vPx = Math.max(1, Math.floor(vPx * scale));
    uPx = Math.max(1, Math.floor(uPx * scale));
    vPx = Math.min(vPx, Math.floor(maxH));
    uPx = Math.min(uPx, Math.floor(maxH));
    return { vPx, uPx };
  }

  function makeFitCacheKey(mode, W, H, valueText, captionText, unitText, secScale, family, valueWeight, labelWeight) {
    return JSON.stringify({
      mode,
      W,
      H,
      value: valueText,
      caption: captionText,
      unit: unitText,
      secScale,
      family,
      valueWeight,
      labelWeight
    });
  }

  function readFitCache(entry, key) {
    return entry && entry.key === key ? entry.result : null;
  }

  function create(def, Helpers) {
    const theme = Helpers.getModule("ThemeResolver").create(def, Helpers);
    const textLayout = Helpers.getModule("GaugeTextLayout").create(def, Helpers);
    const valueMath = Helpers.getModule("GaugeValueMath").create(def, Helpers);
    const fitCache = { high: null, normal: null, flat: null };

    function renderCanvas(canvas, props){
      const { ctx, W, H } = Helpers.setupCanvas(canvas);
      if (!W || !H) return;
      ctx.clearRect(0,0,W,H);
      ctx.textBaseline = 'middle';
      const tokens = theme.resolve(canvas);
      const valueWeight = tokens.font.weight;
      const labelWeight = tokens.font.labelWeight;

      const family = Helpers.resolveFontFamily(canvas);
      const color  = Helpers.resolveTextColor(canvas);
      ctx.fillStyle = color;

      const caption = (props.caption || '').trim();
      const unit    = (props.unit || '').trim();
      const value   = String(Helpers.applyFormatter(props.value, props));

      const ratio   = W / Math.max(1, H);
      const tNormal = valueMath.isFiniteNumber(props.ratioThresholdNormal) ? props.ratioThresholdNormal : 1.0;
      const tFlat   = valueMath.isFiniteNumber(props.ratioThresholdFlat) ? props.ratioThresholdFlat : 3.0;

      // Unified scale for caption & unit relative to value font.
      const secScale = valueMath.clamp(props.captionUnitScale ?? 0.8, 0.3, 3.0);

      // Decide base mode from aspect ratio thresholds
      const baseMode = valueMath.computeMode(ratio, tNormal, tFlat);

      // Collapse rules driven by caption/unit presence
      const hasCaption = !!caption;
      const hasUnit    = !!unit;

      let mode = baseMode;
      if (!hasCaption) {
        mode = 'flat';
      } else if (!hasUnit && baseMode === 'high') {
        mode = 'normal';
      }

      const padX    = Math.max(6, Math.floor(Math.min(W,H) * 0.04));
      const innerY  = Math.max(3, Math.floor(Math.min(W,H) * 0.035));
      const gapBase = Math.max(6, Math.floor(Math.min(W,H) * 0.06));

      // ---- 3-row layout (Top: Caption, Mid: Value, Bottom: Unit) -----------
      if (mode === 'high'){
        const key = makeFitCacheKey(
          'high', W, H, value, caption, unit, secScale, family, valueWeight, labelWeight
        );
        const cached = readFitCache(fitCache.high, key);
        let hTop;
        let hMid;
        let hBot;
        let vPx;
        let cPx;
        let uPx;

        if (cached) {
          hTop = cached.hTop;
          hMid = cached.hMid;
          hBot = cached.hBot;
          vPx = cached.vPx;
          cPx = cached.cPx;
          uPx = cached.uPx;
        } else {
          const wTop = secScale;
          const wMid = 1;
          const wBot = secScale;
          const wSum = wTop + wMid + wBot;
          hTop = Math.round(H * (wTop / wSum));
          hMid = Math.round(H * (wMid / wSum));
          hBot = H - hTop - hMid;

          const maxHTop = Math.max(8, hTop - innerY * 2);
          const maxHMid = Math.max(10, hMid - innerY * 2);
          const maxHBot = Math.max(8, hBot - innerY * 2);
          const maxW = Math.max(10, W - padX * 2);
          const vBaseH = Math.floor(maxHMid);
          vPx = textLayout.fitSingleTextPx(ctx, value, vBaseH, maxW, maxHMid, family, valueWeight);

          const cBaseH = Math.min(Math.floor(vBaseH * secScale), maxHTop);
          const uBaseH = Math.min(Math.floor(vBaseH * secScale), maxHBot);
          cPx = caption ? textLayout.fitSingleTextPx(
            ctx, caption, cBaseH, maxW, maxHTop, family, labelWeight
          ) : 0;
          uPx = unit ? textLayout.fitSingleTextPx(
            ctx, unit, uBaseH, maxW, maxHBot, family, labelWeight
          ) : 0;

          fitCache.high = { key, result: { hTop, hMid, hBot, vPx, cPx, uPx } };
        }

        if (caption){
          const yTop = Math.floor(hTop/2);
          textLayout.setFont(ctx, cPx, labelWeight, family);
          ctx.textAlign = 'left';
          ctx.fillText(caption, padX, yTop);
        }

        {
          const yMid = Math.floor(hTop + hMid/2);
          textLayout.setFont(ctx, vPx, valueWeight, family);
          ctx.textAlign = 'center';
          ctx.fillText(value, Math.floor(W/2), yMid);
        }

        if (unit){
          const yBot = Math.floor(hTop + hMid + hBot/2);
          textLayout.setFont(ctx, uPx, labelWeight, family);
          ctx.textAlign = 'right';
          ctx.fillText(unit, W - padX, yBot);
        }

        if (props.disconnect) textLayout.drawDisconnectOverlay(ctx, W, H, family, color, null, labelWeight);
        return;
      }

      // ---- 2-row layout (Top: Value+Unit, Bottom: Caption) -----------------
      if (mode === 'normal'){
        const key = makeFitCacheKey(
          'normal', W, H, value, caption, unit, secScale, family, valueWeight, labelWeight
        );
        const cached = readFitCache(fitCache.normal, key);
        let hTop;
        let hBot;
        let vPx;
        let uPx;
        let cPx;
        let vW;
        let uW;
        let total;

        if (cached) {
          hTop = cached.hTop;
          hBot = cached.hBot;
          vPx = cached.vPx;
          uPx = cached.uPx;
          cPx = cached.cPx;
          vW = cached.vW;
          uW = cached.uW;
          total = cached.total;
        } else {
          const wTop = 1;
          const wBot = secScale;
          const wSum = wTop + wBot;
          hTop = Math.round(H * (wTop / wSum));
          hBot = H - hTop;

          const maxHTop = Math.max(10, hTop - innerY * 2);
          const maxHBot = Math.max(8, hBot - innerY * 2);
          const maxW = Math.max(10, W - padX * 2);
          const vBaseH = Math.floor(maxHTop);
          const pair = fitValueUnitRowPx(
            ctx, value, unit, vBaseH, secScale, gapBase, maxW, maxHTop, family, valueWeight, labelWeight, textLayout.setFont
          );
          vPx = pair.vPx;
          uPx = unit ? pair.uPx : 0;

          const cBaseH = Math.min(Math.floor(vBaseH * secScale), maxHBot);
          cPx = caption ? textLayout.fitSingleTextPx(
            ctx, caption, cBaseH, maxW, maxHBot, family, labelWeight
          ) : 0;

          textLayout.setFont(ctx, vPx, valueWeight, family);
          vW = ctx.measureText(value).width;
          uW = 0;
          if (unit) {
            textLayout.setFont(ctx, uPx, labelWeight, family);
            uW = ctx.measureText(unit).width;
          }
          total = vW + (unit ? gapBase + uW : 0);

          fitCache.normal = { key, result: { hTop, hBot, vPx, uPx, cPx, vW, uW, total } };
        }

        {
          let x = Math.floor((W - total) / 2);
          const y = Math.floor(hTop / 2);
          ctx.textAlign = 'left';
          textLayout.setFont(ctx, vPx, valueWeight, family);
          ctx.fillText(value, x, y);
          x += vW;
          if (unit) {
            x += gapBase;
            textLayout.setFont(ctx, uPx, labelWeight, family);
            ctx.fillText(unit, x, y);
          }
        }

        if (caption){
          const y = Math.floor(hTop + hBot/2);
          textLayout.setFont(ctx, cPx, labelWeight, family);
          ctx.textAlign = 'left';
          ctx.fillText(caption, padX, y);
        }

        if (props.disconnect) textLayout.drawDisconnectOverlay(ctx, W, H, family, color, null, labelWeight);
        return;
      }

      // ---- 1-row flat layout (Caption, Value, Unit in one line) ------------
      {
        const key = makeFitCacheKey(
          'flat', W, H, value, caption, unit, secScale, family, valueWeight, labelWeight
        );
        const cached = readFitCache(fitCache.flat, key);
        let vPx;
        let sPx;
        let cW;
        let vW;
        let uW;
        let total;

        if (cached) {
          vPx = cached.vPx;
          sPx = cached.sPx;
          cW = cached.cW;
          vW = cached.vW;
          uW = cached.uW;
          total = cached.total;
        } else {
          const maxH = Math.max(10, H - innerY * 2);
          let lo = 8;
          let hi = H * 1.6;
          let best = 10;

          for (let i = 0; i < 14; i++) {
            const mid = (lo + hi) / 2;
            const testVPx = Math.floor(mid);
            const testSPx = Math.floor(mid * secScale);
            textLayout.setFont(ctx, testVPx, valueWeight, family);
            const testVW = ctx.measureText(value).width;
            textLayout.setFont(ctx, testSPx, labelWeight, family);
            const testCW = caption ? ctx.measureText(caption).width : 0;
            const testUW = unit ? ctx.measureText(unit).width : 0;
            const testTotal = (caption ? testCW + gapBase : 0) + testVW + (unit ? gapBase + testUW : 0);
            const ok = testTotal <= (W - padX * 2) && testVPx <= maxH && testSPx <= maxH;

            if (ok) {
              best = mid;
              lo = mid;
            } else {
              hi = mid;
            }
          }

          vPx = Math.floor(best);
          sPx = Math.floor(best * secScale);
          textLayout.setFont(ctx, sPx, labelWeight, family);
          cW = caption ? ctx.measureText(caption).width : 0;
          textLayout.setFont(ctx, vPx, valueWeight, family);
          vW = ctx.measureText(value).width;
          textLayout.setFont(ctx, sPx, labelWeight, family);
          uW = unit ? ctx.measureText(unit).width : 0;
          total = (caption ? cW + gapBase : 0) + vW + (unit ? gapBase + uW : 0);

          fitCache.flat = { key, result: { vPx, sPx, cW, vW, uW, total } };
        }

        let x = Math.floor((W - total) / 2);
        const y = Math.floor(H/2);
        ctx.textAlign = 'left';

        if (caption){ textLayout.setFont(ctx, sPx, labelWeight, family); ctx.fillText(caption, x, y); x += cW + gapBase; }
        textLayout.setFont(ctx, vPx, valueWeight, family); ctx.fillText(value, x, y); x += vW;
        if (unit){ x += gapBase; textLayout.setFont(ctx, sPx, labelWeight, family); ctx.fillText(unit, x, y); }

        if (props.disconnect) textLayout.drawDisconnectOverlay(ctx, W, H, family, color, null, labelWeight);
      }
    }

    // No translation here — ClusterWidget handles it.
    function translateFunction(){ return {}; }

    return {
      // Keep the module id stable for the plugin loader.
      id: "ThreeValueTextWidget",
      version: "4.3.0",
      // ThreeValueTextWidget controls the full look of the widget; hide native head.
      wantsHideNativeHead: true,
      renderCanvas,
      translateFunction
    };
  }

  return { id: "ThreeValueTextWidget", create };
}));
