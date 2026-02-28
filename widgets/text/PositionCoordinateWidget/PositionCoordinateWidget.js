/**
 * Module: PositionCoordinateWidget - Stacked latitude/longitude renderer for nav position kinds
 * Documentation: documentation/widgets/position-coordinates.md
 * Depends: ThemeResolver, TextLayoutEngine, Helpers.applyFormatter, Helpers.setupCanvas, Helpers.resolveTextColor, Helpers.resolveFontFamily
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
  function readCoordinatePair(value, rawMode) {
    if (!value || typeof value !== "object") {
      return null;
    }
    const lonRaw = Array.isArray(value) ? value[0] : value.lon;
    const latRaw = Array.isArray(value) ? value[1] : value.lat;
    if (Array.isArray(value) && value.length < 2) {
      return null;
    }
    if (rawMode) {
      return { lat: latRaw, lon: lonRaw };
    }
    const lat = Number(latRaw);
    const lon = Number(lonRaw);
    return isFinite(lat) && isFinite(lon) ? { lat: lat, lon: lon } : null;
  }
  function pickAxisFormatter(props, axis) {
    const p = props || {};
    const suffix = axis === "lat" ? "Lat" : "Lon";
    const formatterKey = "coordinateFormatter" + suffix;
    const paramsKey = "coordinateFormatterParameters" + suffix;
    const paramsRaw = Object.prototype.hasOwnProperty.call(p, paramsKey) ? p[paramsKey] : p.coordinateFormatterParameters;
    const hasOverride = Object.prototype.hasOwnProperty.call(p, formatterKey);
    return {
      formatter: hasOverride
        ? p[formatterKey]
        : (typeof p.coordinateFormatter !== "undefined" ? p.coordinateFormatter : "formatLonLatsDecimal"),
      params: Array.isArray(paramsRaw) ? paramsRaw.slice() : (typeof paramsRaw === "string" ? paramsRaw.split(",") : []),
      appendAxisParam: !hasOverride
    };
  }
  function formatAxisValue(rawValue, axis, fallbackText, props, Helpers) {
    const rawMode = props && props.coordinateRawValues === true;
    if (rawMode) {
      if (rawValue == null || (typeof rawValue === "number" && Number.isNaN(rawValue))) {
        return fallbackText;
      }
    } else {
      const n = Number(rawValue);
      if (!isFinite(n)) {
        return fallbackText;
      }
      rawValue = n;
    }
    const cfg = pickAxisFormatter(props, axis);
    if (cfg.appendAxisParam) cfg.params.push(axis);
    const out = String(Helpers.applyFormatter(rawValue, {
      formatter: cfg.formatter,
      formatterParameters: cfg.params,
      default: fallbackText
    }));
    return out.trim() ? out : fallbackText;
  }
  function isTimeStatusMarker(text) {
    return String(text == null ? "" : text).trim() === STATUS_OK ||
      String(text == null ? "" : text).trim() === STATUS_BAD;
  }
  function readActualTextHeight(metrics) {
    const ascent = Number(metrics && metrics.actualBoundingBoxAscent);
    const descent = Number(metrics && metrics.actualBoundingBoxDescent);
    const total = ascent + descent;
    if (!Number.isFinite(ascent) || !Number.isFinite(descent) || !(total > 0)) {
      return null;
    }
    return total;
  }
  function create(def, Helpers) {
    const theme = Helpers.getModule("ThemeResolver").create(def, Helpers);
    const text = Helpers.getModule("TextLayoutEngine").create(def, Helpers);
    const fitCache = text.createFitCache(["flat", "stacked"]);
    function renderCanvas(canvas, props) {
      const p = props || {};
      const setup = Helpers.setupCanvas(canvas);
      const ctx = setup && setup.ctx;
      const W = setup && setup.W;
      const H = setup && setup.H;
      if (!ctx || !W || !H) {
        return;
      }
      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = "middle";
      const tokens = theme.resolve(canvas);
      const family = Helpers.resolveFontFamily(canvas);
      const color = Helpers.resolveTextColor(canvas);
      const valueWeight = tokens.font.weight;
      const labelWeight = tokens.font.labelWeight;
      ctx.fillStyle = color;
      const modeData = text.computeModeLayout({
        W: W, H: H,
        ratioThresholdNormal: p.ratioThresholdNormal,
        ratioThresholdFlat: p.ratioThresholdFlat,
        captionUnitScale: p.captionUnitScale,
        captionText: p.caption,
        unitText: p.unit
      });
      const insets = text.computeInsets(W, H);
      const fallbackText = (p.default == null) ? "---" : String(p.default);
      if (modeData.mode === "flat") {
        const pairRaw = readCoordinatePair(p.value, true);
        const useAxisFlat = !!p.coordinateFlatFromAxes;
        const topText = useAxisFlat
          ? formatAxisValue(pairRaw ? pairRaw.lat : null, "lat", fallbackText, p, Helpers)
          : "";
        const bottomText = useAxisFlat
          ? formatAxisValue(pairRaw ? pairRaw.lon : null, "lon", fallbackText, p, Helpers)
          : "";
        const valueText = String(useAxisFlat
          ? ((topText + " " + bottomText).trim() || fallbackText)
          : Helpers.applyFormatter(p.value, p));
        const statusEmoji = useAxisFlat && isTimeStatusMarker(topText);
        const key = text.makeFitCacheKey({
          mode: "flat",
          W: W, H: H,
          caption: modeData.caption, unit: modeData.unit,
          value: valueText,
          secScale: modeData.secScale,
          family: family,
          valueWeight: valueWeight, labelWeight: labelWeight,
          statusEmoji: statusEmoji
        });
        const fit = text.resolveFitCache(fitCache, "flat", key, function () {
          return text.fitInlineTriplet({
            ctx: ctx,
            captionText: modeData.caption,
            valueText: valueText,
            unitText: modeData.unit,
            secScale: modeData.secScale,
            gap: insets.gapBase,
            maxW: W - insets.padX * 2,
            maxH: Math.max(10, H - insets.innerY * 2),
            family: family,
            valueWeight: valueWeight,
            labelWeight: labelWeight,
            extraValueCheck: function (meta) {
              if (!statusEmoji) {
                return true;
              }
              const safeHeight = meta.maxH * TIME_STATUS_FALLBACK_SCALE;
              const h = readActualTextHeight(meta.valueMetrics);
              return h == null ? meta.valuePx <= safeHeight : h <= safeHeight;
            }
          });
        });
        text.drawInlineTriplet({
          ctx: ctx,
          fit: fit,
          captionText: modeData.caption,
          valueText: valueText,
          unitText: modeData.unit,
          x: 0, y: 0,
          W: W, H: H,
          family: family,
          valueWeight: valueWeight,
          labelWeight: labelWeight
        });
      } else {
        const parsed = readCoordinatePair(p.value, p.coordinateRawValues === true);
        const latText = parsed
          ? formatAxisValue(parsed.lat, "lat", fallbackText, p, Helpers)
          : fallbackText;
        const lonText = parsed
          ? formatAxisValue(parsed.lon, "lon", fallbackText, p, Helpers)
          : fallbackText;
        const topStatusEmoji = isTimeStatusMarker(latText);
        const key = text.makeFitCacheKey({
          mode: modeData.mode,
          W: W, H: H,
          caption: modeData.caption, unit: modeData.unit,
          latText: latText, lonText: lonText,
          secScale: modeData.secScale,
          family: family,
          valueWeight: valueWeight, labelWeight: labelWeight
        });
        const fit = text.resolveFitCache(fitCache, "stacked", key, function () {
          return text.fitTwoRowsWithHeader({
            ctx: ctx,
            mode: modeData.mode,
            W: W,
            H: H,
            padX: insets.padX,
            innerY: insets.innerY,
            secScale: modeData.secScale,
            captionText: modeData.caption,
            unitText: modeData.unit,
            topText: latText,
            bottomText: lonText,
            family: family,
            valueWeight: valueWeight,
            labelWeight: labelWeight,
            topRowExtraCheck: function (meta) {
              if (!topStatusEmoji) {
                return true;
              }
              const safeHeight = meta.maxH * TIME_STATUS_FALLBACK_SCALE;
              const h = readActualTextHeight(meta.metrics);
              return h == null ? meta.px <= safeHeight : h <= safeHeight;
            }
          });
        });
        text.drawTwoRowsWithHeader({
          ctx: ctx,
          fit: fit,
          W: W, padX: insets.padX,
          captionText: modeData.caption, unitText: modeData.unit,
          topText: latText, bottomText: lonText,
          family: family,
          valueWeight: valueWeight,
          labelWeight: labelWeight
        });
      }
      if (p.disconnect) {
        text.drawDisconnectOverlay({
          ctx: ctx,
          W: W, H: H,
          family: family,
          color: color,
          labelWeight: labelWeight
        });
      }
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
