const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("XteLinearLayout", function () {
  function createLayout() {
    return loadFresh("shared/widget-kits/xte/XteLinearLayout.js").create(
      {},
      createComponentContextMock({
        modules: {
          ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
          LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
          LayoutSizingHelpers: loadFresh("shared/widget-kits/layout/LayoutSizingHelpers.js"),
          ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js")
        }
      })
    );
  }

  /** @param {any} inner @param {any} outer */
  function expectRectInside(inner, outer) {
    expect(inner.x).toBeGreaterThanOrEqual(outer.x);
    expect(inner.y).toBeGreaterThanOrEqual(outer.y);
    expect(inner.x + inner.w).toBeLessThanOrEqual(outer.x + outer.w);
    expect(inner.y + inner.h).toBeLessThanOrEqual(outer.y + outer.h);
  }

  /**
   * @param {any} layout
   * @param {number} width
   * @param {number} height
   * @param {string} mode
   * @param {Record<string, any>} [options]
   */
  function buildSnapshot(layout, width, height, mode, options) {
    const cfg = options || {};
    const insets = layout.computeInsets(width, height);
    const contentRect = layout.createContentRect(width, height, insets);
    return {
      insets: insets,
      contentRect: contentRect,
      out: layout.computeLayout({
        contentRect: contentRect,
        gap: insets.gap,
        mode: mode,
        responsive: insets.responsive,
        hideTextualMetrics: cfg.hideTextualMetrics === true,
        showWpName: cfg.showWpName === true,
        hasWaypointName: cfg.hasWaypointName === true
      })
    };
  }

  it("selects flat, normal, and high modes from aspect ratio", function () {
    const layout = createLayout();

    expect(layout.computeMode(460, 120, 0.85, 2.3)).toBe("flat");
    expect(layout.computeMode(220, 220, 0.85, 2.3)).toBe("normal");
    expect(layout.computeMode(120, 300, 0.85, 2.3)).toBe("high");
  });

  it("returns finite positive insets for representative widget sizes", function () {
    const layout = createLayout();
    const sizes = [
      { w: 120, h: 300 },
      { w: 220, h: 220 },
      { w: 480, h: 120 }
    ];

    sizes.forEach(function (size) {
      const insets = layout.computeInsets(size.w, size.h);
      expect(Number.isFinite(insets.padX)).toBe(true);
      expect(Number.isFinite(insets.padY)).toBe(true);
      expect(Number.isFinite(insets.gap)).toBe(true);
      expect(insets.padX).toBeGreaterThanOrEqual(1);
      expect(insets.padY).toBeGreaterThanOrEqual(1);
      expect(insets.gap).toBeGreaterThanOrEqual(1);
      expect(insets.responsive).toBeTruthy();
    });
  });

  it("computes flat mode with gauge left and metrics right", function () {
    const layout = createLayout();
    const snapshot = buildSnapshot(layout, 520, 160, "flat", {
      showWpName: true,
      hasWaypointName: true
    });
    const out = snapshot.out;

    expect(out.mode).toBe("flat");
    expectRectInside(out.gaugeBar, snapshot.contentRect);
    expectRectInside(out.nameRect, snapshot.contentRect);
    expectRectInside(out.metricRects.cog, snapshot.contentRect);
    expectRectInside(out.metricRects.btw, snapshot.contentRect);
    expectRectInside(out.metricRects.xte, snapshot.contentRect);
    expectRectInside(out.metricRects.dtw, snapshot.contentRect);
    expect(out.metricRects.cog.x).toBeGreaterThan(out.gaugeBar.x + out.gaugeBar.w);
    expect(out.metricRects.btw.x).toBeGreaterThan(out.metricRects.cog.x);
    expect(out.metricRects.xte.y).toBeGreaterThan(out.metricRects.cog.y);
  });

  it("computes normal mode with gauge on top and four metric columns below", function () {
    const layout = createLayout();
    const snapshot = buildSnapshot(layout, 260, 220, "normal", {
      showWpName: true,
      hasWaypointName: true
    });
    const out = snapshot.out;

    expect(out.mode).toBe("normal");
    expect(out.metricRects.cog.y).toBeGreaterThan(out.gaugeBar.y);
    expect(out.metricRects.cog.y).toBeGreaterThanOrEqual(out.gaugeBar.y + out.gaugeBar.h);
    expect(out.metricRects.cog.y).toBe(out.metricRects.xte.y);
    expect(out.metricRects.cog.y).toBe(out.metricRects.dtw.y);
    expect(out.metricRects.cog.y).toBe(out.metricRects.btw.y);
    expect(out.metricRects.cog.x).toBeLessThan(out.metricRects.xte.x);
    expect(out.metricRects.xte.x).toBeLessThan(out.metricRects.dtw.x);
    expect(out.metricRects.dtw.x).toBeLessThan(out.metricRects.btw.x);
    expect(out.nameRect).not.toBeNull();
  });

  it("computes high mode with top/bottom strips around the gauge bar", function () {
    const layout = createLayout();
    const snapshot = buildSnapshot(layout, 140, 320, "high", {
      showWpName: true,
      hasWaypointName: true
    });
    const out = snapshot.out;

    expect(out.mode).toBe("high");
    expect(out.metricRects.cog.y).toBeLessThan(out.gaugeBar.y);
    expect(out.metricRects.btw.y).toBeLessThan(out.gaugeBar.y);
    expect(out.metricRects.xte.y).toBeGreaterThan(out.gaugeBar.y);
    expect(out.metricRects.dtw.y).toBeGreaterThan(out.gaugeBar.y);
    expect(out.metricRects.cog.w).toBe(out.metricRects.btw.w);
    expect(out.metricRects.xte.w).toBe(out.metricRects.dtw.w);
    expect(out.nameRect).not.toBeNull();
  });

  it("uses graphics-only layout when textual metrics are hidden", function () {
    const layout = createLayout();
    const snapshot = buildSnapshot(layout, 480, 120, "flat", {
      hideTextualMetrics: true
    });

    expect(snapshot.out.nameRect).toBeNull();
    expect(snapshot.out.metricRects).toBeNull();
    expect(snapshot.out.gaugeBar).toEqual(snapshot.contentRect);
  });

  it("toggles waypoint name rect from showWpName and hasWaypointName", function () {
    const layout = createLayout();
    const withName = buildSnapshot(layout, 260, 220, "normal", {
      showWpName: true,
      hasWaypointName: true
    }).out;
    const withoutToggle = buildSnapshot(layout, 260, 220, "normal", {
      showWpName: false,
      hasWaypointName: true
    }).out;
    const withoutValue = buildSnapshot(layout, 260, 220, "normal", {
      showWpName: true,
      hasWaypointName: false
    }).out;

    expect(withName.nameRect).not.toBeNull();
    expect(withoutToggle.nameRect).toBeNull();
    expect(withoutValue.nameRect).toBeNull();
  });

  it("returns finite metric tile spacing values", function () {
    const layout = createLayout();
    const snapshot = buildSnapshot(layout, 260, 220, "normal", {
      showWpName: true,
      hasWaypointName: true
    });
    const spacing = layout.computeMetricTileSpacing(snapshot.out.metricRects.cog, snapshot.out.responsive);

    expect(Number.isFinite(spacing.padX)).toBe(true);
    expect(Number.isFinite(spacing.captionHeightPx)).toBe(true);
    expect(spacing.padX).toBeGreaterThan(0);
    expect(spacing.captionHeightPx).toBeGreaterThan(0);
  });

  it("keeps responsive text scale finite and non-zero in compact layouts", function () {
    const layout = createLayout();
    const compact = buildSnapshot(layout, 150, 100, "normal", {
      showWpName: true,
      hasWaypointName: true
    }).out;
    const large = buildSnapshot(layout, 640, 360, "normal", {
      showWpName: true,
      hasWaypointName: true
    }).out;

    expect(Number.isFinite(compact.responsive.textFillScale)).toBe(true);
    expect(compact.responsive.textFillScale).toBeGreaterThan(0);
    expect(compact.responsive.textFillScale).toBeGreaterThan(large.responsive.textFillScale);
  });
});
