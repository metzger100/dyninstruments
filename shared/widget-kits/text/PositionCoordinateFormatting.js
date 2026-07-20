/**
 * @file PositionCoordinateFormatting - Shared lat/lon parsing and formatting for PositionCoordinateWidget
 * Documentation: documentation/widgets/position-coordinates.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniPositionCoordinateFormatting = factory();
  }
})(this, function () {
  "use strict";

  const DISPLAY_VARIANT_POSITION = "position";
  const DISPLAY_VARIANT_DATE_TIME = "dateTime";
  const DISPLAY_VARIANT_TIME_STATUS = "timeStatus";
  const STATUS_OK = "🟢";
  const STATUS_BAD = "🔴";
  const TIME_STATUS_SCALE_LIMIT = 0.82;
  const INVALID_GPS_TEXT = new Set(["0", "false", "off", "no"]);

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
      return !!text && !INVALID_GPS_TEXT.has(text);
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
    const paramsRaw = Object.prototype.hasOwnProperty.call(p, paramsKey)
      ? p[paramsKey]
      : p.coordinateFormatterParameters;
    const hasOverride = Object.prototype.hasOwnProperty.call(p, formatterKey);
    let params;
    if (Array.isArray(paramsRaw)) {
      params = paramsRaw.slice();
    } else if (typeof paramsRaw === "string") {
      params = paramsRaw.split(",");
    } else {
      params = [];
    }
    return {
      formatter: hasOverride
        ? p[formatterKey]
        : typeof p.coordinateFormatter !== "undefined"
          ? p.coordinateFormatter
          : "formatLonLatsDecimal",
      params: params,
      appendAxisParam: !hasOverride
    };
  }

  /** @param {unknown} rawValue @param {"lat" | "lon"} axis @param {string} defaultText @param {DyniWidgetValues} props @param {DyniPositionCoordinateFormatServices} services */
  function formatAxisValue(rawValue, axis, defaultText, props, services) {
    const { componentContext, placeholderNormalize, toOptionalFiniteNumber } = services;
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
    const out = String(
      componentContext.format.applyFormatter(rawValue, {
        formatter: cfg.formatter,
        formatterParameters: cfg.params,
        default: defaultText
      })
    );
    return placeholderNormalize.normalize(out, defaultText);
  }

  /** @param {string} text @returns {boolean} */
  function isTimeStatusMarker(text) {
    const normalized = String(text).trim();
    return normalized === STATUS_OK || normalized === STATUS_BAD;
  }

  /** @param {unknown} metrics @returns {number | null} */
  function readActualTextHeight(metrics) {
    const textMetrics = /** @type {Partial<TextMetrics> | null} */ (
      metrics && typeof metrics === "object" ? metrics : null
    );
    const ascent = Number(textMetrics && textMetrics.actualBoundingBoxAscent);
    const descent = Number(textMetrics && textMetrics.actualBoundingBoxDescent);
    const total = ascent + descent;
    if (!Number.isFinite(ascent) || !Number.isFinite(descent) || !(total > 0)) {
      return null;
    }
    return total;
  }

  function create() {
    return {
      id: "PositionCoordinateFormatting",
      DISPLAY_VARIANT_POSITION: DISPLAY_VARIANT_POSITION,
      TIME_STATUS_SCALE_LIMIT: TIME_STATUS_SCALE_LIMIT,
      normalizeDisplayVariant: normalizeDisplayVariant,
      readCoordinatePair: readCoordinatePair,
      resolveVariantProps: resolveVariantProps,
      formatAxisValue: formatAxisValue,
      isTimeStatusMarker: isTimeStatusMarker,
      readActualTextHeight: readActualTextHeight
    };
  }

  return { id: "PositionCoordinateFormatting", create: create };
});
