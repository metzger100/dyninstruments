/*!
 * ThreeValueTextWidget (UMD) — responsive caption/value/unit
 * Pure canvas renderer; cluster-specific translation is handled by ClusterWidget.
 *
 * New behavior (normal & high modes):
 * - "Caption/Unit to Value scale" still defines the initial font sizes across rows.
 * - If a particular row would overflow (by width/height), we downscale that row
 *   independently while preserving the *within-row* scale (e.g. value+unit keep
 *   their relative ratio in the top row). Other rows keep their chosen size.
 *
 * Flat mode (single row) remains coupled: caption/value/unit shrink together.
 *
 * Additional collapsing rules:
 * - If caption is empty: 3-rows and 2-rows collapse to 1-row (flat).
 * - If unit is empty: 3-rows collapses to 2-rows.
 * - If both are empty: 3-rows and 2-rows collapse to 1-row (flat).
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniThreeValueTextWidget = factory(); }
}(this, function () {
  "use strict";

  function setFont(ctx, px, bold, family){ ctx.font = (bold ? '700 ' : '400 ') + px + 'px ' + family; }

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

  function clamp(n, lo, hi){ n = Number(n); if (!isFinite(n)) return lo; return Math.max(lo, Math.min(hi, n)); }

  // ---- helpers for sizing ---------------------------------------------------

  function fitSingleTextPx(ctx, text, basePx, maxW, maxH, family, bold){
    let px = Math.max(1, Math.floor(Math.min(basePx, maxH)));
    if (!text) return px;
    setFont(ctx, px, !!bold, family);
    const w = ctx.measureText(text).width;
    if (w <= maxW + 0.01) return px;
    const scale = Math.max(0.1, (maxW / Math.max(1, w)));
    px = Math.max(1, Math.floor(px * scale));
    return Math.min(px, Math.floor(maxH));
  }

  function fitValueUnitRowPx(ctx, valueText, unitText, baseValuePx, secScale, gap, maxW, maxH, family){
    let vPx = Math.max(1, Math.floor(Math.min(baseValuePx, maxH)));
    let uPx = Math.max(1, Math.floor(Math.min(Math.floor(vPx * secScale), maxH)));

    setFont(ctx, vPx, true, family);
    const vW = valueText ? ctx.measureText(valueText).width : 0;

    setFont(ctx, uPx, true, family);
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

  function create(def, Helpers) {

    function renderCanvas(canvas, props){
      const { ctx, W, H } = Helpers.setupCanvas(canvas);
      if (!W || !H) return;
      ctx.clearRect(0,0,W,H);
      ctx.textBaseline = 'middle';

      const family = Helpers.resolveFontFamily(canvas);
      const color  = Helpers.resolveTextColor(canvas);
      ctx.fillStyle = color;

      const caption = (props.caption || '').trim();
      const unit    = (props.unit || '').trim();
      const value   = Helpers.applyFormatter(props.value, props);

      const ratio   = W / Math.max(1, H);
      const tNormal = Number(props.ratioThresholdNormal ?? 1.0);
      const tFlat   = Number(props.ratioThresholdFlat   ?? 3.0);

      // Unified scale for caption & unit relative to value font.
      const secScale = clamp(props.captionUnitScale ?? 0.8, 0.3, 3.0);

      // Decide base mode from aspect ratio thresholds
      let baseMode; // 'high' (3 rows), 'normal' (2 rows), 'flat' (1 row)
      if (ratio < tNormal)      baseMode = 'high';
      else if (ratio > tFlat)   baseMode = 'flat';
      else                      baseMode = 'normal';

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
        const wTop = secScale, wMid = 1, wBot = secScale;
        const wSum = wTop + wMid + wBot;

        let hTop = Math.round(H * (wTop / wSum));
        let hMid = Math.round(H * (wMid / wSum));
        let hBot = H - hTop - hMid;

        const maxHTop = Math.max(8,  hTop - innerY*2);
        const maxHMid = Math.max(10, hMid - innerY*2);
        const maxHBot = Math.max(8,  hBot -   innerY*2);

        const maxWTop = Math.max(10, W - padX*2);
        const maxWMid = Math.max(10, W - padX*2);
        const maxWBot = Math.max(10, W - padX*2);

        const vBaseH = Math.floor(maxHMid);
        let vPx = fitSingleTextPx(ctx, value, vBaseH, maxWMid, maxHMid, family, /*bold*/true);

        const cBaseH = Math.min(Math.floor(vBaseH * secScale), maxHTop);
        const uBaseH = Math.min(Math.floor(vBaseH * secScale), maxHBot);

        const cPx = caption ? fitSingleTextPx(
          ctx, caption, cBaseH, maxWTop, maxHTop, family, /*bold*/true
        ) : 0;

        const uPx = unit ? fitSingleTextPx(
          ctx, unit,    uBaseH, maxWBot, maxHBot, family, /*bold*/true
        ) : 0;

        if (caption){
          const yTop = Math.floor(hTop/2);
          setFont(ctx, cPx, true, family);
          ctx.textAlign = 'left';
          ctx.fillText(caption, padX, yTop);
        }

        {
          const yMid = Math.floor(hTop + hMid/2);
          setFont(ctx, vPx, true, family);
          ctx.textAlign = 'center';
          ctx.fillText(value, Math.floor(W/2), yMid);
        }

        if (unit){
          const yBot = Math.floor(hTop + hMid + hBot/2);
          setFont(ctx, uPx, true, family);
          ctx.textAlign = 'right';
          ctx.fillText(unit, W - padX, yBot);
        }

        if (props.disconnect) drawDisconnectOverlay(ctx, W, H, family, color);
        return;
      }

      // ---- 2-row layout (Top: Value+Unit, Bottom: Caption) -----------------
      if (mode === 'normal'){
        const wTop = 1, wBot = secScale, wSum = wTop + wBot;
        let hTop = Math.round(H * (wTop / wSum));
        let hBot = H - hTop;

        const maxHTop = Math.max(10, hTop - innerY*2);
        const maxHBot = Math.max(8,  hBot - innerY*2);

        const maxWTop = Math.max(10, W - padX*2);
        const maxWBot = Math.max(10, W - padX*2);

        const vBaseH = Math.floor(maxHTop);
        const pair = fitValueUnitRowPx(
          ctx, value, unit, vBaseH, secScale, /*gap*/gapBase, maxWTop, maxHTop, family
        );
        let vPx = pair.vPx;
        let uPx = unit ? pair.uPx : 0;

        const cBaseH = Math.min(Math.floor(vBaseH * secScale), maxHBot);
        const cPx = caption ? fitSingleTextPx(
          ctx, caption, cBaseH, maxWBot, maxHBot, family, /*bold*/true
        ) : 0;

        {
          setFont(ctx, vPx, true, family); const vW = ctx.measureText(value).width;
          let uW = 0;
          if (unit){ setFont(ctx, uPx, true, family); uW = ctx.measureText(unit).width; }
          const total = vW + (unit ? gapBase + uW : 0);
          let x = Math.floor((W - total)/2);
          const y = Math.floor(hTop/2);
          ctx.textAlign = 'left';
          setFont(ctx, vPx, true, family); ctx.fillText(value, x, y); x += vW;
          if (unit){ x += gapBase; setFont(ctx, uPx, true, family); ctx.fillText(unit, x, y); }
        }

        if (caption){
          const y = Math.floor(hTop + hBot/2);
          setFont(ctx, cPx, true, family);
          ctx.textAlign = 'left';
          ctx.fillText(caption, padX, y);
        }

        if (props.disconnect) drawDisconnectOverlay(ctx, W, H, family, color);
        return;
      }

      // ---- 1-row flat layout (Caption, Value, Unit in one line) ------------
      {
        const maxH = Math.max(10, H - innerY*2);
        let lo = 8, hi = H*1.6, best = 10;

        for (let i=0;i<14;i++){
          const mid = (lo + hi)/2;
          const vPx = Math.floor(mid);
          const sPx = Math.floor(mid * secScale);

          setFont(ctx, vPx, true, family);
          const vW = ctx.measureText(value).width;

          setFont(ctx, sPx, true, family);
          const cW = caption ? ctx.measureText(caption).width : 0;
          const uW = unit ? ctx.measureText(unit).width : 0;

          const total = (caption ? cW + gapBase : 0) + vW + (unit ? gapBase + uW : 0);
          const ok = total <= (W - padX*2) && vPx <= maxH && sPx <= maxH;

          if (ok){ best = mid; lo = mid; } else hi = mid;
        }

        const vPx = Math.floor(best);
        const sPx = Math.floor(best * secScale);

        setFont(ctx, sPx, true, family); const cW = caption ? ctx.measureText(caption).width : 0;
        setFont(ctx, vPx, true, family); const vW = ctx.measureText(value).width;
        setFont(ctx, sPx, true, family); const uW = unit ? ctx.measureText(unit).width : 0;

        const total = (caption ? cW + gapBase : 0) + vW + (unit ? gapBase + uW : 0);
        let x = Math.floor((W - total)/2);
        const y = Math.floor(H/2);
        ctx.textAlign = 'left';

        if (caption){ setFont(ctx, sPx, true, family); ctx.fillText(caption, x, y); x += cW + gapBase; }
        setFont(ctx, vPx, true, family); ctx.fillText(value, x, y); x += vW;
        if (unit){ x += gapBase; setFont(ctx, sPx, true, family); ctx.fillText(unit, x, y); }

        if (props.disconnect) drawDisconnectOverlay(ctx, W, H, family, color);
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
