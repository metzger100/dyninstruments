/**
 * @file ActiveRouteLayout - Responsive layout rectangles for the ActiveRoute text renderer
 * Documentation: documentation/widgets/active-route.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniActiveRouteLayout = factory();
  }
}(this, function () {
  "use strict";

  const PAD_X_RATIO = 0.04;
  const INNER_Y_RATIO = 0.035;
  const GAP_RATIO = 0.04;
  const NAME_PAD_X_RATIO = 0.025;
  const METRIC_TILE_PAD_RATIO = 0.04;
  const METRIC_TILE_CAPTION_RATIO = 0.34;
  const NAME_PANEL_RATIO_FLAT = 0.38;
  const NAME_BAND_RATIO_HIGH = 0.22;
  const NAME_BAND_RATIO_NORMAL = 0.34;
  const NORMAL_APPROACH_TOP_RATIO = 0.52;
  const FLAT_NAME_MIN_RATIO = 0.24;
  const FLAT_NAME_MAX_RATIO = 0.46;
  const HIGH_NAME_MIN_RATIO = 0.16;
  const HIGH_NAME_MAX_RATIO = 0.28;
  const NORMAL_NAME_MIN_RATIO = 0.24;
  const NORMAL_NAME_MAX_RATIO = 0.4;
  const RESPONSIVE_SCALES = {
    textFillScale: 1.18,
    flatNameShareScale: 0.84,
    highNameBandScale: 0.88,
    normalNameBandScale: 0.9
  };
  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniActiveRouteLayoutApi}
   */
  function create(def, componentContext) {
    const profileApi = componentContext.components.require("ResponsiveScaleProfile");
    const rectApi = componentContext.components.require("LayoutRectMath");
    const sizingHelpers = componentContext.components.require("LayoutSizingHelpers");
    const clampNumber = componentContext.components.require("ValueMath").clampNumber;
    const makeRect = rectApi.makeRect;
    const createContentRect = sizingHelpers.createInsetContentRectFactory(makeRect, "padX", "innerY");
    const computeMetricTileSpacing = sizingHelpers.createMetricTileSpacingFactory(
      profileApi,
      METRIC_TILE_PAD_RATIO,
      METRIC_TILE_CAPTION_RATIO
    );

    /**
     * @param {unknown} W
     * @param {unknown} H
     * @returns {DyniActiveRouteInsets}
     */
    function computeInsets(W, H) {
      const responsive = profileApi.computeProfile(W, H, { scales: RESPONSIVE_SCALES });
      return {
        padX: profileApi.computeInsetPx(responsive, PAD_X_RATIO, 1),
        innerY: profileApi.computeInsetPx(responsive, INNER_Y_RATIO, 1),
        gap: profileApi.computeInsetPx(responsive, GAP_RATIO, 1),
        namePadX: profileApi.computeInsetPx(responsive, NAME_PAD_X_RATIO, 1),
        responsive: responsive
      };
    }

    /**
     * @param {DyniActiveRouteLayoutArgs | undefined} args
     * @returns {DyniActiveRouteLayoutResult}
     */
    function computeLayout(args) {
      const cfg = args || {};
      const contentRect = cfg.contentRect || makeRect(0, 0, 0, 0);
      const responsive = cfg.responsive || profileApi.computeProfile(contentRect.w, contentRect.h, { scales: RESPONSIVE_SCALES });
      const gap = Math.max(0, Math.floor(clampNumber(
        cfg.gap,
        0,
        Math.max(contentRect.w, contentRect.h),
        profileApi.computeInsetPx(responsive, GAP_RATIO, 1)
      )));
      const namePadX = Math.max(0, Math.floor(clampNumber(
        cfg.namePadX,
        0,
        Math.max(contentRect.w, contentRect.h),
        profileApi.computeInsetPx(responsive, NAME_PAD_X_RATIO, 1)
      )));
      const mode = /** @type {DyniActiveRouteLayoutMode} */ (
        cfg.mode === "high" || cfg.mode === "flat" ? cfg.mode : "normal"
      );
      const isApproaching = cfg.isApproaching === true;
      const layout = {
        mode: mode,
        gap: gap,
        namePadX: namePadX,
        responsive: responsive,
        nameRect: makeRect(0, 0, 0, 0),
        metricRects: /** @type {DyniActiveRouteMetricRects} */ (Object.create(null))
      };

      if (mode === "flat") {
        const nameShare = profileApi.scaleShare(
          clampNumber(cfg.flatNameShare, FLAT_NAME_MIN_RATIO, FLAT_NAME_MAX_RATIO, NAME_PANEL_RATIO_FLAT),
          responsive.flatNameShareScale,
          FLAT_NAME_MIN_RATIO,
          FLAT_NAME_MAX_RATIO
        );
        const usableWidth = Math.max(1, contentRect.w - gap);
        const nameWidth = Math.max(1, Math.floor(usableWidth * nameShare));
        const metricsRect = makeRect(
          contentRect.x + nameWidth + gap,
          contentRect.y,
          Math.max(1, contentRect.w - nameWidth - gap),
          contentRect.h
        );
        const metricColumns = rectApi.splitRow(metricsRect, gap, isApproaching ? 3 : 2, rectApi.makeRect);
        layout.nameRect = makeRect(contentRect.x, contentRect.y, nameWidth, contentRect.h);
        layout.metricRects.remain = metricColumns[0];
        layout.metricRects.rteEta = metricColumns[1];
        if (isApproaching) {
          layout.metricRects.next = metricColumns[2];
        }
        return layout;
      }

      const nameShare = mode === "high"
        ? profileApi.scaleShare(
          clampNumber(cfg.highNameBandRatio, HIGH_NAME_MIN_RATIO, HIGH_NAME_MAX_RATIO, NAME_BAND_RATIO_HIGH),
          responsive.highNameBandScale,
          HIGH_NAME_MIN_RATIO,
          HIGH_NAME_MAX_RATIO
        )
        : profileApi.scaleShare(
          clampNumber(cfg.normalNameBandRatio, NORMAL_NAME_MIN_RATIO, NORMAL_NAME_MAX_RATIO, NAME_BAND_RATIO_NORMAL),
          responsive.normalNameBandScale,
          NORMAL_NAME_MIN_RATIO,
          NORMAL_NAME_MAX_RATIO
        );
      const nameHeight = Math.max(1, Math.floor(contentRect.h * nameShare));
      const metricsRect = makeRect(
        contentRect.x,
        contentRect.y + nameHeight + gap,
        contentRect.w,
        Math.max(1, contentRect.h - nameHeight - gap)
      );
      layout.nameRect = makeRect(contentRect.x, contentRect.y, contentRect.w, nameHeight);

      if (mode === "high") {
        const metricRows = rectApi.splitStack(metricsRect, gap, isApproaching ? 3 : 2, rectApi.makeRect);
        layout.metricRects.remain = metricRows[0];
        layout.metricRects.rteEta = metricRows[1];
        if (isApproaching) {
          layout.metricRects.next = metricRows[2];
        }
        return layout;
      }

      if (!isApproaching) {
        const metricColumns = rectApi.splitRow(metricsRect, gap, 2, rectApi.makeRect);
        layout.metricRects.remain = metricColumns[0];
        layout.metricRects.rteEta = metricColumns[1];
        return layout;
      }

      const topHeight = Math.max(1, Math.floor(Math.max(1, metricsRect.h - gap) * NORMAL_APPROACH_TOP_RATIO));
      const topRect = makeRect(metricsRect.x, metricsRect.y, metricsRect.w, topHeight);
      const bottomRect = makeRect(
        metricsRect.x,
        metricsRect.y + topHeight + gap,
        metricsRect.w,
        Math.max(1, metricsRect.h - topHeight - gap)
      );
      const topColumns = rectApi.splitRow(topRect, gap, 2, rectApi.makeRect);
      layout.metricRects.remain = topColumns[0];
      layout.metricRects.rteEta = topColumns[1];
      layout.metricRects.next = bottomRect;
      return layout;
    }

    return {
      id: "ActiveRouteLayout",
      computeInsets: computeInsets,
      createContentRect: createContentRect,
      computeLayout: computeLayout,
      computeMetricTileSpacing: computeMetricTileSpacing
    };
  }

  return { id: "ActiveRouteLayout", create: create };
}));
