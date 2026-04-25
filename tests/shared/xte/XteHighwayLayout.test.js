const { loadFresh } = require("../../helpers/load-umd");

describe("XteHighwayLayout", function () {
  function createLayout() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    return loadFresh("shared/widget-kits/xte/XteHighwayLayout.js").create({}, {
      getModule(id) {
        if (id === "ResponsiveScaleProfile") {
          return responsiveScaleProfile;
        }
        if (id === "LayoutRectMath") {
          return loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
        }
        throw new Error("unexpected module: " + id);
      }
    });
  }

  function expectRectInside(inner, outer) {
    expect(inner.x).toBeGreaterThanOrEqual(outer.x);
    expect(inner.y).toBeGreaterThanOrEqual(outer.y);
    expect(inner.x + inner.w).toBeLessThanOrEqual(outer.x + outer.w);
    expect(inner.y + inner.h).toBeLessThanOrEqual(outer.y + outer.h);
  }

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
        hideTextualMetrics: cfg.hideTextualMetrics === true,
        showWpName: cfg.showWpName !== false,
        hasWaypointName: cfg.hasWaypointName !== false,
        responsive: insets.responsive
      })
    };
  }

  it("selects flat, normal, and high modes from aspect ratio", function () {
    const layout = createLayout();

    expect(layout.computeMode(480, 120, 0.85, 2.3)).toBe("flat");
    expect(layout.computeMode(220, 220, 0.85, 2.3)).toBe("normal");
    expect(layout.computeMode(120, 300, 0.85, 2.3)).toBe("high");
  });

  it("keeps flat, normal, and high geometry inside the content rect", function () {
    const layout = createLayout();
    const cases = [
      { width: 480, height: 120, mode: "flat" },
      { width: 220, height: 220, mode: "normal" },
      { width: 120, height: 300, mode: "high" }
    ];

    cases.forEach((testCase) => {
      const snapshot = buildSnapshot(layout, testCase.width, testCase.height, testCase.mode);
      expectRectInside(snapshot.out.highway, snapshot.contentRect);
      expectRectInside(snapshot.out.nameRect, snapshot.contentRect);
      Object.keys(snapshot.out.metricRects).forEach((key) => {
        expectRectInside(snapshot.out.metricRects[key], snapshot.contentRect);
      });
    });
  });

  it("reclaims flat header space for metric rows when waypoint name is disabled", function () {
    const layout = createLayout();
    const withName = buildSnapshot(layout, 480, 120, "flat", {
      showWpName: true,
      hasWaypointName: true
    }).out;
    const withoutName = buildSnapshot(layout, 480, 120, "flat", {
      showWpName: false,
      hasWaypointName: true
    }).out;

    expect(withName.mode).toBe("flat");
    expect(withoutName.mode).toBe("flat");
    expect(withoutName.metricRects.cog.y).toBeLessThan(withName.metricRects.cog.y);
    expect(withoutName.metricRects.cog.h).toBeGreaterThan(withName.metricRects.cog.h);
  });

  it("compacts flat highway share and normal name height monotonically across compact, medium, and large widgets", function () {
    const layout = createLayout();
    const compactFlat = buildSnapshot(layout, 220, 80, "flat", {
      showWpName: true,
      hasWaypointName: true
    });
    const mediumFlat = buildSnapshot(layout, 320, 120, "flat", {
      showWpName: true,
      hasWaypointName: true
    });
    const largeFlat = buildSnapshot(layout, 520, 180, "flat", {
      showWpName: true,
      hasWaypointName: true
    });
    const compactNormal = buildSnapshot(layout, 161, 80, "normal", {
      showWpName: true,
      hasWaypointName: true
    });
    const mediumNormal = buildSnapshot(layout, 220, 120, "normal", {
      showWpName: true,
      hasWaypointName: true
    });
    const largeNormal = buildSnapshot(layout, 800, 400, "normal", {
      showWpName: true,
      hasWaypointName: true
    });

    expect(compactFlat.out.highway.w / compactFlat.contentRect.w).toBeLessThan(
      mediumFlat.out.highway.w / mediumFlat.contentRect.w
    );
    expect(mediumFlat.out.highway.w / mediumFlat.contentRect.w).toBeLessThan(
      largeFlat.out.highway.w / largeFlat.contentRect.w
    );
    expect(compactNormal.out.nameRect.h / compactNormal.out.highway.h).toBeLessThan(
      mediumNormal.out.nameRect.h / mediumNormal.out.highway.h
    );
    expect(mediumNormal.out.nameRect.h / mediumNormal.out.highway.h).toBeLessThan(
      largeNormal.out.nameRect.h / largeNormal.out.highway.h
    );
    expect(compactNormal.out.responsive.textFillScale).toBeGreaterThan(
      mediumNormal.out.responsive.textFillScale
    );
    expect(mediumNormal.out.responsive.textFillScale).toBeGreaterThan(
      largeNormal.out.responsive.textFillScale
    );
  });

  it("keeps high-mode metric columns balanced", function () {
    const layout = createLayout();
    const snapshot = buildSnapshot(layout, 120, 300, "high", {
      showWpName: true,
      hasWaypointName: true
    }).out;

    expect(snapshot.metricRects.cog.w).toBe(snapshot.metricRects.btw.w);
    expect(snapshot.metricRects.xte.w).toBe(snapshot.metricRects.dtw.w);
    expect(snapshot.metricRects.cog.h).toBe(snapshot.nameRect.h);
  });

  it("derives metric-tile spacing from compact layout-owned responsive state", function () {
    const layout = createLayout();
    const compact = buildSnapshot(layout, 161, 80, "normal", {
      showWpName: true,
      hasWaypointName: true
    }).out;
    const large = buildSnapshot(layout, 520, 180, "flat", {
      showWpName: true,
      hasWaypointName: true
    }).out;
    const compactSpacing = layout.computeMetricTileSpacing(compact.metricRects.cog, compact.responsive);
    const largeSpacing = layout.computeMetricTileSpacing(large.metricRects.cog, large.responsive);

    expect(compactSpacing.padX).toBeLessThan(largeSpacing.padX);
    expect(compactSpacing.captionHeightPx).toBeLessThan(largeSpacing.captionHeightPx);
  });

  it("returns graphics-only geometry with no text rects when textual metrics are hidden", function () {
    const layout = createLayout();
    const snapshot = buildSnapshot(layout, 480, 120, "flat", {
      hideTextualMetrics: true
    }).out;

    expect(snapshot.nameRect).toBeNull();
    expect(snapshot.metricRects).toBeNull();
    expect(snapshot.highway.w).toBe(snapshot.contentRect.w);
    expect(snapshot.highway.h).toBe(snapshot.contentRect.h);
  });
});
