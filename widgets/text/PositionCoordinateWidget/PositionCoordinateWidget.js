/**
 * @file PositionCoordinateWidget - Stacked latitude/longitude renderer for nav position kinds
 * Documentation: documentation/widgets/position-coordinates.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniPositionCoordinateWidget = factory();
  }
}(this, function () {
  "use strict";
  /** @typedef {{ resolveForRoot(rootEl: unknown): { font: { family: string, familyMono?: string, weight: unknown, labelWeight: unknown }, surface: { fg: string }, opacity?: { caption?: unknown, unit?: unknown } } }} DyniPositionCoordinateThemeResolver */
  /** @typedef {DyniComponentContext & { theme: { tokens: DyniPositionCoordinateThemeResolver }, canvas: DyniCanvasHostApi }} DyniPositionCoordinateWidgetContext */

  const DISPLAY_VARIANT_POSITION = "position";
  const DISPLAY_VARIANT_DATE_TIME = "dateTime";
  const DISPLAY_VARIANT_TIME_STATUS = "timeStatus";
  const STATUS_OK = "\ud83d\udfe2";
  const STATUS_BAD = "\ud83d\udd34";
  const TIME_STATUS_SCALE_LIMIT = 0.82;

  /** @param {unknown} value @returns {string} */
  function normalizeDisplayVariant(value) {
    if (value === DISPLAY_VARIANT_DATE_TIME || value === DISPLAY_VARIANT_TIME_STATUS) {
      return value;
    }
    return DISPLAY_VARIANT_POSITION;
  }

  /** @param {unknown} value @param {boolean} rawMode @param {DyniValueMathApi["toOptionalFiniteNumber"]} toOptionalFiniteNumber */
  function readCoordinatePair(value, rawMode, toOptionalFiniteNumber) {
    if (!value || typeof value !== "object") {
      return null;
    }
    const point = /** @type {{ lat?: unknown, lon?: unknown }} */ (value);
    const lonRaw = Array.isArray(value) ? value[0] : point.lon;
    const latRaw = Array.isArray(value) ? value[1] : point.lat;
    if (Array.isArray(value) && value.length < 2) {
      return null;
    }
    if (rawMode) {
      return { lat: latRaw, lon: lonRaw };
    }
    const lat = toOptionalFiniteNumber(latRaw);
    const lon = toOptionalFiniteNumber(lonRaw);
    return Number.isFinite(lat) && Number.isFinite(lon) ? { lat: lat, lon: lon } : null;
  }

  /** @param {unknown} value @returns {boolean} */
  function isGpsValid(value) {
    if (value === true) {
      return true;
    }
    if (value === false || value == null) {
      return false;
    }
    if (typeof value === "number") {
      return Number.isFinite(value) && value !== 0;
    }
    if (typeof value === "string") {
      const text = value.trim().toLowerCase();
      if (!text || text === "0" || text === "false" || text === "off" || text === "no") {
        return false;
      }
      return true;
    }
    return !!value;
  }

  /** @param {unknown} raw @returns {string} */
  function statusCircleFormatter(raw) {
    return isGpsValid(raw) ? STATUS_OK : STATUS_BAD;
  }

  /** @param {DyniWidgetValues} props @returns {DyniWidgetValues} */
  function resolveVariantProps(props) {
    const p = props || {};
    const displayVariant = normalizeDisplayVariant(p.displayVariant);
    const timeFormatter = p.hideSeconds === true ? "formatClock" : "formatTime";

    if (displayVariant === DISPLAY_VARIANT_DATE_TIME) {
      return {
        ...p,
        displayVariant: displayVariant,
        coordinateFormatterLat: "formatDate",
        coordinateFormatterLon: timeFormatter,
        coordinateFlatFromAxes: true,
        coordinateRawValues: true
      };
    }

    if (displayVariant === DISPLAY_VARIANT_TIME_STATUS) {
      return {
        ...p,
        displayVariant: displayVariant,
        coordinateFormatterLat: statusCircleFormatter,
        coordinateFormatterLon: timeFormatter,
        coordinateFlatFromAxes: true,
        coordinateRawValues: true
      };
    }

    return p;
  }

  /** @param {DyniWidgetValues} props @param {"lat" | "lon"} axis */
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
  /** @param {unknown} rawValue @param {"lat" | "lon"} axis @param {string} defaultText @param {DyniWidgetValues} props @param {DyniComponentContext} componentContext @param {DyniPlaceholderNormalizeApi} placeholderNormalize @param {DyniValueMathApi["toOptionalFiniteNumber"]} toOptionalFiniteNumber */
  function formatAxisValue(rawValue, axis, defaultText, props, componentContext, placeholderNormalize, toOptionalFiniteNumber) {
    const rawMode = props && props.coordinateRawValues === true;
    if (rawMode) {
      if (rawValue == null || (typeof rawValue === "number" && Number.isNaN(rawValue))) {
        return defaultText;
      }
    } else {
      const n = toOptionalFiniteNumber(rawValue);
      if (typeof n !== "number") {
        return defaultText;
      }
      rawValue = n;
    }
    const cfg = pickAxisFormatter(props, axis);
    if (cfg.appendAxisParam) cfg.params.push(axis);
    const out = String(componentContext.format.applyFormatter(rawValue, {
      formatter: cfg.formatter,
      formatterParameters: cfg.params,
      default: defaultText
    }));
    return placeholderNormalize.normalize(out, defaultText);
  }
  /** @param {string} text @returns {boolean} */
  function isTimeStatusMarker(text) {
    const normalized = String(text).trim();
    return normalized === STATUS_OK || normalized === STATUS_BAD;
  }
  /** @param {unknown} metrics @returns {number | null} */
  function readActualTextHeight(metrics) {
    const textMetrics = /** @type {Partial<TextMetrics> | null} */ (metrics && typeof metrics === "object" ? metrics : null);
    const ascent = Number(textMetrics && textMetrics.actualBoundingBoxAscent);
    const descent = Number(textMetrics && textMetrics.actualBoundingBoxDescent);
    const total = ascent + descent;
    if (!Number.isFinite(ascent) || !Number.isFinite(descent) || !(total > 0)) {
      return null;
    }
    return total;
  }
  /** @param {unknown} def @param {DyniPositionCoordinateWidgetContext} componentContext */
  function create(def, componentContext) {
    const theme = componentContext.theme.tokens;
    const text = componentContext.components.require("TextLayoutEngine");
    const valueMath = componentContext.components.require("ValueMath");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenCanvasOverlay = componentContext.components.require("StateScreenCanvasOverlay");
    const toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;
    const fitCache = text.createFitCache(["flat", "stacked"]);
    /** @param {HTMLCanvasElement} canvas @param {DyniWidgetValues} props */
    function renderCanvas(canvas, props) {
      const p = resolveVariantProps(props);
      const setup = componentContext.canvas.setupCanvas(canvas);
      const ctx = setup && setup.ctx;
      const W = setup && setup.W;
      const H = setup && setup.H;
      if (!ctx || !W || !H) {
        return;
      }
      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = "middle";
      const rootEl = componentContext.dom.requirePluginRoot(canvas);
      const tokens = theme.resolveForRoot(rootEl);
      const displayVariant = normalizeDisplayVariant(p.displayVariant);
      const isCoordinateVariant = displayVariant === DISPLAY_VARIANT_POSITION;
      const coordinatesTabular = p.coordinatesTabular !== false;
      const effectiveCoordinatesTabular = isCoordinateVariant ? coordinatesTabular : false;
      const stableDigitsEnabled = isCoordinateVariant ? p.stableDigits === true : p.stableDigits !== false;
      const family = (effectiveCoordinatesTabular || stableDigitsEnabled)
        ? (tokens.font.familyMono || tokens.font.family)
        : tokens.font.family;
      const color = tokens.surface.fg;
      const valueWeight = tokens.font.weight;
      const labelWeight = tokens.font.labelWeight;
      const captionOpacity = tokens.opacity && typeof tokens.opacity === "object" ? tokens.opacity.caption : undefined;
      const unitOpacity = tokens.opacity && typeof tokens.opacity === "object" ? tokens.opacity.unit : undefined;
      const coordinateAlign = effectiveCoordinatesTabular ? "right" : "center";
      ctx.fillStyle = color;
      const stateKind = stateScreenPrecedence.pickFirst([
        { kind: "disconnected", when: p.disconnect === true },
        { kind: "data", when: true }
      ]);
      if (stateKind !== stateScreenLabels.KINDS.DATA) {
        stateScreenCanvasOverlay.drawStateScreen({
          ctx: ctx,
          W: W,
          H: H,
          family: family,
          color: color,
          labelWeight: labelWeight,
          kind: stateKind
        });
        return;
      }
      const modeData = text.computeModeLayout({
        W: W, H: H,
        ratioThresholdNormal: p.ratioThresholdNormal,
        ratioThresholdFlat: p.ratioThresholdFlat,
        captionUnitScale: p.captionUnitScale,
        captionText: p.caption,
        unitText: p.unit
      });
      const insets = text.computeResponsiveInsets(W, H);
      const textFillScale = insets.responsive.textFillScale;
      const defaultText = String(p.default);
      if (modeData.mode === "flat") {
        const pairRaw = readCoordinatePair(p.value, true, toOptionalFiniteNumber);
        const useAxisFlat = !!p.coordinateFlatFromAxes;
        const topText = useAxisFlat
          ? formatAxisValue(pairRaw ? pairRaw.lat : null, "lat", defaultText, p, componentContext, placeholderNormalize, toOptionalFiniteNumber)
          : "";
        const bottomText = useAxisFlat
          ? formatAxisValue(pairRaw ? pairRaw.lon : null, "lon", defaultText, p, componentContext, placeholderNormalize, toOptionalFiniteNumber)
          : "";
        const valueText = useAxisFlat
          ? ((topText + " " + bottomText).trim() || defaultText)
          : placeholderNormalize.normalize(String(componentContext.format.applyFormatter(p.value, p)), defaultText);
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
            maxH: Math.max(1, H - insets.innerY * 2),
            family: family,
            valueWeight: valueWeight,
            labelWeight: labelWeight,
            extraValueCheck: /** @param {{ maxH: number, valueMetrics: unknown, valuePx: number }} meta */ function (meta) {
              if (!statusEmoji) {
                return true;
              }
              const safeHeight = meta.maxH * TIME_STATUS_SCALE_LIMIT;
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
          labelWeight: labelWeight,
          captionOpacity: captionOpacity,
          unitOpacity: unitOpacity
        });
      } else {
        const parsed = readCoordinatePair(p.value, p.coordinateRawValues === true, toOptionalFiniteNumber);
        const latText = parsed
          ? formatAxisValue(parsed.lat, "lat", defaultText, p, componentContext, placeholderNormalize, toOptionalFiniteNumber)
          : defaultText;
        const lonText = parsed
          ? formatAxisValue(parsed.lon, "lon", defaultText, p, componentContext, placeholderNormalize, toOptionalFiniteNumber)
          : defaultText;
        const topStatusEmoji = isTimeStatusMarker(latText);
        const key = text.makeFitCacheKey({
          mode: modeData.mode,
          W: W, H: H,
          caption: modeData.caption, unit: modeData.unit,
          latText: latText, lonText: lonText,
          secScale: modeData.secScale,
          align: coordinateAlign,
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
            textFillScale: textFillScale,
            secScale: modeData.secScale,
            captionText: modeData.caption,
            unitText: modeData.unit,
            topText: latText,
            bottomText: lonText,
            align: coordinateAlign,
            family: family,
            valueWeight: valueWeight,
            labelWeight: labelWeight,
            topRowExtraCheck: /** @param {{ maxH: number, metrics: unknown, px: number }} meta */ function (meta) {
              if (!topStatusEmoji) {
                return true;
              }
              const safeHeight = meta.maxH * TIME_STATUS_SCALE_LIMIT;
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
          labelWeight: labelWeight,
          captionOpacity: captionOpacity,
          unitOpacity: unitOpacity
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
