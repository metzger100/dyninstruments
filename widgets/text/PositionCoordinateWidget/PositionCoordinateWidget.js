/**
 * Module: PositionCoordinateWidget - Stacked latitude/longitude renderer for nav position kinds
 * Documentation: documentation/widgets/position-coordinates.md
 * Depends: ThreeValueTextWidget, Helpers.setupCanvas, Helpers.resolveTextColor, Helpers.resolveFontFamily
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniPositionCoordinateWidget = factory(); }
}(this, function () {
  "use strict";

  function setFont(ctx, px, bold, family) {
    ctx.font = (bold ? "700 " : "400 ") + px + "px " + family;
  }

  function clamp(n, lo, hi) {
    n = Number(n);
    if (!isFinite(n)) return lo;
    return Math.max(lo, Math.min(hi, n));
  }

  function fitSingleTextPx(ctx, text, basePx, maxW, maxH, family, bold) {
    let px = Math.max(1, Math.floor(Math.min(basePx, maxH)));
    if (!text) return px;
    setFont(ctx, px, !!bold, family);
    const w = ctx.measureText(text).width;
    if (w <= maxW + 0.01) return px;
    const scale = Math.max(0.1, (maxW / Math.max(1, w)));
    px = Math.max(1, Math.floor(px * scale));
    return Math.min(px, Math.floor(maxH));
  }

  function drawDisconnectOverlay(ctx, W, H, family, color) {
    ctx.save();
    ctx.globalAlpha = 0.20;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    const px = Math.max(12, Math.floor(Math.min(W, H) * 0.18));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    setFont(ctx, px, true, family);
    ctx.fillText("NO DATA", Math.floor(W / 2), Math.floor(H / 2));
    ctx.restore();
  }

  function parseLonLat(value) {
    if (!value || typeof value !== "object") return null;

    if (Array.isArray(value)) {
      if (value.length < 2) return null;
      const lon = Number(value[0]);
      const lat = Number(value[1]);
      if (!isFinite(lat) || !isFinite(lon)) return null;
      return { lat: lat, lon: lon };
    }

    const lat = Number(value.lat);
    const lon = Number(value.lon);
    if (!isFinite(lat) || !isFinite(lon)) return null;
    return { lat: lat, lon: lon };
  }

  function getLonLatsDecimalFormatter() {
    const rootObj = (typeof globalThis !== "undefined")
      ? globalThis
      : ((typeof window !== "undefined") ? window : null);
    const fmt = rootObj && rootObj.avnav && rootObj.avnav.api && rootObj.avnav.api.formatter;
    if (!fmt || typeof fmt.formatLonLatsDecimal !== "function") return null;
    return { fn: fmt.formatLonLatsDecimal, ctx: fmt };
  }

  function formatCoordinate(value, axis, fallbackText, formatterSpec) {
    const n = Number(value);
    if (!isFinite(n)) return fallbackText;

    if (formatterSpec && typeof formatterSpec.fn === "function") {
      try {
        const out = formatterSpec.fn.call(formatterSpec.ctx, n, axis);
        if (out != null && String(out).trim()) return String(out);
      } catch (e) {}
    }

    return fallbackText;
  }

  function create(def, Helpers) {
    const threeSpec = Helpers.getModule("ThreeValueTextWidget").create(def, Helpers);

    function renderCanvas(canvas, props) {
      const p = props || {};
      const ratio = (canvas && typeof canvas.getBoundingClientRect === "function")
        ? (canvas.getBoundingClientRect().width / Math.max(1, canvas.getBoundingClientRect().height))
        : 1;

      const tNormal = Number(p.ratioThresholdNormal ?? 1.0);
      const tFlat = Number(p.ratioThresholdFlat ?? 3.0);
      let mode = "normal";
      if (ratio < tNormal) mode = "high";
      else if (ratio > tFlat) mode = "flat";

      if (mode === "flat" && threeSpec && typeof threeSpec.renderCanvas === "function") {
        return threeSpec.renderCanvas.apply(this, [canvas, p]);
      }

      const setup = Helpers.setupCanvas(canvas);
      const ctx = setup && setup.ctx;
      const W = setup && setup.W;
      const H = setup && setup.H;
      if (!ctx || !W || !H) return;

      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = "middle";

      const family = Helpers.resolveFontFamily(canvas);
      const color = Helpers.resolveTextColor(canvas);
      ctx.fillStyle = color;

      const caption = (p.caption || "").trim();
      const unit = (p.unit || "").trim();
      const secScale = clamp(p.captionUnitScale ?? 0.8, 0.3, 3.0);
      const fallbackText = (p.default == null) ? "---" : String(p.default);

      const parsed = parseLonLat(p.value);
      const formatterSpec = getLonLatsDecimalFormatter();
      const latText = parsed
        ? formatCoordinate(parsed.lat, "lat", fallbackText, formatterSpec)
        : fallbackText;
      const lonText = parsed
        ? formatCoordinate(parsed.lon, "lon", fallbackText, formatterSpec)
        : fallbackText;

      const padX = Math.max(6, Math.floor(Math.min(W, H) * 0.04));
      const innerY = Math.max(3, Math.floor(Math.min(W, H) * 0.035));
      const hasHeader = !!caption || !!unit;

      let headerH = 0;
      if (hasHeader) {
        const headerWeight = mode === "high" ? 0.24 : 0.30;
        headerH = Math.max(14, Math.floor(H * headerWeight));
        headerH = Math.min(headerH, Math.floor(H * 0.45));
      }

      const bodyH = Math.max(1, H - headerH);
      const row1H = Math.max(1, Math.floor(bodyH / 2));
      const row2H = Math.max(1, bodyH - row1H);

      const maxRowH = Math.max(10, Math.min(row1H, row2H) - innerY * 2);
      const maxRowW = Math.max(10, W - padX * 2);
      const lineBase = Math.floor(maxRowH);
      const latPx = fitSingleTextPx(ctx, latText, lineBase, maxRowW, maxRowH, family, true);
      const lonPx = fitSingleTextPx(ctx, lonText, lineBase, maxRowW, maxRowH, family, true);
      const linePx = Math.max(1, Math.min(latPx, lonPx));

      if (hasHeader) {
        const maxHeaderH = Math.max(8, headerH - innerY * 2);
        const headerBase = Math.min(maxHeaderH, Math.floor(linePx * secScale));
        const capMaxW = caption && unit
          ? Math.max(10, Math.floor((W - padX * 2) * 0.62))
          : Math.max(10, W - padX * 2);
        const unitMaxW = caption && unit
          ? Math.max(10, Math.floor((W - padX * 2) * 0.32))
          : Math.max(10, W - padX * 2);

        const capPx = caption
          ? fitSingleTextPx(ctx, caption, headerBase, capMaxW, maxHeaderH, family, true)
          : 0;
        const unitPx = unit
          ? fitSingleTextPx(ctx, unit, Math.floor(headerBase * secScale), unitMaxW, maxHeaderH, family, true)
          : 0;
        const yHeader = Math.floor(headerH / 2);

        if (caption) {
          ctx.textAlign = "left";
          setFont(ctx, capPx, true, family);
          ctx.fillText(caption, padX, yHeader);
        }
        if (unit) {
          ctx.textAlign = "right";
          setFont(ctx, unitPx, true, family);
          ctx.fillText(unit, W - padX, yHeader);
        }
      }

      const yLat = headerH + Math.floor(row1H / 2);
      const yLon = headerH + row1H + Math.floor(row2H / 2);
      ctx.textAlign = "center";
      setFont(ctx, linePx, true, family);
      ctx.fillText(latText, Math.floor(W / 2), yLat);
      ctx.fillText(lonText, Math.floor(W / 2), yLon);

      if (p.disconnect) drawDisconnectOverlay(ctx, W, H, family, color);
    }

    function translateFunction() { return {}; }

    return {
      id: "PositionCoordinateWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "PositionCoordinateWidget", create: create };
}));
