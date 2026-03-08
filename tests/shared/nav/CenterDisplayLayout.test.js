const { loadFresh } = require("../../helpers/load-umd");

describe("CenterDisplayLayout", function () {
  function createLayout() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    return loadFresh("shared/widget-kits/nav/CenterDisplayLayout.js").create({}, {
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

  function buildSnapshot(layout, width, height, mode, relationCount) {
    const insets = layout.computeInsets(width, height);
    const contentRect = layout.createContentRect(width, height, insets);
    const out = layout.computeLayout({
      contentRect: contentRect,
      mode: mode,
      relationCount: relationCount,
      gap: insets.gap,
      responsive: insets.responsive,
      normalCaptionShare: 0.28,
      flatCenterShare: 0.42,
      highCaptionRatio: 0.24,
      flatCaptionRatio: 0.22
    });
    return {
      insets: insets,
      contentRect: contentRect,
      out: out
    };
  }

  it("derives center-display insets from minDim ratios with 1px safety floors", function () {
    const layout = createLayout();
    const compactInsets = layout.computeInsets(20, 50);
    const mediumInsets = layout.computeInsets(140, 220);

    expect(compactInsets.padX).toBe(1);
    expect(compactInsets.innerY).toBe(1);
    expect(compactInsets.gap).toBe(1);

    expect(mediumInsets.padX).toBe(4);
    expect(mediumInsets.innerY).toBe(2);
    expect(mediumInsets.gap).toBe(4);
  });

  it("keeps compact normal-mode panels and rows inside the content rect", function () {
    const layout = createLayout();
    const cases = [
      { width: 120, height: 60, relationCount: 2 },
      { width: 120, height: 80, relationCount: 3 },
      { width: 140, height: 90, relationCount: 3 }
    ];

    cases.forEach((testCase) => {
      const snapshot = buildSnapshot(layout, testCase.width, testCase.height, "normal", testCase.relationCount);
      const contentRect = snapshot.contentRect;
      const out = snapshot.out;

      expectRectInside(out.center.rect, contentRect);
      expectRectInside(out.center.captionRect, out.center.rect);
      expectRectInside(out.center.latRect, out.center.rect);
      expectRectInside(out.center.lonRect, out.center.rect);
      out.rowRects.forEach((rect, index) => {
        expectRectInside(rect, contentRect);
        expect(rect.h).toBeGreaterThanOrEqual(Math.floor(contentRect.h * 0.12));
        if (index > 0) {
          expect(rect.y).toBeGreaterThan(out.rowRects[index - 1].y);
        }
      });
    });
  });

  it("scales compact row heights with available space and row count", function () {
    const layout = createLayout();
    const compactThreeRows = buildSnapshot(layout, 120, 60, "normal", 3).out;
    const tallerThreeRows = buildSnapshot(layout, 120, 80, "normal", 3).out;
    const tallerTwoRows = buildSnapshot(layout, 120, 80, "normal", 2).out;

    expect(tallerThreeRows.rowRects[0].h).toBeGreaterThan(compactThreeRows.rowRects[0].h);
    expect(tallerTwoRows.rowRects[0].h).toBeGreaterThan(tallerThreeRows.rowRects[0].h);
  });

  it("applies linear caption-share and text-fill compaction on compact normal tiles", function () {
    const layout = createLayout();
    const compact = buildSnapshot(layout, 120, 80, "normal", 2);
    const medium = buildSnapshot(layout, 140, 90, "normal", 2);
    const large = buildSnapshot(layout, 260, 180, "normal", 2);

    expect(compact.out.center.captionRect.w / compact.out.center.rect.w).toBeLessThan(
      large.out.center.captionRect.w / large.out.center.rect.w
    );
    expect(compact.out.responsive.textFillScale).toBeGreaterThan(medium.out.responsive.textFillScale);
    expect(medium.out.responsive.textFillScale).toBeGreaterThan(large.out.responsive.textFillScale);
    expect(compact.out.responsive.normalCaptionShareScale).toBeLessThan(medium.out.responsive.normalCaptionShareScale);
    expect(medium.out.responsive.normalCaptionShareScale).toBeLessThan(large.out.responsive.normalCaptionShareScale);
    expect(compact.out.responsive.flatCenterShareScale).toBeLessThan(medium.out.responsive.flatCenterShareScale);
    expect(medium.out.responsive.flatCenterShareScale).toBeLessThan(large.out.responsive.flatCenterShareScale);
    expect(compact.out.responsive.stackedCaptionScale).toBeLessThan(medium.out.responsive.stackedCaptionScale);
    expect(medium.out.responsive.stackedCaptionScale).toBeLessThan(large.out.responsive.stackedCaptionScale);
    expect(compact.out.responsive.highCenterWeightScale).toBeLessThan(medium.out.responsive.highCenterWeightScale);
    expect(medium.out.responsive.highCenterWeightScale).toBeLessThan(large.out.responsive.highCenterWeightScale);
  });

  it("balances the first coordinate row and last relation row against the outer edges in normal mode", function () {
    const layout = createLayout();
    const cases = [
      { width: 260, height: 180, relationCount: 2 },
      { width: 260, height: 180, relationCount: 3 }
    ];

    cases.forEach((testCase) => {
      const snapshot = buildSnapshot(layout, testCase.width, testCase.height, "normal", testCase.relationCount);
      const contentRect = snapshot.contentRect;
      const out = snapshot.out;
      const firstCoordCenter = out.center.latRect.y + Math.floor(out.center.latRect.h / 2);
      const lastRow = out.rowRects[out.rowRects.length - 1];
      const lastRowCenter = lastRow.y + Math.floor(lastRow.h / 2);
      const topMargin = firstCoordCenter - contentRect.y;
      const bottomMargin = (contentRect.y + contentRect.h) - lastRowCenter;

      expect(Math.abs(topMargin - bottomMargin)).toBeLessThanOrEqual(1);
    });
  });

  it("compacts flat mode center share and caption band on smaller wide tiles", function () {
    const layout = createLayout();
    const compact = buildSnapshot(layout, 220, 80, "flat", 2);
    const large = buildSnapshot(layout, 520, 180, "flat", 2);

    expectRectInside(compact.out.center.rect, compact.contentRect);
    compact.out.rowRects.forEach((rect) => expectRectInside(rect, compact.contentRect));
    expect(compact.out.center.rect.w / compact.contentRect.w).toBeLessThan(large.out.center.rect.w / large.contentRect.w);
    expect(compact.out.center.captionRect.h / compact.out.center.rect.h).toBeLessThan(
      large.out.center.captionRect.h / large.out.center.rect.h
    );
  });

  it("compacts high mode caption band and center weight on smaller tall tiles", function () {
    const layout = createLayout();
    const compact = buildSnapshot(layout, 120, 140, "high", 2);
    const large = buildSnapshot(layout, 180, 260, "high", 2);

    expectRectInside(compact.out.center.rect, compact.contentRect);
    compact.out.rowRects.forEach((rect) => expectRectInside(rect, compact.contentRect));
    expect(compact.out.center.rect.h / compact.contentRect.h).toBeLessThan(large.out.center.rect.h / large.contentRect.h);
    expect(compact.out.center.captionRect.h / compact.out.center.rect.h).toBeLessThan(
      large.out.center.captionRect.h / large.out.center.rect.h
    );
  });
});
