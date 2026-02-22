/**
 * Module: PositionCoordinateWidget - Stacked latitude/longitude renderer for nav position kinds
 * Documentation: documentation/widgets/position-coordinates.md
 * Depends: ThemeResolver, GaugeTextLayout, GaugeValueMath, Helpers.applyFormatter, Helpers.setupCanvas, Helpers.resolveTextColor, Helpers.resolveFontFamily
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniPositionCoordinateWidget = factory(); }
}(this, function () {
  "use strict";

  const STATUS_OK = "\ud83d\udfe2";
  const STATUS_BAD = "\ud83d\udd34";
  const TIME_STATUS_FALLBACK_SCALE = 0.82;

  function parseLonLat(value) {
    if (!value || typeof value !== "object") {
      return null;
    }

    if (Array.isArray(value)) {
      if (value.length < 2) {
        return null;
      }
      const lon = Number(value[0]);
      const lat = Number(value[1]);
      if (!isFinite(lat) || !isFinite(lon)) {
        return null;
      }
      return { lat: lat, lon: lon };
    }

    const lat = Number(value.lat);
    const lon = Number(value.lon);
    if (!isFinite(lat) || !isFinite(lon)) {
      return null;
    }
    return { lat: lat, lon: lon };
  }

  function readLonLatRaw(value) {
    if (!value || typeof value !== "object") {
      return null;
    }

    if (Array.isArray(value)) {
      if (value.length < 2) {
        return null;
      }
      return { lon: value[0], lat: value[1] };
    }

    return { lat: value.lat, lon: value.lon };
  }

  function parseFormatterParams(raw) {
    if (Array.isArray(raw)) {
      return raw.slice();
    }
    if (typeof raw === "string") {
      return raw.split(",");
    }
    return [];
  }

  function pickCoordinateFormatter(props, axis) {
    const p = props || {};
    const axisSuffix = axis === "lat" ? "Lat" : "Lon";
    const formatterKey = "coordinateFormatter" + axisSuffix;
    const paramsKey = "coordinateFormatterParameters" + axisSuffix;
    const hasAxisOverride = Object.prototype.hasOwnProperty.call(p, formatterKey);

    const formatter = hasAxisOverride
      ? p[formatterKey]
      : ((typeof p.coordinateFormatter !== "undefined")
        ? p.coordinateFormatter
        : "formatLonLatsDecimal");

    const paramsRaw = (Object.prototype.hasOwnProperty.call(p, paramsKey))
      ? p[paramsKey]
      : p.coordinateFormatterParameters;

    return {
      formatter: formatter,
      params: parseFormatterParams(paramsRaw),
      appendAxisParam: !hasAxisOverride
    };
  }

  function formatCoordinate(value, axis, fallbackText, props, Helpers) {
    const p = props || {};
    const rawMode = p.coordinateRawValues === true;
    let raw = value;

    if (rawMode) {
      if (raw == null || (typeof raw === "number" && Number.isNaN(raw))) {
        return fallbackText;
      }
    } else {
      const n = Number(value);
      if (!isFinite(n)) {
        return fallbackText;
      }
      raw = n;
    }

    const cfg = pickCoordinateFormatter(p, axis);
    const baseParams = cfg.params;
    if (cfg.appendAxisParam) {
      baseParams.push(axis);
    }

    const out = String(Helpers.applyFormatter(raw, {
      formatter: cfg.formatter,
      formatterParameters: baseParams,
      default: fallbackText
    }));
    if (!out.trim()) {
      return fallbackText;
    }

    return out;
  }

  function isTimeStatusMarker(text) {
    const raw = (text == null) ? "" : String(text);
    const marker = raw.trim();
    return marker === STATUS_OK || marker === STATUS_BAD;
  }

  function readActualTextHeight(metrics) {
    if (!metrics || typeof metrics !== "object") {
      return null;
    }
    const ascent = Number(metrics.actualBoundingBoxAscent);
    const descent = Number(metrics.actualBoundingBoxDescent);
    if (!Number.isFinite(ascent) || !Number.isFinite(descent)) {
      return null;
    }
    const total = ascent + descent;
    if (!(total > 0)) {
      return null;
    }
    return total;
  }

  function buildFlatAxesTextMeta(value, fallbackText, props, Helpers) {
    const raw = readLonLatRaw(value);
    if (!raw) {
      return {
        topText: fallbackText,
        bottomText: fallbackText,
        joinedText: fallbackText,
        isTimeStatusEmoji: false
      };
    }

    const topText = formatCoordinate(raw.lat, "lat", fallbackText, props, Helpers);
    const bottomText = formatCoordinate(raw.lon, "lon", fallbackText, props, Helpers);
    const joined = (topText + " " + bottomText).trim();
    return {
      topText: topText,
      bottomText: bottomText,
      joinedText: joined || fallbackText,
      isTimeStatusEmoji: isTimeStatusMarker(topText)
    };
  }

  function create(def, Helpers) {
    const theme = Helpers.getModule("ThemeResolver").create(def, Helpers);
    const textLayout = Helpers.getModule("GaugeTextLayout").create(def, Helpers);
    const valueMath = Helpers.getModule("GaugeValueMath").create(def, Helpers);

    function renderCanvas(canvas, props) {
      const p = props || {};
      const setup = Helpers.setupCanvas(canvas);
      const ctx = setup && setup.ctx;
      const W = setup && setup.W;
      const H = setup && setup.H;
      if (!ctx || !W || !H) {
        return;
      }

      const tNormal = Number(p.ratioThresholdNormal ?? 1.0);
      const tFlat = Number(p.ratioThresholdFlat ?? 3.0);
      const ratio = W / Math.max(1, H);
      const mode = valueMath.computeMode(ratio, tNormal, tFlat);

      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = "middle";
      const tokens = theme.resolve(canvas);
      const valueWeight = tokens.font.weight;
      const labelWeight = tokens.font.labelWeight;

      const family = Helpers.resolveFontFamily(canvas);
      const color = Helpers.resolveTextColor(canvas);
      ctx.fillStyle = color;

      const caption = (p.caption || "").trim();
      const unit = (p.unit || "").trim();
      const secScale = valueMath.clamp(p.captionUnitScale ?? 0.8, 0.3, 3.0);
      const fallbackText = (p.default == null) ? "---" : String(p.default);

      if (mode === "flat") {
        const useAxisFlat = !!p.coordinateFlatFromAxes;
        const flatMeta = useAxisFlat
          ? buildFlatAxesTextMeta(p.value, fallbackText, p, Helpers)
          : null;
        const value = String(useAxisFlat
          ? flatMeta.joinedText
          : Helpers.applyFormatter(p.value, p));
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

          textLayout.setFont(ctx, vPx, valueWeight, family);
          const valueMetrics = ctx.measureText(value);
          const vW = valueMetrics.width;

          textLayout.setFont(ctx, sPx, labelWeight, family);
          const cW = caption ? ctx.measureText(caption).width : 0;
          const uW = unit ? ctx.measureText(unit).width : 0;

          const total = (caption ? cW + gapBase : 0) + vW + (unit ? gapBase + uW : 0);
          let valueHeightOk = vPx <= maxH;
          if (flatMeta && flatMeta.isTimeStatusEmoji) {
            const safeHeight = maxH * TIME_STATUS_FALLBACK_SCALE;
            const measuredHeight = readActualTextHeight(valueMetrics);
            valueHeightOk = measuredHeight == null
              ? vPx <= safeHeight
              : measuredHeight <= safeHeight;
          }
          const ok = total <= (W - padX * 2) && valueHeightOk && sPx <= maxH;

          if (ok) {
            best = mid;
            lo = mid;
          } else {
            hi = mid;
          }
        }

        const vPx = Math.floor(best);
        const sPx = Math.floor(best * secScale);

        textLayout.setFont(ctx, sPx, labelWeight, family);
        const cW = caption ? ctx.measureText(caption).width : 0;
        textLayout.setFont(ctx, vPx, valueWeight, family);
        const vW = ctx.measureText(value).width;
        textLayout.setFont(ctx, sPx, labelWeight, family);
        const uW = unit ? ctx.measureText(unit).width : 0;

        const total = (caption ? cW + gapBase : 0) + vW + (unit ? gapBase + uW : 0);
        let x = Math.floor((W - total) / 2);
        const y = Math.floor(H / 2);
        ctx.textAlign = "left";

        if (caption) {
          textLayout.setFont(ctx, sPx, labelWeight, family);
          ctx.fillText(caption, x, y);
          x += cW + gapBase;
        }
        textLayout.setFont(ctx, vPx, valueWeight, family);
        ctx.fillText(value, x, y);
        x += vW;
        if (unit) {
          x += gapBase;
          textLayout.setFont(ctx, sPx, labelWeight, family);
          ctx.fillText(unit, x, y);
        }

        if (p.disconnect) textLayout.drawDisconnectOverlay(ctx, W, H, family, color, null, labelWeight);
        return;
      }

      const parsed = (p.coordinateRawValues === true)
        ? readLonLatRaw(p.value)
        : parseLonLat(p.value);
      const latText = parsed
        ? formatCoordinate(parsed.lat, "lat", fallbackText, p, Helpers)
        : fallbackText;
      const lonText = parsed
        ? formatCoordinate(parsed.lon, "lon", fallbackText, p, Helpers)
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
      const latPx = textLayout.fitSingleTextPx(ctx, latText, lineBase, maxRowW, maxRowH, family, valueWeight);
      const lonPx = textLayout.fitSingleTextPx(ctx, lonText, lineBase, maxRowW, maxRowH, family, valueWeight);
      let linePx = Math.max(1, Math.min(latPx, lonPx));
      if (isTimeStatusMarker(latText)) {
        const safeRowHeight = maxRowH * TIME_STATUS_FALLBACK_SCALE;
        textLayout.setFont(ctx, linePx, valueWeight, family);
        const latMetrics = ctx.measureText(latText);
        const measuredHeight = readActualTextHeight(latMetrics);
        if (measuredHeight == null) {
          linePx = Math.max(1, Math.min(linePx, Math.floor(safeRowHeight)));
        } else if (measuredHeight > safeRowHeight) {
          const scale = safeRowHeight / measuredHeight;
          linePx = Math.max(1, Math.floor(linePx * scale));
        }
      }

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
          ? textLayout.fitSingleTextPx(ctx, caption, headerBase, capMaxW, maxHeaderH, family, labelWeight)
          : 0;
        const unitPx = unit
          ? textLayout.fitSingleTextPx(ctx, unit, Math.floor(headerBase * secScale), unitMaxW, maxHeaderH, family, labelWeight)
          : 0;
        const yHeader = Math.floor(headerH / 2);

        if (caption) {
          ctx.textAlign = "left";
          textLayout.setFont(ctx, capPx, labelWeight, family);
          ctx.fillText(caption, padX, yHeader);
        }
        if (unit) {
          ctx.textAlign = "right";
          textLayout.setFont(ctx, unitPx, labelWeight, family);
          ctx.fillText(unit, W - padX, yHeader);
        }
      }

      const yLat = headerH + Math.floor(row1H / 2);
      const yLon = headerH + row1H + Math.floor(row2H / 2);
      ctx.textAlign = "center";
      textLayout.setFont(ctx, linePx, valueWeight, family);
      ctx.fillText(latText, Math.floor(W / 2), yLat);
      ctx.fillText(lonText, Math.floor(W / 2), yLon);

      if (p.disconnect) textLayout.drawDisconnectOverlay(ctx, W, H, family, color, null, labelWeight);
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
