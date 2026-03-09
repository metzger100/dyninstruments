const { loadFresh } = require("../../helpers/load-umd");

describe("ActiveRouteLayout", function () {
  function createLayout() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    return loadFresh("shared/widget-kits/nav/ActiveRouteLayout.js").create({}, {
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

  function buildSnapshot(layout, width, height, mode, isApproaching) {
    const insets = layout.computeInsets(width, height);
    const contentRect = layout.createContentRect(width, height, insets);
    return {
      insets: insets,
      contentRect: contentRect,
      out: layout.computeLayout({
        contentRect: contentRect,
        gap: insets.gap,
        namePadX: insets.namePadX,
        mode: mode,
        isApproaching: isApproaching,
        responsive: insets.responsive
      })
    };
  }

  it("derives active-route insets from minDim ratios with 1px safety floors", function () {
    const layout = createLayout();
    const compactInsets = layout.computeInsets(20, 40);
    const mediumInsets = layout.computeInsets(180, 220);

    expect(compactInsets.padX).toBe(1);
    expect(compactInsets.innerY).toBe(1);
    expect(compactInsets.gap).toBe(1);
    expect(compactInsets.namePadX).toBe(1);
    expect(mediumInsets.padX).toBe(7);
    expect(mediumInsets.innerY).toBe(6);
    expect(mediumInsets.gap).toBe(7);
  });

  it("keeps high, normal, and flat rects inside the content rect", function () {
    const layout = createLayout();
    const cases = [
      { width: 140, height: 300, mode: "high", isApproaching: true },
      { width: 260, height: 180, mode: "normal", isApproaching: false },
      { width: 280, height: 200, mode: "normal", isApproaching: true },
      { width: 560, height: 100, mode: "flat", isApproaching: true }
    ];

    cases.forEach((testCase) => {
      const snapshot = buildSnapshot(layout, testCase.width, testCase.height, testCase.mode, testCase.isApproaching);
      expectRectInside(snapshot.out.nameRect, snapshot.contentRect);
      Object.keys(snapshot.out.metricRects).forEach((key) => {
        expectRectInside(snapshot.out.metricRects[key], snapshot.contentRect);
      });
    });
  });

  it("keeps normal approach NEXT below the top metric pair", function () {
    const layout = createLayout();
    const snapshot = buildSnapshot(layout, 280, 200, "normal", true).out;

    expect(snapshot.metricRects.remain.y).toBe(snapshot.metricRects.eta.y);
    expect(snapshot.metricRects.next.y).toBeGreaterThan(snapshot.metricRects.remain.y);
    expect(snapshot.metricRects.next.w).toBeGreaterThan(snapshot.metricRects.remain.w);
  });

  it("compacts flat and normal name shares monotonically across compact, medium, and large widgets", function () {
    const layout = createLayout();
    const compactFlat = buildSnapshot(layout, 220, 80, "flat", false);
    const mediumFlat = buildSnapshot(layout, 320, 100, "flat", false);
    const largeFlat = buildSnapshot(layout, 560, 160, "flat", false);
    const compactNormal = buildSnapshot(layout, 161, 80, "normal", false);
    const mediumNormal = buildSnapshot(layout, 220, 120, "normal", false);
    const largeNormal = buildSnapshot(layout, 800, 400, "normal", false);

    expect(compactFlat.out.nameRect.w / compactFlat.contentRect.w).toBeLessThan(
      mediumFlat.out.nameRect.w / mediumFlat.contentRect.w
    );
    expect(mediumFlat.out.nameRect.w / mediumFlat.contentRect.w).toBeLessThan(
      largeFlat.out.nameRect.w / largeFlat.contentRect.w
    );
    expect(compactNormal.out.nameRect.h / compactNormal.contentRect.h).toBeLessThan(
      mediumNormal.out.nameRect.h / mediumNormal.contentRect.h
    );
    expect(mediumNormal.out.nameRect.h / mediumNormal.contentRect.h).toBeLessThan(
      largeNormal.out.nameRect.h / largeNormal.contentRect.h
    );
    expect(compactNormal.out.responsive.textFillScale).toBeGreaterThan(
      mediumNormal.out.responsive.textFillScale
    );
    expect(mediumNormal.out.responsive.textFillScale).toBeGreaterThan(
      largeNormal.out.responsive.textFillScale
    );
  });

  it("derives metric-tile spacing from compact layout-owned responsive state", function () {
    const layout = createLayout();
    const compact = buildSnapshot(layout, 161, 80, "normal", true).out;
    const large = buildSnapshot(layout, 520, 180, "flat", true).out;
    const compactSpacing = layout.computeMetricTileSpacing(compact.metricRects.remain, compact.responsive);
    const largeSpacing = layout.computeMetricTileSpacing(large.metricRects.remain, large.responsive);

    expect(compactSpacing.padX).toBeLessThan(largeSpacing.padX);
    expect(compactSpacing.captionHeightPx).toBeLessThan(largeSpacing.captionHeightPx);
  });
});
