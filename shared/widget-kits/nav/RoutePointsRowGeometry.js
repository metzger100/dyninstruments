/**
 * Module: RoutePointsRowGeometry - Row policy and row-cell geometry owner for route-points layout
 * Documentation: documentation/widgets/route-points.md
 * Depends: LayoutRectMath, RoutePointsLayoutSizing
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsRowGeometry = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const rectApi = Helpers.getModule("LayoutRectMath").create(def, Helpers);
    const sizingApi = Helpers.getModule("RoutePointsLayoutSizing").create(def, Helpers);
    const makeRect = rectApi.makeRect;
    const clampNumber = sizingApi.clampNumber;
    const computeMarkerDiameter = sizingApi.computeMarkerDiameter;
    const computeMarkerCellWidth = sizingApi.computeMarkerCellWidth;

    function resolveRowPolicy(args) {
      const cfg = args || {};
      const mode = cfg.mode;
      const isVerticalContainer = cfg.isVerticalContainer === true;
      return {
        showOrdinal: !(mode === "high" || isVerticalContainer)
      };
    }

    function toRowPolicy(args) {
      const cfg = args || {};
      const provided = cfg.policy;
      if (provided && typeof provided === "object") {
        return {
          showOrdinal: provided.showOrdinal === true
        };
      }
      return resolveRowPolicy(cfg);
    }

    function toOrdinalRect(innerRect, squareSize, showOrdinal) {
      if (!showOrdinal) {
        return makeRect(innerRect.x, innerRect.y, 0, innerRect.h);
      }
      return makeRect(innerRect.x, innerRect.y, squareSize, innerRect.h);
    }

    function buildHighRowCells(args) {
      const cfg = args || {};
      const innerRect = cfg.innerRect;
      const rowRect = cfg.rowRect;
      const squareSize = cfg.squareSize;
      const markerCellWidth = cfg.markerCellWidth;
      const markerDiameter = cfg.markerDiameter;
      const innerGap = cfg.innerGap;
      const showOrdinal = cfg.showOrdinal === true;
      const leadingWidth = showOrdinal ? squareSize : 0;
      const leadingGap = showOrdinal ? innerGap : 0;
      const trailingGap = innerGap;
      const middleX = innerRect.x + leadingWidth + leadingGap;
      const middleWidth = Math.max(0, innerRect.w - leadingWidth - leadingGap - markerCellWidth - trailingGap);
      const middleRect = makeRect(middleX, innerRect.y, middleWidth, innerRect.h);
      const splitGap = Math.min(innerGap, Math.max(0, middleRect.h - 1));
      const topHeight = Math.max(0, Math.floor(Math.max(0, middleRect.h - splitGap) / 2));
      const bottomHeight = Math.max(0, middleRect.h - topHeight - splitGap);

      return {
        rowRect: rowRect,
        showOrdinal: showOrdinal,
        ordinalRect: toOrdinalRect(innerRect, squareSize, showOrdinal),
        middleRect: middleRect,
        nameRect: makeRect(middleRect.x, middleRect.y, middleRect.w, topHeight),
        infoRect: makeRect(middleRect.x, middleRect.y + topHeight + splitGap, middleRect.w, bottomHeight),
        markerRect: makeRect(innerRect.x + innerRect.w - markerCellWidth, innerRect.y, markerCellWidth, innerRect.h),
        markerDiameter: markerDiameter
      };
    }

    function buildWideRowCells(args) {
      const cfg = args || {};
      const innerRect = cfg.innerRect;
      const rowRect = cfg.rowRect;
      const squareSize = cfg.squareSize;
      const markerCellWidth = cfg.markerCellWidth;
      const markerDiameter = cfg.markerDiameter;
      const innerGap = cfg.innerGap;
      const showOrdinal = cfg.showOrdinal === true;
      const leadingWidth = showOrdinal ? squareSize : 0;
      const leadingGap = showOrdinal ? innerGap : 0;
      const middleWidth = Math.max(0, innerRect.w - leadingWidth - leadingGap - markerCellWidth - innerGap * 2);
      const nameWidth = Math.max(0, Math.floor(Math.max(0, middleWidth - innerGap) / 2));
      const infoWidth = Math.max(0, middleWidth - nameWidth - innerGap);
      const nameX = innerRect.x + leadingWidth + leadingGap;
      const infoX = nameX + nameWidth + innerGap;

      return {
        rowRect: rowRect,
        showOrdinal: showOrdinal,
        ordinalRect: toOrdinalRect(innerRect, squareSize, showOrdinal),
        middleRect: makeRect(nameX, innerRect.y, nameWidth + innerGap + infoWidth, innerRect.h),
        nameRect: makeRect(nameX, innerRect.y, nameWidth, innerRect.h),
        infoRect: makeRect(infoX, innerRect.y, infoWidth, innerRect.h),
        markerRect: makeRect(innerRect.x + innerRect.w - markerCellWidth, innerRect.y, markerCellWidth, innerRect.h),
        markerDiameter: markerDiameter
      };
    }

    function buildRowCells(args) {
      const cfg = args || {};
      const rowRect = cfg.rowRect || makeRect(0, 0, 0, 0);
      const rowPadding = Math.max(0, Math.floor(clampNumber(cfg.rowPadding, 0, Number.MAX_SAFE_INTEGER, 0)));
      const rowGap = Math.max(0, Math.floor(clampNumber(cfg.rowGap, 0, Number.MAX_SAFE_INTEGER, 0)));
      const trailingGutterPx = Math.max(
        0,
        Math.floor(clampNumber(cfg.trailingGutterPx, 0, Number.MAX_SAFE_INTEGER, 0))
      );
      const policy = toRowPolicy(cfg);
      const innerRect = makeRect(
        rowRect.x + rowPadding,
        rowRect.y + rowPadding,
        Math.max(0, rowRect.w - rowPadding * 2 - trailingGutterPx),
        Math.max(0, rowRect.h - rowPadding * 2)
      );
      const squareSize = Math.max(1, Math.min(innerRect.h, innerRect.w));
      const markerDiameterFromHeight = computeMarkerDiameter(innerRect.h);
      const markerCellWidth = computeMarkerCellWidth({
        markerDiameter: markerDiameterFromHeight,
        maxWidth: innerRect.w
      });
      const markerDiameter = Math.max(1, Math.min(markerDiameterFromHeight, markerCellWidth, innerRect.h));
      const innerGap = Math.max(0, Math.floor(rowGap));
      const mode = cfg.mode;
      if (mode === "high") {
        return buildHighRowCells({
          rowRect: rowRect,
          innerRect: innerRect,
          squareSize: squareSize,
          markerCellWidth: markerCellWidth,
          markerDiameter: markerDiameter,
          innerGap: innerGap,
          showOrdinal: policy.showOrdinal
        });
      }
      return buildWideRowCells({
        rowRect: rowRect,
        innerRect: innerRect,
        squareSize: squareSize,
        markerCellWidth: markerCellWidth,
        markerDiameter: markerDiameter,
        innerGap: innerGap,
        showOrdinal: policy.showOrdinal
      });
    }

    return {
      id: "RoutePointsRowGeometry",
      resolveRowPolicy: resolveRowPolicy,
      buildRowCells: buildRowCells
    };
  }

  return { id: "RoutePointsRowGeometry", create: create };
}));
