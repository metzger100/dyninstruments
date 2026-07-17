/**
 * @file XteLinearLayout - Responsive layout rectangles for the XTE linear gauge renderer
 * Documentation: documentation/widgets/xte-display.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniXteLinearLayout = factory();
  }
}(this, function () {
  "use strict";

  const PAD_X_RATIO = 0.04;
  const PAD_Y_RATIO = 0.04;
  const GAP_RATIO = 0.03;
  const METRIC_TILE_PAD_RATIO = 0.04;
  const METRIC_TILE_CAPTION_RATIO = 0.34;
  const FLAT_GAUGE_RATIO = 0.58;
  const FLAT_HEADER_RATIO = 0.22;
  const NORMAL_GAUGE_RATIO = 0.64;
  const NORMAL_NAME_X_RATIO = 0.1;
  const NORMAL_NAME_Y_RATIO = 0.04;
  const NORMAL_NAME_W_RATIO = 0.8;
  const NORMAL_NAME_H_RATIO = 0.14;
  const HIGH_TOP_RATIO = 0.14;
  const HIGH_GAUGE_RATIO = 0.68;
  const HIGH_NAME_X_RATIO = 0.18;
  const HIGH_NAME_W_RATIO = 0.64;
  const HIGH_NAME_MIN_SHARE = 0.08;
  const FLAT_GAUGE_MIN_RATIO = 0.48;
  const FLAT_GAUGE_MAX_RATIO = 0.68;
  const FLAT_HEADER_MIN_RATIO = 0.12;
  const FLAT_HEADER_MAX_RATIO = 0.28;
  const NORMAL_GAUGE_MIN_RATIO = 0.52;
  const NORMAL_GAUGE_MAX_RATIO = 0.72;
  const NORMAL_NAME_H_MIN_RATIO = 0.1;
  const NORMAL_NAME_H_MAX_RATIO = 0.18;
  const HIGH_TOP_MIN_RATIO = 0.1;
  const HIGH_TOP_MAX_RATIO = 0.18;
  const HIGH_GAUGE_MIN_RATIO = 0.6;
  const HIGH_GAUGE_MAX_RATIO = 0.74;
  const RESPONSIVE_SCALES = {
    textFillScale: 1.18,
    flatGaugeShareScale: 0.92,
    flatHeaderShareScale: 0.78,
    normalGaugeShareScale: 0.94,
    normalNameHeightScale: 0.82,
    highTopShareScale: 0.84,
    highGaugeShareScale: 0.97
  };

  /** @type {DyniLayoutRectMathApi["makeRect"]} */
  let makeRect;
  /** @type {DyniLayoutRectMathApi["splitRow"]} */
  let splitRow;
  /** @type {DyniLayoutRectMathApi["splitStack"]} */
  let splitStack;
  /** @type {DyniValueMathApi["clampNumber"]} */
  let clampNumber;

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniXteLinearLayoutApi}
   */
  function create(def, componentContext) {
    const profileApi = componentContext.components.require("ResponsiveScaleProfile");
    const rectApi = componentContext.components.require("LayoutRectMath");
    const sizingHelpers = componentContext.components.require("LayoutSizingHelpers");
    const valueMath = componentContext.components.require("ValueMath");
    makeRect = rectApi.makeRect;
    splitRow = rectApi.splitRow;
    splitStack = rectApi.splitStack;
    clampNumber = valueMath.clampNumber;
    const createContentRect = sizingHelpers.createInsetContentRectFactory(makeRect, "padX", "padY");
    const computeMetricTileSpacing = sizingHelpers.createMetricTileSpacingFactory(
      profileApi,
      METRIC_TILE_PAD_RATIO,
      METRIC_TILE_CAPTION_RATIO
    );

    /**
     * @param {unknown} W
     * @param {unknown} H
     * @param {unknown} thresholdNormal
     * @param {unknown} thresholdFlat
     * @returns {DyniXteMode}
     */
    function computeMode(W, H, thresholdNormal, thresholdFlat) {
      const width = Math.max(0, Number(W) || 0);
      const height = Math.max(1, Number(H) || 0);
      const ratio = width / height;
      const normalLimit = Number.isFinite(thresholdNormal) ? /** @type {number} */ (thresholdNormal) : 0.85;
      const flatLimit = Number.isFinite(thresholdFlat) ? /** @type {number} */ (thresholdFlat) : 2.3;
      if (ratio <= flatLimit) {
        return ratio < normalLimit ? "high" : "normal";
      }
      return "flat";
    }

    /** @param {unknown} W @param {unknown} H @returns {DyniXteLinearInsets} */
    function computeInsets(W, H) {
      const responsive = profileApi.computeProfile(W, H, { scales: RESPONSIVE_SCALES });
      return {
        padX: profileApi.computeInsetPx(responsive, PAD_X_RATIO, 1),
        padY: profileApi.computeInsetPx(responsive, PAD_Y_RATIO, 1),
        gap: profileApi.computeInsetPx(responsive, GAP_RATIO, 1),
        responsive: responsive
      };
    }

    /** @param {unknown} args @returns {DyniXteLinearLayoutResult} */
    function computeLayout(args) {
      const input = /** @type {DyniXteLayoutArgs} */ (args && typeof args === "object" ? args : {});
      const contentRect = input.contentRect || makeRect(0, 0, 0, 0);
      const responsive = input.responsive || profileApi.computeProfile(contentRect.w, contentRect.h, { scales: RESPONSIVE_SCALES });
      const maxSpan = Math.max(contentRect.w, contentRect.h);
      const defaultGap = profileApi.computeInsetPx(responsive, GAP_RATIO, 1);
      const gap = Math.max(0, Math.floor(clampNumber(
        input.gap,
        0,
        maxSpan,
        defaultGap
      )));
      const mode = (input.mode === "flat" || input.mode === "high") ? input.mode : "normal";
      const hideTextualMetrics = input.hideTextualMetrics === true;
      const showWpName = input.showWpName === true;
      const hasWaypointName = input.hasWaypointName === true;
      const reserveWaypointSpace = showWpName && hasWaypointName;

      if (hideTextualMetrics) {
        if (mode === "high") {
          const nameReserve = reserveWaypointSpace
            ? Math.max(1, Math.floor(contentRect.h * HIGH_NAME_MIN_SHARE))
            : 0;
          return {
            mode: mode,
            gap: gap,
            responsive: responsive,
            contentRect: contentRect,
            gaugeBar: makeRect(
              contentRect.x,
              contentRect.y + nameReserve,
              contentRect.w,
              Math.max(1, contentRect.h - nameReserve)
            ),
            nameRect: null,
            metricRects: null
          };
        }
        return {
          mode: mode,
          gap: gap,
          responsive: responsive,
          contentRect: contentRect,
          gaugeBar: makeRect(contentRect.x, contentRect.y, contentRect.w, contentRect.h),
          nameRect: null,
          metricRects: null
        };
      }

      if (mode === "flat") {
        const gaugeShare = profileApi.scaleShare(
          clampNumber(input.flatGaugeShare, FLAT_GAUGE_MIN_RATIO, FLAT_GAUGE_MAX_RATIO, FLAT_GAUGE_RATIO),
          responsive.flatGaugeShareScale,
          FLAT_GAUGE_MIN_RATIO,
          FLAT_GAUGE_MAX_RATIO
        );
        const headerShare = reserveWaypointSpace
          ? profileApi.scaleShare(
            clampNumber(input.flatHeaderRatio, FLAT_HEADER_MIN_RATIO, FLAT_HEADER_MAX_RATIO, FLAT_HEADER_RATIO),
            responsive.flatHeaderShareScale,
            FLAT_HEADER_MIN_RATIO,
            FLAT_HEADER_MAX_RATIO
          )
          : 0;
        const usableWidth = Math.max(1, contentRect.w - gap);
        const gaugeWidth = Math.max(1, Math.floor(usableWidth * gaugeShare));
        const gaugeBar = makeRect(contentRect.x, contentRect.y, gaugeWidth, contentRect.h);
        const panel = makeRect(
          contentRect.x + gaugeWidth + gap,
          contentRect.y,
          Math.max(1, contentRect.w - gaugeWidth - gap),
          contentRect.h
        );
        const nameHeight = reserveWaypointSpace ? Math.max(1, Math.floor(panel.h * headerShare)) : 0;
        const rowsY = panel.y + (reserveWaypointSpace ? nameHeight + gap : 0);
        const rowsH = Math.max(1, panel.h - (reserveWaypointSpace ? nameHeight + gap : 0));
        const rows = splitStack(makeRect(panel.x, rowsY, panel.w, rowsH), gap, 2, makeRect);
        const topRow = splitRow(rows[0], gap, 2, makeRect);
        const bottomRow = splitRow(rows[1], gap, 2, makeRect);

        return {
          mode: mode,
          gap: gap,
          responsive: responsive,
          contentRect: contentRect,
          gaugeBar: gaugeBar,
          nameRect: reserveWaypointSpace ? makeRect(panel.x, panel.y, panel.w, nameHeight) : null,
          metricRects: {
            cog: topRow[0],
            btw: topRow[1],
            xte: bottomRow[0],
            dtw: bottomRow[1]
          }
        };
      }

      if (mode === "high") {
        const availableHeight = Math.max(1, contentRect.h - gap * 2);
        const topShare = profileApi.scaleShare(
          clampNumber(input.highTopRatio, HIGH_TOP_MIN_RATIO, HIGH_TOP_MAX_RATIO, HIGH_TOP_RATIO),
          responsive.highTopShareScale,
          HIGH_TOP_MIN_RATIO,
          HIGH_TOP_MAX_RATIO
        );
        const gaugeShare = profileApi.scaleShare(
          clampNumber(input.highGaugeRatio, HIGH_GAUGE_MIN_RATIO, HIGH_GAUGE_MAX_RATIO, HIGH_GAUGE_RATIO),
          responsive.highGaugeShareScale,
          HIGH_GAUGE_MIN_RATIO,
          HIGH_GAUGE_MAX_RATIO
        );
        const topHeight = Math.max(1, Math.floor(availableHeight * topShare));
        const gaugeHeight = Math.max(1, Math.floor(availableHeight * gaugeShare));
        const topRow = splitRow(makeRect(contentRect.x, contentRect.y, contentRect.w, topHeight), gap, 2, makeRect);
        const gaugeY = contentRect.y + topHeight + gap;
        const gaugeBar = makeRect(contentRect.x, gaugeY, contentRect.w, gaugeHeight);
        const bottomY = gaugeY + gaugeHeight + gap;
        const bottomH = Math.max(1, contentRect.y + contentRect.h - bottomY);
        const bottomRow = splitRow(makeRect(contentRect.x, bottomY, contentRect.w, bottomH), gap, 2, makeRect);
        const nameRect = reserveWaypointSpace
          ? makeRect(
            contentRect.x + Math.floor(contentRect.w * HIGH_NAME_X_RATIO),
            contentRect.y,
            Math.max(1, Math.floor(contentRect.w * HIGH_NAME_W_RATIO)),
            topHeight
          )
          : null;

        return {
          mode: mode,
          gap: gap,
          responsive: responsive,
          contentRect: contentRect,
          gaugeBar: gaugeBar,
          nameRect: nameRect,
          metricRects: {
            cog: topRow[0],
            btw: topRow[1],
            xte: bottomRow[0],
            dtw: bottomRow[1]
          }
        };
      }

      const availableHeight = Math.max(1, contentRect.h - gap);
      const gaugeShare = profileApi.scaleShare(
        clampNumber(input.normalGaugeRatio, NORMAL_GAUGE_MIN_RATIO, NORMAL_GAUGE_MAX_RATIO, NORMAL_GAUGE_RATIO),
        responsive.normalGaugeShareScale,
        NORMAL_GAUGE_MIN_RATIO,
        NORMAL_GAUGE_MAX_RATIO
      );
      const gaugeHeight = Math.max(1, Math.floor(availableHeight * gaugeShare));
      const gaugeBar = makeRect(contentRect.x, contentRect.y, contentRect.w, gaugeHeight);
      const rowY = contentRect.y + gaugeHeight + gap;
      const rowH = Math.max(1, contentRect.h - gaugeHeight - gap);
      const columns = splitRow(makeRect(contentRect.x, rowY, contentRect.w, rowH), gap, 4, makeRect);
      const nameHeight = reserveWaypointSpace
        ? Math.max(1, Math.floor(
          gaugeHeight * profileApi.scaleShare(
            clampNumber(input.normalNameHeightRatio, NORMAL_NAME_H_MIN_RATIO, NORMAL_NAME_H_MAX_RATIO, NORMAL_NAME_H_RATIO),
            responsive.normalNameHeightScale,
            NORMAL_NAME_H_MIN_RATIO,
            NORMAL_NAME_H_MAX_RATIO
          )
        ))
        : 0;
      const nameRect = reserveWaypointSpace
        ? makeRect(
          contentRect.x + Math.floor(contentRect.w * NORMAL_NAME_X_RATIO),
          contentRect.y + Math.floor(gaugeHeight * NORMAL_NAME_Y_RATIO),
          Math.max(1, Math.floor(contentRect.w * NORMAL_NAME_W_RATIO)),
          nameHeight
        )
        : null;

      return {
        mode: mode,
        gap: gap,
        responsive: responsive,
        contentRect: contentRect,
        gaugeBar: gaugeBar,
        nameRect: nameRect,
        metricRects: {
          cog: columns[0],
          xte: columns[1],
          dtw: columns[2],
          btw: columns[3]
        }
      };
    }

    return {
      id: "XteLinearLayout",
      computeMode: computeMode,
      computeInsets: computeInsets,
      createContentRect: createContentRect,
      computeLayout: computeLayout,
      computeMetricTileSpacing: computeMetricTileSpacing
    };
  }

  return { id: "XteLinearLayout", create: create };
}));
