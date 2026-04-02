/**
 * Module: RoutePointsLayout - Responsive geometry owner for the route-points HTML renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ResponsiveScaleProfile, LayoutRectMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsLayout = factory(); }
}(this, function () {
  "use strict";

  const PAD_X_RATIO = 0.03;
  const INNER_Y_RATIO = 0.02;
  const GAP_RATIO = 0.03;
  const ROW_HEIGHT_RATIO = 0.22;
  const ROW_HEIGHT_MIN_PX = 18;
  const ROW_HEIGHT_MAX_PX = 62;
  const ROW_HEIGHT_MIN_PX_VERTICAL = 22;
  const ROW_HEIGHT_MAX_PX_VERTICAL = 48;

  const HEADER_HEIGHT_SHARE_HIGH = 1.0;
  const HEADER_HEIGHT_SHARE_NORMAL = 0.6;
  const HEAD_PANEL_WIDTH_RATIO_FLAT = 0.36;
  const HEAD_PANEL_MIN_RATIO_FLAT = 0.22;
  const HEAD_PANEL_MAX_RATIO_FLAT = 0.48;

  const ROW_GAP_RATIO = 0.06;
  const HEADER_GAP_RATIO = 0.08;
  const ROW_PADDING_RATIO = 0.025;
  const HEADER_SPLIT_GAP_RATIO = 0.05;
  const MAX_VIEWPORT_HEIGHT_RATIO = 0.75;
  const RESPONSIVE_SCALES = {
    textFillScale: 1.18,
    flatHeadPanelScale: 0.84
  };

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

  function create(def, Helpers) {
    const profileApi = Helpers.getModule("ResponsiveScaleProfile").create(def, Helpers);
    const rectApi = Helpers.getModule("LayoutRectMath").create(def, Helpers);
    const makeRect = rectApi.makeRect;

    function resolveMode(args) {
      const cfg = args || {};
      if (cfg.isVerticalContainer === true) {
        return "high";
      }
      if (cfg.mode === "high" || cfg.mode === "normal" || cfg.mode === "flat") {
        return cfg.mode;
      }
      const W = Math.max(1, Math.floor(clampNumber(cfg.W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const H = Math.max(1, Math.floor(clampNumber(cfg.H, 1, Number.MAX_SAFE_INTEGER, 1)));
      const ratio = W / H;
      const ratioThresholdNormal = clampNumber(cfg.ratioThresholdNormal, 0.5, 2.0, 1.0);
      const ratioThresholdFlat = clampNumber(cfg.ratioThresholdFlat, 1.5, 6.0, 3.5);

      if (ratio < ratioThresholdNormal) {
        return "high";
      }
      if (ratio > ratioThresholdFlat) {
        return "flat";
      }
      return "normal";
    }

    function computeRowHeight(W, H, isVerticalContainer) {
      const isVertical = isVerticalContainer === true;
      const safeW = Math.max(1, Math.floor(clampNumber(W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const safeH = isVertical
        ? safeW
        : Math.max(1, Math.floor(clampNumber(H, 1, Number.MAX_SAFE_INTEGER, safeW)));
      const profile = profileApi.computeProfile(safeW, safeH, { scales: RESPONSIVE_SCALES });
      const minClamp = isVertical ? ROW_HEIGHT_MIN_PX_VERTICAL : ROW_HEIGHT_MIN_PX;
      const maxClamp = isVertical ? ROW_HEIGHT_MAX_PX_VERTICAL : ROW_HEIGHT_MAX_PX;
      const rowHeight = profileApi.computeInsetPx(profile, ROW_HEIGHT_RATIO, minClamp);
      return Math.max(minClamp, Math.min(maxClamp, Math.floor(rowHeight)));
    }

    function computeInsets(W, H) {
      const safeW = Math.max(1, Math.floor(clampNumber(W, 1, Number.MAX_SAFE_INTEGER, 1)));
      const safeH = Math.max(1, Math.floor(clampNumber(H, 1, Number.MAX_SAFE_INTEGER, 1)));
      const responsive = profileApi.computeProfile(safeW, safeH, { scales: RESPONSIVE_SCALES });
      return {
        padX: profileApi.computeInsetPx(responsive, PAD_X_RATIO, 1),
        innerY: profileApi.computeInsetPx(responsive, INNER_Y_RATIO, 1),
        gap: profileApi.computeInsetPx(responsive, GAP_RATIO, 1),
        responsive: responsive
      };
    }

    function createContentRect(W, H, insets) {
      const ins = insets || computeInsets(W, H);
      return makeRect(
        ins.padX,
        ins.innerY,
        Math.max(0, Math.floor(Number(W) || 0) - ins.padX * 2),
        Math.max(0, Math.floor(Number(H) || 0) - ins.innerY * 2)
      );
    }

    function computeHeaderLayout(headerRect, mode) {
      if (!headerRect) {
        return null;
      }
      const splitGap = Math.max(0, Math.floor(Math.min(headerRect.w, headerRect.h) * HEADER_SPLIT_GAP_RATIO));
      if (mode === "normal") {
        const leftWidth = Math.max(0, Math.floor(Math.max(0, headerRect.w - splitGap) / 2));
        const rightWidth = Math.max(0, headerRect.w - leftWidth - splitGap);
        return {
          routeNameRect: makeRect(headerRect.x, headerRect.y, leftWidth, headerRect.h),
          metaRect: makeRect(headerRect.x + leftWidth + splitGap, headerRect.y, rightWidth, headerRect.h)
        };
      }
      const topHeight = Math.max(0, Math.floor(Math.max(0, headerRect.h - splitGap) / 2));
      const bottomHeight = Math.max(0, headerRect.h - topHeight - splitGap);
      return {
        routeNameRect: makeRect(headerRect.x, headerRect.y, headerRect.w, topHeight),
        metaRect: makeRect(headerRect.x, headerRect.y + topHeight + splitGap, headerRect.w, bottomHeight)
      };
    }

    function buildRowCells(rowRect, mode, rowPadding, rowGap) {
      const innerRect = makeRect(
        rowRect.x + rowPadding,
        rowRect.y + rowPadding,
        Math.max(0, rowRect.w - rowPadding * 2),
        Math.max(0, rowRect.h - rowPadding * 2)
      );
      const squareSize = Math.max(1, Math.min(innerRect.h, innerRect.w));
      const innerGap = Math.max(0, Math.floor(rowGap));

      if (mode === "high") {
        const middleX = innerRect.x + squareSize + innerGap;
        const middleWidth = Math.max(0, innerRect.w - squareSize * 2 - innerGap * 2);
        const middleRect = makeRect(middleX, innerRect.y, middleWidth, innerRect.h);
        const splitGap = Math.min(innerGap, Math.max(0, middleRect.h - 1));
        const topHeight = Math.max(0, Math.floor(Math.max(0, middleRect.h - splitGap) / 2));
        const bottomHeight = Math.max(0, middleRect.h - topHeight - splitGap);

        return {
          rowRect: rowRect,
          ordinalRect: makeRect(innerRect.x, innerRect.y, squareSize, innerRect.h),
          middleRect: middleRect,
          nameRect: makeRect(middleRect.x, middleRect.y, middleRect.w, topHeight),
          infoRect: makeRect(middleRect.x, middleRect.y + topHeight + splitGap, middleRect.w, bottomHeight),
          markerRect: makeRect(innerRect.x + innerRect.w - squareSize, innerRect.y, squareSize, innerRect.h)
        };
      }

      const middleWidth = Math.max(0, innerRect.w - squareSize * 2 - innerGap * 3);
      const nameWidth = Math.max(0, Math.floor(Math.max(0, middleWidth - innerGap) / 2));
      const infoWidth = Math.max(0, middleWidth - nameWidth - innerGap);
      const nameX = innerRect.x + squareSize + innerGap;
      const infoX = nameX + nameWidth + innerGap;

      return {
        rowRect: rowRect,
        ordinalRect: makeRect(innerRect.x, innerRect.y, squareSize, innerRect.h),
        middleRect: makeRect(nameX, innerRect.y, nameWidth + innerGap + infoWidth, innerRect.h),
        nameRect: makeRect(nameX, innerRect.y, nameWidth, innerRect.h),
        infoRect: makeRect(infoX, innerRect.y, infoWidth, innerRect.h),
        markerRect: makeRect(innerRect.x + innerRect.w - squareSize, innerRect.y, squareSize, innerRect.h)
      };
    }

    function computeLayout(args) {
      const cfg = args || {};
      const contentRect = cfg.contentRect || makeRect(0, 0, 0, 0);
      const showHeader = cfg.showHeader !== false;
      const isVerticalContainer = cfg.isVerticalContainer === true;
      const pointCount = toCount(cfg.pointCount);
      const responsive = cfg.responsive || profileApi.computeProfile(contentRect.w, contentRect.h, { scales: RESPONSIVE_SCALES });
      const mode = resolveMode({
        mode: cfg.mode,
        W: contentRect.w,
        H: contentRect.h,
        ratioThresholdNormal: cfg.ratioThresholdNormal,
        ratioThresholdFlat: cfg.ratioThresholdFlat,
        isVerticalContainer: isVerticalContainer
      });
      const rowHeight = computeRowHeight(contentRect.w, contentRect.h, isVerticalContainer);
      const rowGap = Math.max(1, Math.floor(rowHeight * ROW_GAP_RATIO));
      const headerGap = Math.max(1, Math.floor(rowHeight * HEADER_GAP_RATIO));
      const rowPadding = Math.max(1, Math.floor(rowHeight * ROW_PADDING_RATIO));

      let headerRect = null;
      let listRect = contentRect;

      if (showHeader) {
        if (mode === "flat") {
          const panelShare = profileApi.scaleShare(
            HEAD_PANEL_WIDTH_RATIO_FLAT,
            responsive.flatHeadPanelScale,
            HEAD_PANEL_MIN_RATIO_FLAT,
            HEAD_PANEL_MAX_RATIO_FLAT
          );
          const usableWidth = Math.max(0, contentRect.w - headerGap);
          const panelWidth = Math.max(0, Math.floor(usableWidth * panelShare));
          headerRect = makeRect(contentRect.x, contentRect.y, panelWidth, contentRect.h);
          listRect = makeRect(
            contentRect.x + panelWidth + headerGap,
            contentRect.y,
            Math.max(0, contentRect.w - panelWidth - headerGap),
            contentRect.h
          );
        } else {
          const headerShare = mode === "high" ? HEADER_HEIGHT_SHARE_HIGH : HEADER_HEIGHT_SHARE_NORMAL;
          const headerHeight = Math.max(1, Math.floor(rowHeight * headerShare));
          headerRect = makeRect(contentRect.x, contentRect.y, contentRect.w, headerHeight);
          listRect = makeRect(
            contentRect.x,
            contentRect.y + headerHeight + headerGap,
            contentRect.w,
            Math.max(0, contentRect.h - headerHeight - headerGap)
          );
        }
      }

      const rowRects = [];
      const rows = [];
      let rowY = listRect.y;
      for (let i = 0; i < pointCount; i += 1) {
        const rowRect = makeRect(listRect.x, rowY, listRect.w, rowHeight);
        rowRects.push(rowRect);
        rows.push(buildRowCells(rowRect, mode, rowPadding, rowGap));
        rowY += rowHeight + rowGap;
      }

      const headerLayout = computeHeaderLayout(headerRect, mode);
      const listContentHeight = Math.max(0, pointCount * rowHeight + Math.max(0, pointCount - 1) * rowGap);

      return {
        mode: mode,
        showHeader: showHeader,
        isVerticalContainer: isVerticalContainer,
        pointCount: pointCount,
        rowHeight: rowHeight,
        rowGap: rowGap,
        headerGap: showHeader ? headerGap : 0,
        rowPadding: rowPadding,
        responsive: responsive,
        contentRect: contentRect,
        headerRect: headerRect,
        headerLayout: headerLayout,
        listRect: listRect,
        listContentHeight: listContentHeight,
        rowRects: rowRects,
        rows: rows
      };
    }

    function computeInlineGeometry(args) {
      const cfg = args || {};
      const layout = cfg.layout || computeLayout(cfg);
      const wrapperHeightPx = Math.floor(clampNumber(cfg.wrapperHeight, -1, Number.MAX_SAFE_INTEGER, -1));
      const wrapperHeight = wrapperHeightPx >= 0 ? wrapperHeightPx : null;

      const wrapperStyle =
        "padding:" +
        Math.max(0, layout.contentRect.y) +
        "px " +
        Math.max(0, layout.contentRect.x) +
        "px;" +
        "gap:" +
        Math.max(0, layout.headerGap) +
        "px;" +
        (wrapperHeight === null ? "" : "height:" + wrapperHeight + "px;");

      const header = layout.headerRect
        ? {
          style: toSizeStyle(layout.headerRect),
          routeNameStyle: toSizeStyle(layout.headerLayout && layout.headerLayout.routeNameRect),
          metaStyle: toSizeStyle(layout.headerLayout && layout.headerLayout.metaRect)
        }
        : null;

      return {
        mode: layout.mode,
        showHeader: layout.showHeader,
        rowGapPx: layout.rowGap,
        wrapper: { style: wrapperStyle },
        header: header,
        list: {
          style: toSizeStyle(layout.listRect),
          contentStyle: "min-height:" + Math.max(0, layout.listContentHeight) + "px;"
        },
        rows: layout.rows.map(function (row) {
          return {
            rowStyle: toSizeStyle(row.rowRect),
            ordinalStyle: toSizeStyle(row.ordinalRect),
            middleStyle: toSizeStyle(row.middleRect),
            nameStyle: toSizeStyle(row.nameRect),
            infoStyle: toSizeStyle(row.infoRect),
            markerStyle: toSizeStyle(row.markerRect)
          };
        })
      };
    }

    function computeNaturalHeight(args) {
      const cfg = args || {};
      const width = Math.max(1, Math.floor(clampNumber(
        cfg.W,
        1,
        Number.MAX_SAFE_INTEGER,
        1
      )));
      const pointCount = toCount(cfg.pointCount);
      const showHeader = cfg.showHeader !== false;
      const rowHeight = computeRowHeight(width, width, true);
      const rowGap = Math.max(1, Math.floor(rowHeight * ROW_GAP_RATIO));
      const headerGap = showHeader ? Math.max(1, Math.floor(rowHeight * HEADER_GAP_RATIO)) : 0;
      const headerHeight = showHeader ? Math.max(1, Math.floor(rowHeight * HEADER_HEIGHT_SHARE_HIGH)) : 0;
      const insets = computeInsets(width, width);
      const outerPaddingY = Math.max(0, insets.innerY * 2);
      const listContentHeight = Math.max(0, pointCount * rowHeight + Math.max(0, pointCount - 1) * rowGap);
      const naturalHeight = Math.max(0, outerPaddingY + headerHeight + headerGap + listContentHeight);
      const viewportHeight = Math.max(
        0,
        Math.floor(clampNumber(cfg.viewportHeight, 0, Number.MAX_SAFE_INTEGER, resolveWindowViewportHeight()))
      );
      const capHeight = viewportHeight > 0
        ? Math.max(0, Math.floor(viewportHeight * MAX_VIEWPORT_HEIGHT_RATIO))
        : naturalHeight;
      const cappedHeight = Math.max(0, Math.min(naturalHeight, capHeight));
      const listViewportHeight = Math.max(0, cappedHeight - outerPaddingY - headerHeight - headerGap);

      return {
        rowHeight: rowHeight,
        rowGap: rowGap,
        headerGap: headerGap,
        headerHeight: headerHeight,
        outerPaddingY: outerPaddingY,
        listContentHeight: listContentHeight,
        naturalHeight: naturalHeight,
        capHeight: capHeight,
        cappedHeight: cappedHeight,
        listViewportHeight: listViewportHeight,
        isCapped: cappedHeight < naturalHeight
      };
    }

    return {
      id: "RoutePointsLayout",
      constants: {
        ROW_HEIGHT_RATIO: ROW_HEIGHT_RATIO,
        ROW_HEIGHT_MIN_PX: ROW_HEIGHT_MIN_PX,
        ROW_HEIGHT_MAX_PX: ROW_HEIGHT_MAX_PX,
        ROW_HEIGHT_MIN_PX_VERTICAL: ROW_HEIGHT_MIN_PX_VERTICAL,
        ROW_HEIGHT_MAX_PX_VERTICAL: ROW_HEIGHT_MAX_PX_VERTICAL,
        HEADER_HEIGHT_SHARE_HIGH: HEADER_HEIGHT_SHARE_HIGH,
        HEADER_HEIGHT_SHARE_NORMAL: HEADER_HEIGHT_SHARE_NORMAL,
        HEAD_PANEL_WIDTH_RATIO_FLAT: HEAD_PANEL_WIDTH_RATIO_FLAT,
        ROW_GAP_RATIO: ROW_GAP_RATIO,
        HEADER_GAP_RATIO: HEADER_GAP_RATIO,
        ROW_PADDING_RATIO: ROW_PADDING_RATIO,
        MAX_VIEWPORT_HEIGHT_RATIO: MAX_VIEWPORT_HEIGHT_RATIO
      },
      resolveMode: resolveMode,
      computeRowHeight: computeRowHeight,
      computeInsets: computeInsets,
      createContentRect: createContentRect,
      computeHeaderLayout: computeHeaderLayout,
      computeLayout: computeLayout,
      computeInlineGeometry: computeInlineGeometry,
      computeNaturalHeight: computeNaturalHeight
    };
  }

  return { id: "RoutePointsLayout", create: create };
}));
