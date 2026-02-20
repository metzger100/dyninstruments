/**
 * Module: PositionCoordinateWidget - Stacked latitude/longitude renderer for nav position kinds
 * Documentation: documentation/widgets/position-coordinates.md
 * Depends: GaugeTextLayout, GaugeValueMath, Helpers.applyFormatter, Helpers.setupCanvas, Helpers.resolveTextColor, Helpers.resolveFontFamily
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniPositionCoordinateWidget = factory(); }
}(this, function () {
  "use strict";

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
    const textLayout = Helpers.getModule("GaugeTextLayout").create(def, Helpers);
    const valueMath = Helpers.getModule("GaugeValueMath").create(def, Helpers);

    function renderCanvas(canvas, props) {
      const p = props || {};
      const setup = Helpers.setupCanvas(canvas);
      const ctx = setup && setup.ctx;
      const W = setup && setup.W;
      const H = setup && setup.H;
      if (!ctx || !W || !H) return;

      const tNormal = Number(p.ratioThresholdNormal ?? 1.0);
      const tFlat = Number(p.ratioThresholdFlat ?? 3.0);
      const ratio = W / Math.max(1, H);
      const mode = valueMath.computeMode(ratio, tNormal, tFlat);

      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = "middle";

      const family = Helpers.resolveFontFamily(canvas);
      const color = Helpers.resolveTextColor(canvas);
      ctx.fillStyle = color;

      const caption = (p.caption || "").trim();
      const unit = (p.unit || "").trim();
      const secScale = valueMath.clamp(p.captionUnitScale ?? 0.8, 0.3, 3.0);
      const fallbackText = (p.default == null) ? "---" : String(p.default);

      if (mode === "flat") {
        const value = Helpers.applyFormatter(p.value, p);
        const padX = Math.max(6, Math.floor(Math.min(W, H) * 0.04));
        const innerY = Math.max(3, Math.floor(Math.min(W, H) * 0.035));
        const gapBase = Math.max(6, Math.floor(Math.min(W, H) * 0.06));
        const maxH = Math.max(10, H - innerY * 2);

        let lo = 8;
        let hi = H * 1.6;
        let best = 10;

        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) / 2;
          const vPx = Math.floor(mid);
          const sPx = Math.floor(mid * secScale);

          textLayout.setFont(ctx, vPx, true, family);
          const vW = ctx.measureText(value).width;

          textLayout.setFont(ctx, sPx, true, family);
          const cW = caption ? ctx.measureText(caption).width : 0;
          const uW = unit ? ctx.measureText(unit).width : 0;

          const total = (caption ? cW + gapBase : 0) + vW + (unit ? gapBase + uW : 0);
          const ok = total <= (W - padX * 2) && vPx <= maxH && sPx <= maxH;

          if (ok) {
            best = mid;
            lo = mid;
          } else {
            hi = mid;
          }
        }

        const vPx = Math.floor(best);
        const sPx = Math.floor(best * secScale);

        textLayout.setFont(ctx, sPx, true, family);
        const cW = caption ? ctx.measureText(caption).width : 0;
        textLayout.setFont(ctx, vPx, true, family);
        const vW = ctx.measureText(value).width;
        textLayout.setFont(ctx, sPx, true, family);
        const uW = unit ? ctx.measureText(unit).width : 0;

        const total = (caption ? cW + gapBase : 0) + vW + (unit ? gapBase + uW : 0);
        let x = Math.floor((W - total) / 2);
        const y = Math.floor(H / 2);
        ctx.textAlign = "left";

        if (caption) {
          textLayout.setFont(ctx, sPx, true, family);
          ctx.fillText(caption, x, y);
          x += cW + gapBase;
        }
        textLayout.setFont(ctx, vPx, true, family);
        ctx.fillText(value, x, y);
        x += vW;
        if (unit) {
          x += gapBase;
          textLayout.setFont(ctx, sPx, true, family);
          ctx.fillText(unit, x, y);
        }

        if (p.disconnect) textLayout.drawDisconnectOverlay(ctx, W, H, family, color);
        return;
      }

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
      const latPx = textLayout.fitSingleTextPx(ctx, latText, lineBase, maxRowW, maxRowH, family, true);
      const lonPx = textLayout.fitSingleTextPx(ctx, lonText, lineBase, maxRowW, maxRowH, family, true);
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
          ? textLayout.fitSingleTextPx(ctx, caption, headerBase, capMaxW, maxHeaderH, family, true)
          : 0;
        const unitPx = unit
          ? textLayout.fitSingleTextPx(ctx, unit, Math.floor(headerBase * secScale), unitMaxW, maxHeaderH, family, true)
          : 0;
        const yHeader = Math.floor(headerH / 2);

        if (caption) {
          ctx.textAlign = "left";
          textLayout.setFont(ctx, capPx, true, family);
          ctx.fillText(caption, padX, yHeader);
        }
        if (unit) {
          ctx.textAlign = "right";
          textLayout.setFont(ctx, unitPx, true, family);
          ctx.fillText(unit, W - padX, yHeader);
        }
      }

      const yLat = headerH + Math.floor(row1H / 2);
      const yLon = headerH + row1H + Math.floor(row2H / 2);
      ctx.textAlign = "center";
      textLayout.setFont(ctx, linePx, true, family);
      ctx.fillText(latText, Math.floor(W / 2), yLat);
      ctx.fillText(lonText, Math.floor(W / 2), yLon);

      if (p.disconnect) textLayout.drawDisconnectOverlay(ctx, W, H, family, color);
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
