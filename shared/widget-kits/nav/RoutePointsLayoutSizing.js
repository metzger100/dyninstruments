/**
 * Module: RoutePointsLayoutSizing - Shared numeric helpers and header/marker sizing policy for route-points layout
 * Documentation: documentation/widgets/route-points.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsLayoutSizing = factory(); }
}(this, function () {
  "use strict";

  const HEADER_HEIGHT_FLOOR_ROWS_NORMAL = 1.45;
  const HEADER_HEIGHT_FLOOR_ROWS_HIGH = 2.0;
  const HEADER_HEIGHT_NARROW_VERTICAL_BOOST_ROWS_NORMAL = 0.10;
  const HEADER_HEIGHT_NARROW_VERTICAL_BOOST_ROWS_HIGH = 0.20;
  const HEADER_NARROW_VERTICAL_WIDTH_TO_ROW_RATIO = 5.0;
  const MARKER_DIAMETER_RATIO = 0.48;
  const MARKER_DIAMETER_MIN_PX = 3;
  const MARKER_DIAMETER_MAX_PX = 24;

  function clampNumber(value, minValue, maxValue, defaultValue) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return defaultValue;
    }
    return Math.max(minValue, Math.min(maxValue, n));
  }

  function toCount(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return 0;
    }
    return Math.max(0, Math.floor(n));
  }

  function toSizeStyle(rect) {
    const safeRect = rect || { w: 0, h: 0 };
    return "width:" + Math.max(0, safeRect.w) + "px;height:" + Math.max(0, safeRect.h) + "px;";
  }

  function resolveWindowViewportHeight() {
    if (typeof window !== "undefined" && Number.isFinite(window.innerHeight) && window.innerHeight > 0) {
      return Math.floor(window.innerHeight);
    }
    return 0;
  }

  function toMarkerDotStyle(markerRect) {
    const safeRect = markerRect || { w: 0, h: 0 };
    const markerLimit = Math.max(1, Math.min(
      Math.max(0, Math.floor(safeRect.w || 0)),
      Math.max(0, Math.floor(safeRect.h || 0))
    ));
    const scaled = Math.floor(markerLimit * MARKER_DIAMETER_RATIO);
    const preferred = Math.max(
      MARKER_DIAMETER_MIN_PX,
      Math.min(MARKER_DIAMETER_MAX_PX, scaled)
    );
    const diameter = Math.max(1, Math.min(markerLimit, preferred));
    return "width:" + diameter + "px;height:" + diameter + "px;";
  }

  function resolveHeaderFloorRows(mode) {
    if (mode === "high") {
      return HEADER_HEIGHT_FLOOR_ROWS_HIGH;
    }
    return HEADER_HEIGHT_FLOOR_ROWS_NORMAL;
  }

  function resolveNarrowVerticalBoostRows(mode) {
    if (mode === "high") {
      return HEADER_HEIGHT_NARROW_VERTICAL_BOOST_ROWS_HIGH;
    }
    return HEADER_HEIGHT_NARROW_VERTICAL_BOOST_ROWS_NORMAL;
  }

  function isNarrowVertical(args) {
    const cfg = args || {};
    if (cfg.isVerticalContainer !== true) {
      return false;
    }
    const rowHeight = Math.max(1, Math.floor(clampNumber(cfg.rowHeight, 1, Number.MAX_SAFE_INTEGER, 1)));
    const contentWidth = Math.max(0, Math.floor(clampNumber(cfg.contentWidth, 0, Number.MAX_SAFE_INTEGER, 0)));
    if (contentWidth <= 0) {
      return false;
    }
    return contentWidth <= Math.floor(rowHeight * HEADER_NARROW_VERTICAL_WIDTH_TO_ROW_RATIO);
  }

  function computeHeaderHeight(args) {
    const cfg = args || {};
    const mode = cfg.mode;
    const existingHeaderHeight = Math.max(
      0,
      Math.floor(clampNumber(cfg.existingHeaderHeight, 0, Number.MAX_SAFE_INTEGER, 0))
    );
    if (mode !== "high" && mode !== "normal") {
      return existingHeaderHeight;
    }

    const rowHeight = Math.max(1, Math.floor(clampNumber(cfg.rowHeight, 1, Number.MAX_SAFE_INTEGER, 1)));
    let floorRows = resolveHeaderFloorRows(mode);
    if (isNarrowVertical({
      isVerticalContainer: cfg.isVerticalContainer === true,
      rowHeight: rowHeight,
      contentWidth: cfg.contentWidth
    })) {
      floorRows += resolveNarrowVerticalBoostRows(mode);
    }
    const floorHeight = Math.max(1, Math.floor(rowHeight * floorRows));
    return Math.max(existingHeaderHeight, floorHeight);
  }

  function create() {
    return {
      id: "RoutePointsLayoutSizing",
      constants: {
        HEADER_HEIGHT_FLOOR_ROWS_NORMAL: HEADER_HEIGHT_FLOOR_ROWS_NORMAL,
        HEADER_HEIGHT_FLOOR_ROWS_HIGH: HEADER_HEIGHT_FLOOR_ROWS_HIGH,
        HEADER_HEIGHT_NARROW_VERTICAL_BOOST_ROWS_NORMAL: HEADER_HEIGHT_NARROW_VERTICAL_BOOST_ROWS_NORMAL,
        HEADER_HEIGHT_NARROW_VERTICAL_BOOST_ROWS_HIGH: HEADER_HEIGHT_NARROW_VERTICAL_BOOST_ROWS_HIGH,
        HEADER_NARROW_VERTICAL_WIDTH_TO_ROW_RATIO: HEADER_NARROW_VERTICAL_WIDTH_TO_ROW_RATIO,
        MARKER_DIAMETER_RATIO: MARKER_DIAMETER_RATIO,
        MARKER_DIAMETER_MIN_PX: MARKER_DIAMETER_MIN_PX,
        MARKER_DIAMETER_MAX_PX: MARKER_DIAMETER_MAX_PX
      },
      clampNumber: clampNumber,
      toCount: toCount,
      toSizeStyle: toSizeStyle,
      resolveWindowViewportHeight: resolveWindowViewportHeight,
      toMarkerDotStyle: toMarkerDotStyle,
      computeHeaderHeight: computeHeaderHeight
    };
  }

  return { id: "RoutePointsLayoutSizing", create: create };
}));
